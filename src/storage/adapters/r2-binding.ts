import type { StorageAdapter, PutObjectInput } from "../types";

export class R2BindingStorageAdapter implements StorageAdapter {
	readonly adapterName = "r2-binding";

	constructor(private readonly bucket: R2Bucket) {}

	async putObject(input: PutObjectInput): Promise<{ key: string }> {
		await this.bucket.put(input.key, input.body, {
			httpMetadata: input.contentType ? { contentType: input.contentType } : undefined,
		});
		return { key: input.key };
	}

	async getObject(key: string) {
		const object = await this.bucket.get(key);
		return {
			body: object?.body ?? null,
			contentType: object?.httpMetadata?.contentType,
		};
	}

	async deleteObject(key: string): Promise<void> {
		await this.bucket.delete(key);
	}
}
