import { getOptionalCloudflareEnv } from "@/server/cloudflare";
import { getAppEnv, type AppEnv } from "@/server/env";
import { R2BindingStorageAdapter } from "./adapters/r2-binding";
import { SharedApiStorageAdapter } from "./adapters/shared-api";
import type { PutObjectInput, StorageAdapter } from "./types";

class LazyStorageAdapter implements StorageAdapter {
	constructor(
		readonly adapterName: string,
		private readonly load: () => Promise<StorageAdapter>,
	) {}

	private adapter?: Promise<StorageAdapter>;

	private getAdapter() {
		this.adapter ??= this.load();
		return this.adapter;
	}

	async putObject(input: PutObjectInput) {
		return (await this.getAdapter()).putObject(input);
	}

	async getObject(key: string) {
		return (await this.getAdapter()).getObject(key);
	}

	async deleteObject(key: string) {
		return (await this.getAdapter()).deleteObject(key);
	}
}

export function getStorageAdapterName(env: AppEnv = getAppEnv()) {
	if (env.APP_ENV === "production") return "r2-binding";
	if (env.STORAGE_MODE === "binding") return "r2-binding";
	if (env.STORAGE_MODE === "api") return "shared-api";
	if (env.STORAGE_MODE === "r2-s3") return "r2-s3";
	return "local-fs";
}

export function getStorageAdapter(env: AppEnv = getAppEnv()): StorageAdapter {
	const adapterName = getStorageAdapterName(env);

	if (adapterName === "r2-binding") {
		const bucket = getOptionalCloudflareEnv()?.BUCKET;
		if (!bucket) throw new Error("Cloudflare R2 binding BUCKET is required for this storage mode.");
		return new R2BindingStorageAdapter(bucket);
	}

	if (adapterName === "shared-api") {
		if (!env.SHARED_API_BASE_URL || !env.SHARED_API_TOKEN) throw new Error("Shared storage API credentials are not configured.");
		return new SharedApiStorageAdapter({ baseUrl: env.SHARED_API_BASE_URL, token: env.SHARED_API_TOKEN });
	}

	if (adapterName === "r2-s3") {
		return new LazyStorageAdapter("r2-s3", async () => {
			if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET_NAME || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT) {
				throw new Error("R2 S3-compatible credentials are not configured.");
			}
			const { R2S3StorageAdapter } = await import("./adapters/r2-s3");
			return new R2S3StorageAdapter({
				accountId: env.R2_ACCOUNT_ID,
				bucketName: env.R2_BUCKET_NAME,
				accessKeyId: env.R2_ACCESS_KEY_ID,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY,
				endpoint: env.R2_ENDPOINT,
			});
		});
	}

	return new LazyStorageAdapter("local-fs", async () => {
		const { LocalFileStorageAdapter } = await import("./adapters/local-fs");
		return new LocalFileStorageAdapter(env.LOCAL_STORAGE_DIR);
	});
}

export type { PutObjectInput, StorageAdapter } from "./types";
