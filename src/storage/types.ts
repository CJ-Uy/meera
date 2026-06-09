export type PutObjectInput = {
	key: string;
	body: ReadableStream | ArrayBuffer | Blob | string;
	contentType?: string;
};

export type GetObjectOutput = {
	body: ReadableStream | null;
	contentType?: string;
};

export interface StorageAdapter {
	readonly adapterName: string;
	putObject(input: PutObjectInput): Promise<{ key: string }>;
	getObject(key: string): Promise<GetObjectOutput>;
	deleteObject(key: string): Promise<void>;
}
