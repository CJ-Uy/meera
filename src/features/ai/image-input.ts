import type { AiImageAttachment, AiImageSource, AiScreenFrameMetadata } from "@/features/ai/ai-types";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1_600;
const JPEG_QUALITY = 0.84;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CALIBRATION_GRID = { columns: 12, rows: 8 } as const;
const AUTO_CAPTURE_PATTERNS = [
	/\bscreen\b/i,
	/\bshare(?:d|ing)?\b/i,
	/\bpreview\b/i,
	/\boverlay\b/i,
	/\bpoint\b/i,
	/\bhighlight\b/i,
	/\barrow\b/i,
	/\bcursor\b/i,
	/\bshow me\b/i,
	/\bguide me\b/i,
	/\bwhat (?:am i|is) (?:seeing|on)\b/i,
	/\bwhere (?:is|should)\b/i,
];
const OVERLAY_CALIBRATION_PATTERNS = [
	/\boverlay\b/i,
	/\bpoint\b/i,
	/\bhighlight\b/i,
	/\barrow\b/i,
	/\bcursor\b/i,
	/\bbubble\b/i,
	/\bmark\b/i,
	/\bguide\b/i,
	/\bwhere should\b/i,
	/\bclick\b/i,
	/\bshow (?:me )?(?:where|an? arrow|a highlight)\b/i,
];

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

function canvasForExact(width: number, height: number) {
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(width));
	canvas.height = Math.max(1, Math.round(height));
	return canvas;
}

function loadImage(dataUrl: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Could not prepare the screen calibration image."));
		image.src = dataUrl;
	});
}

function columnLabel(index: number) {
	let label = "";
	let value = index + 1;
	while (value > 0) {
		value -= 1;
		label = String.fromCharCode(65 + (value % 26)) + label;
		value = Math.floor(value / 26);
	}
	return label;
}

function drawCalibrationGrid(context: CanvasRenderingContext2D, width: number, height: number) {
	const { columns, rows } = CALIBRATION_GRID;
	const cellWidth = width / columns;
	const cellHeight = height / rows;
	const fontSize = Math.max(14, Math.round(Math.min(width, height) / 42));
	context.save();
	context.lineWidth = Math.max(1, Math.round(Math.min(width, height) / 500));
	context.strokeStyle = "rgba(0, 210, 255, 0.9)";
	context.fillStyle = "rgba(0, 0, 0, 0.58)";

	for (let column = 1; column < columns; column += 1) {
		const x = Math.round(column * cellWidth) + 0.5;
		context.beginPath();
		context.moveTo(x, 0);
		context.lineTo(x, height);
		context.stroke();
	}

	for (let row = 1; row < rows; row += 1) {
		const y = Math.round(row * cellHeight) + 0.5;
		context.beginPath();
		context.moveTo(0, y);
		context.lineTo(width, y);
		context.stroke();
	}

	context.font = `700 ${fontSize}px sans-serif`;
	context.textAlign = "center";
	context.textBaseline = "middle";

	for (let column = 0; column < columns; column += 1) {
		const label = columnLabel(column);
		const x = column * cellWidth + cellWidth / 2;
		context.fillStyle = "rgba(0, 0, 0, 0.68)";
		context.fillRect(x - fontSize * 0.9, 3, fontSize * 1.8, fontSize * 1.35);
		context.fillStyle = "#ffffff";
		context.fillText(label, x, 3 + fontSize * 0.68);
	}

	for (let row = 0; row < rows; row += 1) {
		const label = String(row + 1);
		const y = row * cellHeight + cellHeight / 2;
		context.fillStyle = "rgba(0, 0, 0, 0.68)";
		context.fillRect(3, y - fontSize * 0.68, fontSize * 1.8, fontSize * 1.35);
		context.fillStyle = "#ffffff";
		context.fillText(label, 3 + fontSize * 0.9, y);
	}

	context.restore();
}

function toAttachment({
	dataUrl,
	height,
	mimeType = "image/jpeg",
	name,
	screen,
	source,
	width,
}: {
	dataUrl: string;
	height?: number;
	mimeType?: AiImageAttachment["mimeType"];
	name: string;
	screen?: AiScreenFrameMetadata;
	source: AiImageSource;
	width?: number;
}): AiImageAttachment {
	return {
		id: attachmentId(),
		name,
		mimeType,
		dataUrl,
		source,
		...(width && height ? { width, height } : {}),
		...(screen ? { screen } : {}),
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
		return toAttachment({
			dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
			height: canvas.height,
			name: file.name,
			source: "upload",
			width: canvas.width,
		});
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
	return toAttachment({
		dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
		height: canvas.height,
		name: `shared-screen-${new Date().toISOString()}.jpg`,
		source: "screen",
		width: canvas.width,
	});
}

export function shouldAutoCaptureSharedScreen(prompt: string) {
	return AUTO_CAPTURE_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function shouldCalibrateOverlayFrame(prompt: string) {
	return OVERLAY_CALIBRATION_PATTERNS.some((pattern) => pattern.test(prompt));
}

export async function calibrateScreenFrameForOverlay(image: AiImageAttachment): Promise<AiImageAttachment> {
	if (image.source !== "screen" || image.screen?.calibrationGrid) return image;
	const width = image.width;
	const height = image.height;
	if (!width || !height) return image;
	const source = await loadImage(image.dataUrl);
	const canvas = canvasForExact(width, height);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not prepare the screen calibration image.");
	context.drawImage(source, 0, 0, width, height);
	drawCalibrationGrid(context, width, height);
	return {
		...image,
		dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
		name: image.name.replace(/(\.[^.]+)?$/, "-grid.jpg"),
		mimeType: "image/jpeg",
		screen: {
			...image.screen,
			calibrationGrid: CALIBRATION_GRID,
		},
	};
}

export async function calibrateOverlayFramesForPrompt(prompt: string, images: AiImageAttachment[]) {
	if (!shouldCalibrateOverlayFrame(prompt)) return images;
	return Promise.all(images.map((image) => calibrateScreenFrameForOverlay(image)));
}

export function isDesktopScreenFrameCaptureAvailable() {
	return typeof window !== "undefined" && Boolean(window.meeraAssistant?.captureScreenFrame);
}

export async function captureDesktopScreenFrame(): Promise<AiImageAttachment> {
	if (!isDesktopScreenFrameCaptureAvailable() || !window.meeraAssistant) {
		throw new Error("Desktop screen capture is only available in the Electron assistant overlay.");
	}
	const frame = await window.meeraAssistant.captureScreenFrame();
	return toAttachment({
		dataUrl: frame.dataUrl,
		height: frame.height,
		mimeType: frame.mimeType,
		name: frame.name,
		screen: frame.screen,
		source: "screen",
		width: frame.width,
	});
}
