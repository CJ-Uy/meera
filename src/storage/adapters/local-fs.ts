import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { bodyToArrayBuffer } from "../body";
import type { PutObjectInput, StorageAdapter } from "../types";

export class LocalFileStorageAdapter implements StorageAdapter {
	readonly adapterName = "local-fs";

	constructor(private readonly rootDir: string) {}

	async putObject(input: PutObjectInput): Promise<{ key: string }> {
		const target = this.safePath(input.key);
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.writeFile(target, Buffer.from(await bodyToArrayBuffer(input.body)));
		if (input.contentType) {
			await fs.writeFile(`${target}.content-type`, input.contentType);
		}
		return { key: input.key };
	}

	async getObject(key: string) {
		const target = this.safePath(key);
		try {
			await fs.access(target);
		} catch {
			return { body: null };
		}

		const contentType = await fs.readFile(`${target}.content-type`, "utf8").catch(() => undefined);
		return {
			body: Readable.toWeb(createReadStream(target)) as ReadableStream,
			contentType,
		};
	}

	async deleteObject(key: string): Promise<void> {
		const target = this.safePath(key);
		await fs.rm(target, { force: true });
		await fs.rm(`${target}.content-type`, { force: true });
	}

	private safePath(key: string) {
		const root = path.resolve(this.rootDir);
		const target = path.resolve(root, key);
		if (!target.startsWith(root + path.sep) && target !== root) {
			throw new Error("Storage key escapes the local storage directory.");
		}
		return target;
	}
}
