"use client";

import type { OcrWord } from "@/features/ai/grounding/types";

/**
 * Local OCR (Tesseract.js, WASM) — runs in the renderer on the already-captured frame and returns word
 * boxes in the image's own pixel space. This is the backbone element source for browser / Electron
 * content, where Windows UI Automation is blind. No network model call; stays within the Groq-only rule.
 *
 * Tesseract is imported lazily so it never enters the SSR/initial bundle, and the worker is reused across
 * requests (creating it is the slow part). Best-effort: every entry point degrades to an empty list.
 */

type TesseractWorker = {
	recognize: (
		image: string,
		options?: Record<string, unknown>,
		output?: Record<string, unknown>,
	) => Promise<{ data: unknown }>;
	terminate: () => Promise<unknown>;
};

let workerPromise: Promise<TesseractWorker | null> | null = null;

async function getWorker(): Promise<TesseractWorker | null> {
	if (!workerPromise) {
		workerPromise = (async () => {
			try {
				const tesseract = (await import("tesseract.js")) as unknown as {
					createWorker: (lang?: string) => Promise<TesseractWorker>;
				};
				return await tesseract.createWorker("eng");
			} catch {
				return null;
			}
		})();
	}
	return workerPromise;
}

/** Pre-create the worker (and download language data) so the first real request is fast. */
export function warmUpOcr(): void {
	void getWorker();
}

function isBox(value: unknown): value is { x0: number; y0: number; x1: number; y1: number } {
	if (typeof value !== "object" || value === null) return false;
	const box = value as Record<string, unknown>;
	return (
		typeof box.x0 === "number" && typeof box.y0 === "number" && typeof box.x1 === "number" && typeof box.y1 === "number"
	);
}

function pushWord(out: OcrWord[], node: unknown) {
	if (typeof node !== "object" || node === null) return;
	const word = node as Record<string, unknown>;
	if (typeof word.text !== "string" || !isBox(word.bbox)) return;
	out.push({
		text: word.text,
		x0: word.bbox.x0,
		y0: word.bbox.y0,
		x1: word.bbox.x1,
		y1: word.bbox.y1,
		confidence: typeof word.confidence === "number" ? word.confidence : 0,
	});
}

/** Tolerantly pull word nodes out of a Tesseract page result across library versions. */
function extractWords(data: unknown): OcrWord[] {
	const out: OcrWord[] = [];
	if (typeof data !== "object" || data === null) return out;
	const page = data as Record<string, unknown>;

	if (Array.isArray(page.words) && page.words.length) {
		for (const word of page.words) pushWord(out, word);
		if (out.length) return out;
	}

	const blocks = Array.isArray(page.blocks) ? page.blocks : [];
	for (const block of blocks) {
		const paragraphs = (block as Record<string, unknown>)?.paragraphs;
		for (const paragraph of Array.isArray(paragraphs) ? paragraphs : []) {
			const lines = (paragraph as Record<string, unknown>)?.lines;
			for (const line of Array.isArray(lines) ? lines : []) {
				const words = (line as Record<string, unknown>)?.words;
				for (const word of Array.isArray(words) ? words : []) pushWord(out, word);
			}
		}
	}
	return out;
}

export async function runOcrWords(dataUrl: string): Promise<OcrWord[]> {
	const worker = await getWorker();
	if (!worker) return [];
	try {
		const { data } = await worker.recognize(dataUrl, {}, { blocks: true });
		return extractWords(data);
	} catch {
		return [];
	}
}
