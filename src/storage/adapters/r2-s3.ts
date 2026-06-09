import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { bodyToArrayBuffer } from "../body";
import type { PutObjectInput, StorageAdapter } from "../types";

type R2S3Options = {
	accountId: string;
	bucketName: string;
	accessKeyId: string;
	secretAccessKey: string;
	endpoint: string;
};

export class R2S3StorageAdapter implements StorageAdapter {
	readonly adapterName = "r2-s3";

	private readonly client: S3Client;
	private readonly bucketName: string;

	constructor(options: R2S3Options) {
		this.bucketName = options.bucketName;
		this.client = new S3Client({
			region: "auto",
			endpoint: options.endpoint || `https://${options.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: options.accessKeyId,
				secretAccessKey: options.secretAccessKey,
			},
		});
	}

	async putObject(input: PutObjectInput): Promise<{ key: string }> {
		const body = await bodyToArrayBuffer(input.body);
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucketName,
				Key: input.key,
				Body: new Uint8Array(body),
				ContentType: input.contentType,
			}),
		);
		return { key: input.key };
	}

	async getObject(key: string) {
		const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucketName, Key: key }));
		const body = object.Body && "transformToWebStream" in object.Body ? object.Body.transformToWebStream() : null;
		return {
			body,
			contentType: object.ContentType,
		};
	}

	async deleteObject(key: string): Promise<void> {
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
	}
}
