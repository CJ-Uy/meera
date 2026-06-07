"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { captureSharedScreenFrame, prepareUploadedImage } from "@/features/ai/image-input";
import type { AiChatMessage, AiImageAttachment } from "@/features/ai/ai-types";
import { useAiChat } from "@/features/ai/use-ai-chat";
import { useAiOverlayActions } from "@/features/ai/use-ai-overlay-actions";

type AiAssistantProps = {
	isSharing: boolean;
	previewRef: RefObject<HTMLVideoElement | null>;
};

const suggestions = [
	"Show every overlay type so I can test them.",
	"Describe the attached image and tell me what stands out.",
	"Analyze my shared screen and point at the most important control.",
];

function ChatMessage({ message }: { message: AiChatMessage }) {
	const isUser = message.role === "user";
	return (
		<article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[88%] rounded-lg px-3.5 py-3 text-xs leading-5 ${
					isUser ? "bg-emerald-950 text-white" : "border border-slate-200 bg-white text-slate-700"
				}`}
			>
				<p className="m-0 whitespace-pre-wrap">{message.content}</p>
				{message.images?.length ? (
					<div className="mt-3 grid grid-cols-2 gap-2">
						{message.images.map((image) => (
							<div className="overflow-hidden rounded-md border border-white/20 bg-slate-900/10" key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img className="aspect-video w-full object-cover" src={image.dataUrl} alt={image.name} />
								<p className="truncate px-2 py-1 text-[9px] opacity-75">{image.source === "screen" ? "Shared-screen frame" : image.name}</p>
							</div>
						))}
					</div>
				) : null}
				{message.actionResults?.length ? (
					<div className="mt-3 grid gap-1 border-t border-slate-200/50 pt-2">
						{message.actionResults.map((result, index) => (
							<p className={`m-0 text-[9px] font-semibold ${result.ok ? "text-emerald-600" : "text-amber-600"}`} key={`${result.tool}-${index}`}>
								{result.message}
							</p>
						))}
					</div>
				) : null}
				{message.model ? <p className="mt-2 mb-0 text-[9px] text-slate-400">{message.model}</p> : null}
			</div>
		</article>
	);
}

export function AiAssistant({ isSharing, previewRef }: AiAssistantProps) {
	const { overlayAvailable, executeToolCalls } = useAiOverlayActions();
	const chat = useAiChat(executeToolCalls);
	const [draft, setDraft] = useState("");
	const [attachments, setAttachments] = useState<AiImageAttachment[]>([]);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [chat.messages.length, chat.isSending]);

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

	const captureScreen = () => {
		setAttachmentError(null);
		try {
			const video = previewRef.current;
			if (!video) throw new Error("Start screen sharing before capturing a frame.");
			const image = captureSharedScreenFrame(video);
			setAttachments((current) => [...current.slice(-2), image]);
		} catch (error) {
			setAttachmentError(error instanceof Error ? error.message : "Could not capture the shared screen.");
		}
	};

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const sent = await chat.sendMessage(draft, attachments);
		if (sent) {
			setDraft("");
			setAttachments([]);
		}
	};

	return (
		<section className="mt-12 border-t border-slate-200 pt-7" aria-labelledby="ai-assistant-title">
			<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="mb-1 text-[10px] font-bold text-emerald-700 uppercase">Ollama test console</p>
					<h2 className="text-lg font-semibold" id="ai-assistant-title">
						Meera AI assistant
					</h2>
				</div>
				<div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
					<span className={`size-2 rounded-full ${chat.status?.available ? "bg-emerald-500" : chat.status ? "bg-amber-400" : "bg-slate-300"}`} />
					{chat.status?.available ? "Ollama connected" : chat.status ? "Ollama unavailable" : "Checking Ollama"}
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
				<div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
					<div className="h-[430px] space-y-3 overflow-y-auto p-4" aria-live="polite">
						{chat.messages.map((message) => (
							<ChatMessage message={message} key={message.id} />
						))}
						{chat.isSending ? (
							<div className="flex justify-start">
								<p className="m-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[10px] font-semibold text-slate-500">
									Meera is thinking...
								</p>
							</div>
						) : null}
						<div ref={messagesEndRef} />
					</div>

					<form className="border-t border-slate-200 bg-white p-3" onSubmit={submit}>
						{attachments.length ? (
							<div className="mb-3 flex flex-wrap gap-2">
								{attachments.map((image) => (
									<div className="flex max-w-52 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5" key={image.id}>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img className="size-9 rounded object-cover" src={image.dataUrl} alt="" />
										<span className="min-w-0 flex-1 truncate text-[9px] font-semibold">{image.source === "screen" ? "Shared-screen frame" : image.name}</span>
										<button
											className="size-6 rounded text-xs text-slate-500 hover:bg-slate-200"
											type="button"
											aria-label={`Remove ${image.name}`}
											onClick={() => setAttachments((current) => current.filter((candidate) => candidate.id !== image.id))}
										>
											×
										</button>
									</div>
								))}
							</div>
						) : null}

						<textarea
							className="min-h-20 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-xs leading-5 outline-none focus:border-emerald-700"
							placeholder="Ask Meera, attach an image, or request an overlay..."
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									event.currentTarget.form?.requestSubmit();
								}
							}}
						/>

						<div className="mt-2 flex flex-wrap items-center gap-2">
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
								className="min-h-8 rounded-md bg-slate-100 px-2.5 text-[10px] font-semibold hover:bg-slate-200"
								type="button"
								onClick={() => fileInputRef.current?.click()}
							>
								Upload image
							</button>
							<button
								className="min-h-8 rounded-md bg-slate-100 px-2.5 text-[10px] font-semibold hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
								type="button"
								disabled={!isSharing}
								onClick={captureScreen}
							>
								Capture shared screen
							</button>
							<button
								className="ml-auto min-h-8 rounded-md bg-emerald-950 px-3.5 text-[10px] font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-45"
								type="submit"
								disabled={chat.isSending || (!draft.trim() && attachments.length === 0)}
							>
								{chat.isSending ? "Sending..." : "Send"}
							</button>
						</div>
						{attachmentError || chat.error ? <p className="mt-2 mb-0 text-[10px] text-red-600">{attachmentError || chat.error}</p> : null}
					</form>
				</div>

				<aside className="space-y-5">
					<div>
						<h3 className="text-xs font-semibold">Connected capabilities</h3>
						<div className="mt-3 grid gap-2 text-[10px] text-slate-600">
							<p className="m-0 flex items-center justify-between border-b border-slate-200 pb-2">
								Text chat <strong>{chat.status?.chatModel ?? "qwen3.5:9b"}</strong>
							</p>
							<p className="m-0 flex items-center justify-between border-b border-slate-200 pb-2">
								Image reading <strong>{chat.status?.visionModel ?? "qwen3-vl:8b"}</strong>
							</p>
							<p className="m-0 flex items-center justify-between border-b border-slate-200 pb-2">
								Shared screen <strong>{isSharing ? "Ready" : "Start sharing"}</strong>
							</p>
							<p className="m-0 flex items-center justify-between border-b border-slate-200 pb-2">
								Desktop overlays <strong>{overlayAvailable ? "Ready" : "Electron only"}</strong>
							</p>
						</div>
					</div>

					<div>
						<h3 className="text-xs font-semibold">Try a prompt</h3>
						<div className="mt-3 grid gap-2">
							{suggestions.map((suggestion) => (
								<button
									className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-[10px] leading-4 text-slate-600 hover:border-emerald-700 hover:text-slate-900"
									type="button"
									key={suggestion}
									onClick={() => setDraft(suggestion)}
								>
									{suggestion}
								</button>
							))}
						</div>
					</div>

					<button
						className="min-h-8 text-[10px] font-semibold text-slate-500 hover:text-slate-900"
						type="button"
						onClick={chat.clearMessages}
					>
						Clear conversation
					</button>
				</aside>
			</div>
		</section>
	);
}
