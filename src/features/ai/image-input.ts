import type { AiImageAttachment, AiImageSource } from "@/features/ai/ai-types";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1_600;
const JPEG_QUALITY = 0.84;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function attachmentId() {
	return globalThis.crypto?.randomUUID?.() ?? `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function outputSize(width: number, height: number) {
	const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

function canvasFor(width: number, height: number) {
	const canvas = document.createElement("canvas");
	const size = outputSize(width, height);
	canvas.width = size.width;
	canvas.height = size.height;
	return canvas;
}

function toAttachment(dataUrl: string, name: string, source: AiImageSource): AiImageAttachment {
	return {
		id: attachmentId(),
		name,
		mimeType: "image/jpeg",
		dataUrl,
		source,
	};
}

export async function prepareUploadedImage(file: File): Promise<AiImageAttachment> {
	if (!SUPPORTED_TYPES.has(file.type)) throw new Error("Upload a JPEG, PNG, or WebP image.");
	if (file.size > MAX_SOURCE_BYTES) throw new Error("Image uploads must be 12 MB or smaller.");

	const bitmap = await createImageBitmap(file);
	try {
		const canvas = canvasFor(bitmap.width, bitmap.height);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not prepare the image.");
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		return toAttachment(canvas.toDataURL("image/jpeg", JPEG_QUALITY), file.name, "upload");
	} finally {
		bitmap.close();
	}
}

export function captureSharedScreenFrame(video: HTMLVideoElement): AiImageAttachment {
	if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
		throw new Error("Start screen sharing before capturing a frame.");
	}
	const canvas = canvasFor(video.videoWidth, video.videoHeight);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not capture the shared screen.");
	context.drawImage(video, 0, 0, canvas.width, canvas.height);
	return toAttachment(canvas.toDataURL("image/jpeg", JPEG_QUALITY), `shared-screen-${new Date().toISOString()}.jpg`, "screen");
}
