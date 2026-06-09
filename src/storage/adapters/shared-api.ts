import { bodyToArrayBuffer } from "../body";
import type { PutObjectInput, StorageAdapter } from "../types";

type SharedApiStorageOptions = {
	baseUrl: string;
	token: string;
};

export class SharedApiStorageAdapter implements StorageAdapter {
	readonly adapterName = "shared-api";

	private readonly baseUrl: string;
	private readonly token: string;

	constructor(options: SharedApiStorageOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, "");
		this.token = options.token;
	}

	async putObject(input: PutObjectInput): Promise<{ key: string }> {
		const response = await fetch(`${this.baseUrl}/internal/uploads`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": input.contentType ?? "application/octet-stream",
				"X-Object-Key": input.key,
			},
			body: await bodyToArrayBuffer(input.body),
		});
		if (!response.ok) throw new Error(`Shared storage API upload failed with HTTP ${response.status}.`);
		return (await response.json()) as { key: string };
	}

	async getObject(key: string) {
		const response = await fetch(`${this.baseUrl}/internal/uploads/${encodeURIComponent(key)}`, {
			headers: { Authorization: `Bearer ${this.token}` },
		});
		if (response.status === 404) return { body: null };
		if (!response.ok) throw new Error(`Shared storage API download failed with HTTP ${response.status}.`);
		return {
			body: response.body,
			contentType: response.headers.get("content-type") ?? undefined,
		};
	}

	async deleteObject(key: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/internal/uploads/${encodeURIComponent(key)}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${this.token}` },
		});
		if (!response.ok && response.status !== 404) throw new Error(`Shared storage API delete failed with HTTP ${response.status}.`);
	}
}
