"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
	calibrateOverlayFramesForPrompt,
	captureDesktopScreenFrame,
	cropAndUpscaleScreenFrame,
	isDesktopScreenFrameCaptureAvailable,
	prepareUploadedImage,
	shouldAutoCaptureSharedScreen,
	shouldExtractScreenElements,
} from "@/features/ai/image-input";
import type { AiChatMessage, AiChatResponse, AiImageAttachment, AiToolCall } from "@/features/ai/ai-types";
import { buildCandidatesFromOcr, candidateToOverlayToolCall } from "@/features/ai/grounding/candidates";
import { runOcrWords, warmUpOcr } from "@/features/ai/grounding/ocr";
import { detectContentRegions, detectContentRegionsDebug } from "@/features/ai/grounding/regions";
import type { GroundingCandidate } from "@/features/ai/grounding/types";
import { useAiChat, type AssistantToolCallContext } from "@/features/ai/use-ai-chat";
import { useAiOverlayActions } from "@/features/ai/use-ai-overlay-actions";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import { refineOverlayToolCalls } from "@/features/ai/visual-grounding";

// Zoom-refine the model's first coordinate guess by default. Set NEXT_PUBLIC_MEERA_GROUNDING_REFINE=0 to disable.
const GROUNDING_REFINE_ENABLED = process.env.NEXT_PUBLIC_MEERA_GROUNDING_REFINE !== "0";
// Detect non-text image/card regions (thumbnails) as candidates. Set NEXT_PUBLIC_MEERA_REGIONS=0 to disable.
const REGION_DETECTION_ENABLED = process.env.NEXT_PUBLIC_MEERA_REGIONS !== "0";

async function requestRefineGrounding(image: AiImageAttachment, prompt: string): Promise<AiToolCall[]> {
	const response = await fetch("/api/ai/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ messages: [{ role: "user", content: prompt, images: [image] }] }),
	});
	if (!response.ok) return [];
	const body = (await response.json()) as AiChatResponse & { error?: string };
	return body.toolCalls ?? [];
}

type AiAssistantProps = {
	onOpenChange?: (isOpen: boolean) => void;
};

function CloseIcon() {
	return (
		<svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M6 6l12 12M18 6 6 18" />
		</svg>
	);
}

function SendIcon() {
	return (
		<svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
			<path d="m5 12 14-7-5 14-3-5-6-2Z" />
		</svg>
	);
}

function MicIcon() {
	return (
		<svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
			<rect x="9" y="3" width="6" height="11" rx="3" />
			<path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
		</svg>
	);
}

function SpeakerIcon({ active }: { active?: boolean }) {
	return (
		<svg className="size-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M4 9v6h4l5 4V5L8 9H4Z" />
			{active ? <path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" /> : <path d="M16 9a4 4 0 0 1 0 6" />}
		</svg>
	);
}

function ChatMessage({ message, onSpeak, isSpeaking }: { message: AiChatMessage; onSpeak?: () => void; isSpeaking?: boolean }) {
	const isUser = message.role === "user";
	const canSpeak = !isUser && Boolean(message.content.trim()) && Boolean(onSpeak);

	return (
		<article className={`flex ${isUser ? "justify-end" : "justify-start"}`} aria-label={`${message.role} message`}>
			<div
				className={`max-w-[88%] px-4 py-3 text-sm leading-6 ${
					isUser
						? "rounded-[16px_4px_16px_16px] bg-[var(--ink)] text-white"
						: "rounded-[4px_16px_16px_16px] border border-[var(--line)] bg-white text-[var(--ink)] shadow-sm"
				}`}
			>
				<p className="m-0 whitespace-pre-wrap">{message.content}</p>
				{message.images?.length ? (
					<div className="mt-2 grid grid-cols-2 gap-2">
						{message.images.map((image) => (
							<div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--cream)]" key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="aspect-video w-full object-cover" src={image.dataUrl} alt={image.name} />
								<p className="truncate px-2 py-1 font-['DM_Mono'] text-[10px] opacity-70">
									{image.source === "screen" ? "Desktop frame" : image.name}
								</p>
							</div>
						))}
					</div>
				) : null}
				{message.actionResults?.length ? (
					<div className={`mt-3 flex flex-wrap gap-1.5 border-t pt-3 ${isUser ? "border-white/20" : "border-[var(--line)]"}`}>
						{message.actionResults.map((result, index) => (
							<p
								className={`m-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
									result.ok ? "bg-[var(--green-050)] text-[var(--teal-700)]" : "bg-[var(--gold-050)] text-[#A9781F]"
								}`}
								key={`${result.tool}-${index}`}
							>
								{result.message}
							</p>
						))}
					</div>
				) : null}
				{message.model ? (
					<p className={`mt-2 mb-0 font-['DM_Mono'] text-[10px] ${isUser ? "text-white/55" : "text-[var(--muted)]"}`}>{message.model}</p>
				) : null}
				{canSpeak ? (
					<button
						type="button"
						onClick={onSpeak}
						aria-label={isSpeaking ? "Stop speaking" : "Play reply aloud"}
						className="mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-bold text-[var(--ink-2)] transition hover:border-[var(--teal)] hover:text-[var(--teal-700)]"
					>
						<SpeakerIcon active={isSpeaking} />
						{isSpeaking ? "Stop" : "Listen"}
					</button>
				) : null}
			</div>
		</article>
	);
}

export function AiAssistant({ onOpenChange }: AiAssistantProps) {
	const { overlayAvailable, executeToolCalls, clearVisualGuidance } = useAiOverlayActions();
	const handleAssistantToolCalls = useCallback(
		async (toolCalls: AiToolCall[], { images, prompt, grounding, selectedElementId }: AssistantToolCallContext) => {
			const frame = images.find((image) => image.source === "screen");
			// Selection grounding (ocr/uia) already yields exact rects — skip the vision refine pass for it.
			const exactlyGrounded = grounding === "ocr" || grounding === "uia";
			console.log(`[Meera] grounding=${grounding ?? "vision/none"} selected=${selectedElementId ?? "-"} toolCalls=${toolCalls.length}`);
			const refined = await refineOverlayToolCalls({
				toolCalls,
				frame,
				prompt,
				enabled: GROUNDING_REFINE_ENABLED && !exactlyGrounded,
				deps: { cropFrame: cropAndUpscaleScreenFrame, requestRefine: requestRefineGrounding },
			});
			return executeToolCalls(refined);
		},
		[executeToolCalls],
	);
	const chat = useAiChat(handleAssistantToolCalls);
	const { speakingId, speak } = useSpeech();
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [attachments, setAttachments] = useState<AiImageAttachment[]>([]);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);
	const [autoScreenContext, setAutoScreenContext] = useState(true);
	const [lastAutoCapture, setLastAutoCapture] = useState(false);
	const [isGrounding, setIsGrounding] = useState(false);
	const [debugInfo, setDebugInfo] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const appendTranscript = useCallback((text: string) => {
		setDraft((current) => (current.trim() ? `${current} ${text}` : text));
	}, []);
	const voice = useVoiceInput(appendTranscript);

	const setAssistantOpen = useCallback(
		(nextOpen: boolean) => {
			setIsOpen(nextOpen);
			onOpenChange?.(nextOpen);
		},
		[onOpenChange],
	);

	useEffect(() => {
		if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [chat.messages.length, chat.isSending, isOpen]);

	// Pre-create the OCR worker (and fetch language data) on open so the first grounded request is fast.
	useEffect(() => {
		if (isOpen) warmUpOcr();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const focusId = window.setTimeout(() => textareaRef.current?.focus(), 80);
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setAssistantOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			window.clearTimeout(focusId);
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen, setAssistantOpen]);

	const addUpload = async (file: File | undefined) => {
		if (!file) return;
		setAttachmentError(null);
		try {
			const image = await prepareUploadedImage(file);
			setAttachments((current) => [...current.slice(-2), image]);
		} catch (error) {
			setAttachmentError(error instanceof Error ? error.message : "Could not prepare the image.");
		}
	};

	const captureScreen = async () => {
		setAttachmentError(null);
		if (isDesktopScreenFrameCaptureAvailable()) return captureDesktopScreenFrame();
		throw new Error("Run Meera through Electron to capture the desktop.");
	};

	const addScreenFrame = async () => {
		try {
			const image = await captureScreen();
			setAttachments((current) => [...current.filter((candidate) => candidate.source !== "screen").slice(-2), image]);
		} catch (error) {
			setAttachmentError(error instanceof Error ? error.message : "Could not capture the desktop.");
		}
	};

	// Diagnostic: capture, OCR, and box every detected element live on the real screen. Lets us see at a
	// glance whether failures are detection (target has no box), coordinates (boxes misaligned with the UI),
	// or selection (boxes correct but the wrong one gets picked during a real request).
	const showDetectedElements = async () => {
		setAttachmentError(null);
		setDebugInfo(null);
		try {
			const frame = await captureScreen();
			if (!frame.width || !frame.height) throw new Error("Captured frame has no size.");
			const words = await runOcrWords(frame.dataUrl);
			const ocrCandidates = buildCandidatesFromOcr(words, { imageWidth: frame.width, imageHeight: frame.height });
			const { candidates: regionCandidates, stats } = REGION_DETECTION_ENABLED
				? await detectContentRegionsDebug(frame.dataUrl)
				: { candidates: [], stats: null };
			const candidates = [...ocrCandidates, ...regionCandidates];
			const statsLine = stats
				? `text=${ocrCandidates.length} regions=${stats.regions} · scoreMax=${stats.scoreMax} mean=${stats.scoreMean} otsu=${stats.otsu} thr=${stats.threshold} above=${stats.cellsAbove}/${stats.cells}`
				: `text=${ocrCandidates.length} regions=0 (no region grid)`;
			setDebugInfo(statsLine);
			console.log(`[Meera debug] frame=${frame.width}x${frame.height} ${statsLine}`, candidates);
			if (candidates.length === 0) {
				setAttachmentError("Debug: nothing detected on this screen.");
				return;
			}
			// Draw regions first so the per-request cap can never slice them off behind the many text boxes.
			const drawOrder = [...regionCandidates, ...ocrCandidates].slice(0, 50);
			const calls = drawOrder.map((candidate) => candidateToOverlayToolCall(candidate, "highlight", candidate.id));
			await executeToolCalls(calls);
		} catch (error) {
			setAttachmentError(error instanceof Error ? error.message : "Debug capture failed.");
		}
	};

	const startNewChat = () => {
		chat.clearMessages();
		setDraft("");
		setAttachments([]);
		setAttachmentError(null);
		setLastAutoCapture(false);
		textareaRef.current?.focus();
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (chat.isSending || isGrounding) return;
		setAttachmentError(null);
		setLastAutoCapture(false);

		const draftToSend = draft;
		let images = attachments;
		const needsFreshScreen = autoScreenContext && shouldAutoCaptureSharedScreen(draftToSend);
		if (needsFreshScreen) {
			try {
				await clearVisualGuidance();
			} catch {
				// A stale overlay is harmless if the desktop bridge disappears during submission.
			}
		}
		if (needsFreshScreen && !images.some((image) => image.source === "screen")) {
			try {
				images = [...images, await captureScreen()];
				setLastAutoCapture(true);
			} catch (error) {
				setAttachmentError(error instanceof Error ? error.message : "Could not capture the desktop.");
			}
		}

		if (!draftToSend.trim() && images.length === 0) return;

		try {
			images = await calibrateOverlayFramesForPrompt(draftToSend, images);
		} catch (error) {
			setAttachmentError(error instanceof Error ? error.message : "Could not calibrate the desktop frame.");
		}

		setDraft("");
		setAttachments([]);

		// Extract on-screen text elements so the model can SELECT a target (exact rect) instead of guessing coords.
		let candidates: GroundingCandidate[] = [];
		const screenFrame = images.find((image) => image.source === "screen");
		if (screenFrame?.width && screenFrame.height && shouldExtractScreenElements(draftToSend)) {
			setIsGrounding(true);
			try {
				const words = await runOcrWords(screenFrame.dataUrl);
				const ocrCandidates = buildCandidatesFromOcr(words, { imageWidth: screenFrame.width, imageHeight: screenFrame.height });
				const regionCandidates = REGION_DETECTION_ENABLED ? await detectContentRegions(screenFrame.dataUrl) : [];
				candidates = [...ocrCandidates, ...regionCandidates];
				console.log(`[Meera] candidates for "${draftToSend.slice(0, 60)}": ${ocrCandidates.length} text + ${regionCandidates.length} regions`);
			} catch {
				candidates = [];
			} finally {
				setIsGrounding(false);
			}
		}

		const sent = await chat.sendMessage(draftToSend, images, candidates);
		if (!sent) {
			setDraft(draftToSend);
			setAttachments(images);
		}
	};

	const canCaptureScreen = isDesktopScreenFrameCaptureAvailable();
	const providerLabel = chat.status?.providerLabel ?? "AI provider";
	const statusLabel = chat.status?.available
		? `${providerLabel} connected`
		: chat.status
			? `${providerLabel} unavailable`
			: "Checking AI provider";

	if (!isOpen) {
		return (
			<button
				className="group grid h-screen w-screen place-items-center bg-transparent p-1 focus-visible:outline-3 focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--teal)]"
				type="button"
				aria-label="Open Meera AI chat"
				onClick={() => setAssistantOpen(true)}
			>
				<span className="relative grid size-[76px] place-items-center overflow-hidden rounded-[1.65rem] border border-[var(--line)] bg-white shadow-[0_18px_48px_rgba(28,51,73,0.22)] transition group-hover:-translate-y-0.5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img className="size-[64px] object-cover" src="/assets/meera/meera_icon.svg" alt="" />
					<span
						className={`absolute top-3 right-3 size-2.5 rounded-full ring-4 ring-white ${
							chat.status?.available ? "bg-[var(--green)]" : "bg-[var(--gold)]"
						}`}
					/>
				</span>
			</button>
		);
	}

	return (
		<section
			className="flex h-screen w-screen flex-col overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] shadow-[0_24px_80px_rgba(28,51,73,0.28)]"
			aria-label="Meera AI chat"
			role="dialog"
		>
			<header className="flex min-h-20 items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-5">
				<div className="flex min-w-0 items-center gap-3">
					<span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--sand-050)] shadow-sm">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img className="size-10 object-cover" src="/assets/meera/meera_icon.svg" alt="" />
					</span>
					<div className="min-w-0">
						<h2 className="truncate text-lg font-[800] tracking-normal">Meera</h2>
						<p className="m-0 flex items-center gap-1.5 font-['DM_Mono'] text-[11px] text-[var(--muted)]">
							<span className={`size-2 rounded-full ${chat.status?.available ? "bg-[var(--green)]" : "bg-[var(--gold)]"}`} />
							{statusLabel}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="min-h-9 rounded-full bg-[var(--teal-050)] px-3.5 text-xs font-bold text-[var(--teal-700)] transition hover:bg-[var(--teal-100)]"
						type="button"
						onClick={startNewChat}
					>
						New
					</button>
					<button
						className="grid size-9 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-2)] shadow-sm transition hover:bg-[var(--cream-2)]"
						type="button"
						aria-label="Close Meera AI chat"
						onClick={() => setAssistantOpen(false)}
					>
						<CloseIcon />
					</button>
				</div>
			</header>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FCFAF6] p-4" aria-live="polite">
				{chat.messages.map((message) => (
					<ChatMessage
							message={message}
							key={message.id}
							isSpeaking={speakingId === message.id}
							onSpeak={() => void speak(message.id, message.content)}
						/>
				))}
				{chat.isSending || isGrounding ? (
					<div className="flex justify-start">
						<p className="m-0 rounded-full border border-[var(--line)] bg-white px-4 py-2 font-['DM_Mono'] text-xs text-[var(--muted)] shadow-sm">
							Meera is reading the screen...
						</p>
					</div>
				) : null}
				<div ref={messagesEndRef} />
			</div>

			<form className="border-t border-[var(--line)] bg-white p-4" onSubmit={submit}>
				{attachments.length ? (
					<div className="mb-3 flex flex-wrap gap-2">
						{attachments.map((image) => (
							<div className="flex max-w-48 items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-1.5" key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="size-9 rounded-xl object-cover" src={image.dataUrl} alt="" />
								<span className="min-w-0 flex-1 truncate font-['DM_Mono'] text-[10px] text-[var(--muted)]">
									{image.source === "screen" ? "Desktop frame" : image.name}
								</span>
								<button
									className="grid size-7 place-items-center rounded-full text-[var(--ink-2)] hover:bg-[var(--cream-2)]"
									type="button"
									aria-label={`Remove ${image.name}`}
									onClick={() => setAttachments((current) => current.filter((candidate) => candidate.id !== image.id))}
								>
									<CloseIcon />
								</button>
							</div>
						))}
					</div>
				) : null}

				<div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--cream)] p-2 focus-within:border-[var(--teal)]">
					<textarea
						ref={textareaRef}
						className="max-h-28 min-h-20 w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
						placeholder="Ask Meera to inspect, point, highlight, or explain..."
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								event.currentTarget.form?.requestSubmit();
							}
						}}
					/>

					<div className="mt-2 flex items-center justify-between gap-2">
						<div className="flex min-w-0 flex-wrap gap-2">
							<input
								ref={fileInputRef}
								className="hidden"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onChange={(event) => {
									void addUpload(event.target.files?.[0]);
									event.currentTarget.value = "";
								}}
							/>
							<button
								className="min-h-8 rounded-full border border-[var(--line)] bg-white px-3 text-[11px] font-bold text-[var(--ink-2)] transition hover:border-[var(--teal)] hover:text-[var(--teal-700)]"
								type="button"
								onClick={() => fileInputRef.current?.click()}
							>
								Upload
							</button>
							<button
								className="min-h-8 rounded-full border border-[var(--line)] bg-white px-3 text-[11px] font-bold text-[var(--ink-2)] transition hover:border-[var(--teal)] hover:text-[var(--teal-700)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--ink-2)]"
								type="button"
								disabled={!canCaptureScreen}
								onClick={() => void addScreenFrame()}
							>
								Screen
							</button>
							<button
								className="min-h-8 rounded-full border border-dashed border-[var(--line)] bg-white px-3 text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--teal)] hover:text-[var(--teal-700)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--muted)]"
								type="button"
								disabled={!canCaptureScreen}
								title="Debug: box every element Meera detects on screen"
								onClick={() => void showDetectedElements()}
							>
								Debug boxes
							</button>
							<button
								className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
									voice.isRecording
										? "border-[#C0532F] bg-[#C0532F] text-white"
										: "border-[var(--line)] bg-white text-[var(--ink-2)] hover:border-[var(--teal)] hover:text-[var(--teal-700)]"
								}`}
								type="button"
								disabled={voice.isTranscribing}
								aria-label={voice.isRecording ? "Stop recording" : "Record voice input"}
								title="Voice input (speech-to-text)"
								onClick={voice.toggle}
							>
								<MicIcon />
								{voice.isTranscribing ? "..." : voice.isRecording ? "Stop" : "Voice"}
							</button>
						</div>
						<button
							className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--teal)] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(46,156,142,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--teal-600)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
							type="submit"
							disabled={chat.isSending || isGrounding || (!draft.trim() && attachments.length === 0)}
						>
							{chat.isSending ? "Sending" : "Send"}
							<SendIcon />
						</button>
					</div>
				</div>

				<label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
					<input
						className="size-3.5 accent-[var(--teal)]"
						type="checkbox"
						checked={autoScreenContext}
						onChange={(event) => setAutoScreenContext(event.target.checked)}
					/>
					Auto-attach a fresh desktop frame for visual or overlay requests
				</label>

				{lastAutoCapture ? <p className="mt-2 mb-0 text-[11px] font-bold text-[var(--teal-700)]">Attached a fresh desktop frame.</p> : null}
					{debugInfo ? <p className="mt-2 mb-0 font-['DM_Mono'] text-[10px] break-words text-[var(--muted)]">{debugInfo}</p> : null}
				{attachmentError || chat.error || voice.error ? (
						<p className="mt-2 mb-0 text-[11px] font-semibold text-[#C0532F]">{attachmentError || chat.error || voice.error}</p>
					) : null}
			</form>

			<footer className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--cream)] px-4 py-3 font-['DM_Mono'] text-[10px] text-[var(--muted)]">
				<span className="truncate">{chat.status?.visionModel ?? "meta-llama/llama-4-scout-17b-16e-instruct"} for images</span>
				<span className="shrink-0">{overlayAvailable ? "Desktop overlays ready" : "Electron overlays unavailable"}</span>
			</footer>
		</section>
	);
}
