"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
	calibrateOverlayFramesForPrompt,
	captureDesktopScreenFrame,
	isDesktopScreenFrameCaptureAvailable,
	prepareUploadedImage,
	shouldAutoCaptureSharedScreen,
} from "@/features/ai/image-input";
import type { AiChatMessage, AiImageAttachment } from "@/features/ai/ai-types";
import { useAiChat } from "@/features/ai/use-ai-chat";
import { useAiOverlayActions } from "@/features/ai/use-ai-overlay-actions";

type AiAssistantProps = {
	onOpenChange?: (isOpen: boolean) => void;
};

const suggestions = [
	"Pick something visible on my screen and mark it with an arrow.",
	"Highlight the button I should click next.",
	"Show every overlay type so I can test them.",
];

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

function ChatMessage({ message }: { message: AiChatMessage }) {
	const isUser = message.role === "user";

	return (
		<article className={`flex ${isUser ? "justify-end" : "justify-start"}`} aria-label={`${message.role} message`}>
			<div
				className={`max-w-[88%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 shadow-sm ${
					isUser ? "rounded-br-md bg-[#4B2B1F] text-white" : "rounded-bl-md border border-[#F8E4C8] bg-white text-[#4B2B1F]"
				}`}
			>
				<p className="m-0 whitespace-pre-wrap">{message.content}</p>
				{message.images?.length ? (
					<div className="mt-2 grid grid-cols-2 gap-2">
						{message.images.map((image) => (
							<div className="overflow-hidden rounded-2xl border border-white/50 bg-[#FFF8EE]" key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="aspect-video w-full object-cover" src={image.dataUrl} alt={image.name} />
								<p className="truncate px-2 py-1 text-[10px] font-bold opacity-75">
									{image.source === "screen" ? "Desktop frame" : image.name}
								</p>
							</div>
						))}
					</div>
				) : null}
				{message.actionResults?.length ? (
					<div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#F8E4C8]/70 pt-3">
						{message.actionResults.map((result, index) => (
							<p
								className={`m-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
									result.ok ? "bg-[#F3FBE8] text-[#6FA334]" : "bg-[#FFF3D6] text-[#B7791F]"
								}`}
								key={`${result.tool}-${index}`}
							>
								{result.message}
							</p>
						))}
					</div>
				) : null}
				{message.model ? <p className="mt-2 mb-0 text-[10px] font-bold text-[#7A5036]/55">{message.model}</p> : null}
			</div>
		</article>
	);
}

export function AiAssistant({ onOpenChange }: AiAssistantProps) {
	const { overlayAvailable, executeToolCalls, clearVisualGuidance } = useAiOverlayActions();
	const chat = useAiChat(executeToolCalls);
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [attachments, setAttachments] = useState<AiImageAttachment[]>([]);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);
	const [autoScreenContext, setAutoScreenContext] = useState(true);
	const [lastAutoCapture, setLastAutoCapture] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

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
		if (chat.isSending) return;
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
		const sent = await chat.sendMessage(draftToSend, images);
		if (!sent) {
			setDraft(draftToSend);
			setAttachments(images);
		}
	};

	const canCaptureScreen = isDesktopScreenFrameCaptureAvailable();
	const providerLabel = chat.status?.providerLabel ?? "AI provider";
	const statusLabel = chat.status?.available
		? `${providerLabel}${chat.status.fallbackActive ? " fallback" : ""} connected`
		: chat.status
			? `${providerLabel} unavailable`
			: "Checking AI provider";

	if (!isOpen) {
		return (
			<button
				className="group grid h-screen w-screen place-items-center bg-transparent p-1 focus-visible:outline-3 focus-visible:outline-offset-[-6px] focus-visible:outline-[#3B82F6]"
				type="button"
				aria-label="Open Meera AI chat"
				onClick={() => setAssistantOpen(true)}
			>
				<span className="relative grid size-[76px] place-items-center overflow-hidden rounded-[1.65rem] border border-[#F8E4C8] bg-[#F8E4C8] shadow-[0_18px_48px_rgba(75,43,31,0.22)] transition group-hover:-translate-y-0.5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img className="size-[68px] object-cover" src="/assets/meera/meera_icon.svg" alt="" />
					<span
						className={`absolute top-3 right-3 size-2.5 rounded-full ring-4 ring-[#FFF8EE] ${
							chat.status?.available ? "bg-[#9BCF53]" : "bg-[#F4B942]"
						}`}
					/>
				</span>
			</button>
		);
	}

	return (
		<section
			className="flex h-screen w-screen flex-col overflow-hidden rounded-[1.8rem] border border-[#F8E4C8] bg-[#FFF8EE] text-[#4B2B1F] shadow-[0_24px_80px_rgba(75,43,31,0.24)]"
			aria-label="Meera AI chat"
			role="dialog"
		>
			<header className="flex min-h-20 items-center justify-between gap-3 border-b border-[#F8E4C8] bg-white/60 px-5">
				<div className="flex min-w-0 items-center gap-3">
					<span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#F8E4C8] shadow-sm">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img className="size-11 object-cover" src="/assets/meera/meera_icon.svg" alt="" />
					</span>
					<div className="min-w-0">
						<h2 className="truncate text-lg font-black">Meera</h2>
						<p className="m-0 flex items-center gap-1.5 text-[11px] font-extrabold text-[#7A5036]">
							<span className={`size-2 rounded-full ${chat.status?.available ? "bg-[#9BCF53]" : "bg-[#F4B942]"}`} />
							{statusLabel}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						className="min-h-9 rounded-full bg-[#F3FBE8] px-3 text-xs font-extrabold text-[#6FA334] transition hover:bg-[#E7F6D6]"
						type="button"
						onClick={startNewChat}
					>
						New
					</button>
					<button
						className="grid size-9 place-items-center rounded-full bg-white text-[#7A5036] shadow-sm transition hover:bg-[#F8E4C8]"
						type="button"
						aria-label="Close Meera AI chat"
						onClick={() => setAssistantOpen(false)}
					>
						<CloseIcon />
					</button>
				</div>
			</header>

			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FFF8EE] p-4" aria-live="polite">
				{chat.messages.map((message) => (
					<ChatMessage message={message} key={message.id} />
				))}
				{chat.isSending ? (
					<div className="flex justify-start">
						<p className="m-0 rounded-full border border-[#F8E4C8] bg-white px-4 py-2 text-xs font-extrabold text-[#7A5036] shadow-sm">
							Meera is reading the screen...
						</p>
					</div>
				) : null}
				<div ref={messagesEndRef} />
			</div>

			<form className="border-t border-[#F8E4C8] bg-white/80 p-4" onSubmit={submit}>
				{attachments.length ? (
					<div className="mb-3 flex flex-wrap gap-2">
						{attachments.map((image) => (
							<div className="flex max-w-48 items-center gap-2 rounded-2xl border border-[#F8E4C8] bg-[#FFF8EE] p-1.5" key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="size-9 rounded-xl object-cover" src={image.dataUrl} alt="" />
								<span className="min-w-0 flex-1 truncate text-[10px] font-extrabold text-[#7A5036]">
									{image.source === "screen" ? "Desktop frame" : image.name}
								</span>
								<button
									className="grid size-7 place-items-center rounded-full text-[#7A5036] hover:bg-[#F8E4C8]"
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

				<div className="rounded-[1.35rem] border border-[#F8E4C8] bg-[#FFF8EE] p-2 shadow-inner">
					<textarea
						ref={textareaRef}
						className="max-h-28 min-h-20 w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-[#4B2B1F] outline-none placeholder:text-[#7A5036]/55"
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
								className="min-h-8 rounded-full bg-white px-3 text-[10px] font-extrabold text-[#7A5036] shadow-sm transition hover:bg-[#F8E4C8]"
								type="button"
								onClick={() => fileInputRef.current?.click()}
							>
								Upload
							</button>
							<button
								className="min-h-8 rounded-full bg-white px-3 text-[10px] font-extrabold text-[#7A5036] shadow-sm transition hover:bg-[#F8E4C8] disabled:cursor-not-allowed disabled:opacity-45"
								type="button"
								disabled={!canCaptureScreen}
								onClick={() => void addScreenFrame()}
							>
								Screen
							</button>
						</div>
						<button
							className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#9BCF53] px-4 text-xs font-black text-[#4B2B1F] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#A9DA66] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
							type="submit"
							disabled={chat.isSending || (!draft.trim() && attachments.length === 0)}
						>
							{chat.isSending ? "Sending" : "Send"}
							<SendIcon />
						</button>
					</div>
				</div>

				<label className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#7A5036]">
					<input
						className="size-3.5 accent-[#6FA334]"
						type="checkbox"
						checked={autoScreenContext}
						onChange={(event) => setAutoScreenContext(event.target.checked)}
					/>
					Auto-attach a fresh desktop frame for visual or overlay requests
				</label>

				{lastAutoCapture ? <p className="mt-2 mb-0 text-[11px] font-extrabold text-[#6FA334]">Attached a fresh desktop frame.</p> : null}
				{attachmentError || chat.error ? <p className="mt-2 mb-0 text-[11px] font-bold text-[#C24141]">{attachmentError || chat.error}</p> : null}
			</form>

			<footer className="grid gap-3 border-t border-[#F8E4C8] bg-[#FFF8EE] px-4 py-3">
				<div className="flex flex-wrap gap-1.5">
					{suggestions.map((suggestion) => (
						<button
							className="rounded-full border border-[#F8E4C8] bg-white px-3 py-1.5 text-left text-[10px] leading-4 font-bold text-[#7A5036] transition hover:border-[#9BCF53] hover:text-[#4B2B1F]"
							type="button"
							key={suggestion}
							onClick={() => {
								setDraft(suggestion);
								textareaRef.current?.focus();
							}}
						>
							{suggestion}
						</button>
					))}
				</div>
				<div className="flex items-center justify-between gap-3 text-[10px] font-extrabold text-[#7A5036]/70">
					<span>{chat.status?.visionModel ?? "meta-llama/llama-4-scout-17b-16e-instruct"} for images</span>
					<span>{overlayAvailable ? "Desktop overlays ready" : "Electron overlays unavailable"}</span>
				</div>
			</footer>
		</section>
	);
}
