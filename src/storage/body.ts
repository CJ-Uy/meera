export async function bodyToArrayBuffer(body: ReadableStream | ArrayBuffer | Blob | string): Promise<ArrayBuffer> {
	if (typeof body === "string") return new TextEncoder().encode(body).buffer as ArrayBuffer;
	if (body instanceof ArrayBuffer) return body;
	if (body instanceof Blob) return body.arrayBuffer();

	const chunks: Uint8Array[] = [];
	const reader = body.getReader();
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}

	const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
	const merged = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return merged.buffer;
}
