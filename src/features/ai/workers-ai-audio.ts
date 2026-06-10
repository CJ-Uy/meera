/**
 * Workers AI voice: speech-to-text (Whisper) and text-to-speech (Deepgram Aura). Both use the DIRECT
 * Workers AI run endpoint, not the OpenAI-compat chat path. Server-side only.
 *
 * - STT input `{ audio: <base64> }` → JSON `{ result: { text } }`.
 * - TTS input `{ text }` → raw audio bytes (e.g. audio/mpeg), returned as-is to the client.
 */

const DEFAULT_STT_MODEL = "@cf/openai/whisper-large-v3-turbo";
const DEFAULT_TTS_MODEL = "@cf/deepgram/aura-2-en";
const AUDIO_TIMEOUT_MS = 45_000;

type AudioConfig = { apiKey: string; accountId: string; gatewayAuthToken?: string };

function bareModelId(model: string) {
	return model.replace(/^workers-ai\//, "");
}

function audioConfig(): AudioConfig {
	const apiKey = process.env.WORKERS_AI_API_KEY?.trim();
	const accountId = process.env.WORKERS_AI_ACCOUNT_ID?.trim();
	if (!apiKey) throw new Error("WORKERS_AI_API_KEY is not configured.");
	if (!accountId) throw new Error("WORKERS_AI_ACCOUNT_ID is required for voice (the direct run endpoint).");
	return { apiKey, accountId, gatewayAuthToken: process.env.WORKERS_AI_GATEWAY_AUTH_TOKEN?.trim() };
}

function runUrl(config: AudioConfig, model: string) {
	return `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${bareModelId(model)}`;
}

function authHeaders(config: AudioConfig): Record<string, string> {
	const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` };
	if (config.gatewayAuthToken) headers["cf-aig-authorization"] = `Bearer ${config.gatewayAuthToken}`;
	return headers;
}

async function runFetch(url: string, body: unknown) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), AUDIO_TIMEOUT_MS);
	try {
		const config = audioConfig();
		return await fetch(url, {
			method: "POST",
			headers: { ...authHeaders(config), "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timer);
	}
}

async function errorText(response: Response) {
	const body = await response.text().catch(() => "");
	return `Workers AI HTTP ${response.status}: ${(body || response.statusText).slice(0, 240)}`;
}

export async function transcribeAudio(audioBase64: string, options?: { language?: string }): Promise<string> {
	const config = audioConfig();
	const model = process.env.WORKERS_AI_STT_MODEL?.trim() || DEFAULT_STT_MODEL;
	const response = await runFetch(runUrl(config, model), {
		audio: audioBase64,
		task: "transcribe",
		...(options?.language ? { language: options.language } : {}),
	});
	if (!response.ok) throw new Error(await errorText(response));
	const data = (await response.json()) as { result?: { text?: string }; text?: string };
	return (data.result?.text ?? data.text ?? "").trim();
}

export type SynthesizedSpeech = { bytes: ArrayBuffer; contentType: string };

export async function synthesizeSpeech(text: string): Promise<SynthesizedSpeech> {
	const config = audioConfig();
	const model = process.env.WORKERS_AI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL;
	const response = await runFetch(runUrl(config, model), { text });
	if (!response.ok) throw new Error(await errorText(response));
	return {
		bytes: await response.arrayBuffer(),
		contentType: response.headers.get("content-type") || "audio/mpeg",
	};
}
