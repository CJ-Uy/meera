"use client";

import { useCallback, useRef, useState } from "react";

/** Strip the `data:...;base64,` prefix so we send pure base64 to the transcribe route. */
function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(String(reader.result).replace(/^data:[^,]+,/, ""));
		reader.onerror = () => reject(new Error("Could not read the recording."));
		reader.readAsDataURL(blob);
	});
}

/** Push-to-talk voice input: record from the mic, transcribe via Whisper, hand back the text. */
export function useVoiceInput(onResult: (text: string) => void) {
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	const stop = useCallback(() => {
		if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
	}, []);

	const start = useCallback(async () => {
		setError(null);
		if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
			setError("Microphone is not available here.");
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			const recorder = new MediaRecorder(stream);
			chunksRef.current = [];
			recorder.ondataavailable = (event) => {
				if (event.data.size) chunksRef.current.push(event.data);
			};
			recorder.onstop = async () => {
				streamRef.current?.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
				setIsRecording(false);
				const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
				if (!blob.size) return;
				setIsTranscribing(true);
				try {
					const audio = await blobToBase64(blob);
					const response = await fetch("/api/ai/transcribe", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ audio }),
					});
					const data = (await response.json()) as { text?: string; error?: string };
					if (!response.ok) throw new Error(data.error || "Transcription failed.");
					if (data.text?.trim()) onResult(data.text.trim());
					else setError("Didn't catch that — try again.");
				} catch (transcribeError) {
					setError(transcribeError instanceof Error ? transcribeError.message : "Transcription failed.");
				} finally {
					setIsTranscribing(false);
				}
			};
			recorder.start();
			recorderRef.current = recorder;
			setIsRecording(true);
		} catch {
			setError("Microphone permission was denied.");
		}
	}, [onResult]);

	const toggle = useCallback(() => {
		if (isRecording) stop();
		else void start();
	}, [isRecording, start, stop]);

	return { isRecording, isTranscribing, error, toggle };
}

/** Play assistant replies as speech via the TTS route; click again to stop. */
export function useSpeech() {
	const [speakingId, setSpeakingId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const stopAudio = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setSpeakingId(null);
	}, []);

	const speak = useCallback(
		async (id: string, text: string) => {
			const wasSpeaking = speakingId === id;
			stopAudio();
			if (wasSpeaking || !text.trim()) return;
			setSpeakingId(id);
			try {
				const response = await fetch("/api/ai/speak", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text }),
				});
				if (!response.ok) {
					setSpeakingId(null);
					return;
				}
				const url = URL.createObjectURL(await response.blob());
				const audio = new Audio(url);
				audioRef.current = audio;
				audio.onended = () => {
					URL.revokeObjectURL(url);
					if (audioRef.current === audio) audioRef.current = null;
					setSpeakingId((current) => (current === id ? null : current));
				};
				await audio.play();
			} catch {
				setSpeakingId(null);
			}
		},
		[speakingId, stopAudio],
	);

	return { speakingId, speak };
}
