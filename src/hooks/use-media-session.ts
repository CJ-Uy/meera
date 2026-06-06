"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getPictureInPictureApi, paintCompanion } from "@/lib/document-picture-in-picture";
import type { MediaState } from "@/lib/media-types";

const subscribeToNothing = () => () => {};

export function useMediaSession() {
	const [screenState, setScreenState] = useState<MediaState>("idle");
	const [micState, setMicState] = useState<MediaState>("idle");
	const [mediaError, setMediaError] = useState<string | null>(null);
	const [isCompanionOpen, setIsCompanionOpen] = useState(false);
	const supportsCompanion = useSyncExternalStore(
		subscribeToNothing,
		() => Boolean(getPictureInPictureApi()),
		() => false,
	);

	const previewRef = useRef<HTMLVideoElement>(null);
	const micMeterRef = useRef<HTMLDivElement>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const meterFrameRef = useRef<number | null>(null);
	const companionWindowRef = useRef<Window | null>(null);

	useEffect(() => {
		return () => {
			screenStreamRef.current?.getTracks().forEach((track) => track.stop());
			micStreamRef.current?.getTracks().forEach((track) => track.stop());
			audioSourceRef.current?.disconnect();
			void audioContextRef.current?.close();
			companionWindowRef.current?.close();
			if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
		};
	}, []);

	const closeCompanion = useCallback(() => {
		companionWindowRef.current?.close();
		companionWindowRef.current = null;
		setIsCompanionOpen(false);
	}, []);

	const stopScreenShare = useCallback(() => {
		const stream = screenStreamRef.current;
		screenStreamRef.current = null;
		stream?.getTracks().forEach((track) => track.stop());
		if (previewRef.current) previewRef.current.srcObject = null;
		setScreenState("idle");
		closeCompanion();
	}, [closeCompanion]);

	const startScreenShare = useCallback(async () => {
		if (!navigator.mediaDevices?.getDisplayMedia) {
			setMediaError("Screen sharing is not supported in this browser.");
			return;
		}

		setMediaError(null);
		setScreenState("requesting");

		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
			const [videoTrack] = stream.getVideoTracks();

			screenStreamRef.current = stream;
			if (previewRef.current) previewRef.current.srcObject = stream;
			videoTrack?.addEventListener(
				"ended",
				() => {
					if (screenStreamRef.current === stream) stopScreenShare();
				},
				{ once: true },
			);
			setScreenState("active");
		} catch (error) {
			setScreenState("idle");
			setMediaError(
				error instanceof DOMException && error.name === "NotAllowedError"
					? "Screen sharing was cancelled. Nothing was shared."
					: "Meera could not start screen sharing. Please try again.",
			);
		}
	}, [stopScreenShare]);

	const stopMicrophone = useCallback(() => {
		const stream = micStreamRef.current;
		micStreamRef.current = null;
		stream?.getTracks().forEach((track) => track.stop());
		audioSourceRef.current?.disconnect();
		audioSourceRef.current = null;
		void audioContextRef.current?.close();
		audioContextRef.current = null;
		if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
		meterFrameRef.current = null;
		micMeterRef.current?.style.setProperty("--level", "0");
		micMeterRef.current?.style.setProperty("--peak", "0");
		setMicState("idle");
	}, []);

	const startMicrophone = useCallback(async () => {
		if (!navigator.mediaDevices?.getUserMedia) {
			setMediaError("Microphone access is not supported in this browser.");
			return;
		}

		setMediaError(null);
		setMicState("requesting");

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
				video: false,
			});
			micStreamRef.current = stream;
			const audioContext = new AudioContext();
			const analyser = audioContext.createAnalyser();
			const source = audioContext.createMediaStreamSource(stream);

			analyser.fftSize = 1024;
			const waveform = new Float32Array(analyser.fftSize);
			source.connect(analyser);
			void audioContext.resume();
			audioContextRef.current = audioContext;
			audioSourceRef.current = source;

			let displayedLevel = 0;
			let peakLevel = 0;
			let peakHoldUntil = 0;

			const paintMeter = () => {
				analyser.getFloatTimeDomainData(waveform);
				let sumOfSquares = 0;
				for (const sample of waveform) sumOfSquares += sample * sample;

				const rootMeanSquare = Math.sqrt(sumOfSquares / waveform.length);
				const decibels = 20 * Math.log10(Math.max(rootMeanSquare, 0.00001));
				const normalizedLevel = Math.min(1, Math.max(0, (decibels + 58) / 46));
				const responsiveLevel = normalizedLevel ** 0.72;

				// React quickly to speech, then fall away smoothly so the meter stays readable.
				const smoothing = responsiveLevel > displayedLevel ? 0.58 : 0.12;
				displayedLevel += (responsiveLevel - displayedLevel) * smoothing;

				const now = performance.now();
				if (displayedLevel >= peakLevel) {
					peakLevel = displayedLevel;
					peakHoldUntil = now + 450;
				} else if (now > peakHoldUntil) {
					peakLevel = Math.max(displayedLevel, peakLevel - 0.018);
				}

				const meter = micMeterRef.current;
				meter?.style.setProperty("--level", displayedLevel.toFixed(3));
				meter?.style.setProperty("--peak", peakLevel.toFixed(3));
				meter?.setAttribute("aria-valuenow", Math.round(displayedLevel * 100).toString());
				meterFrameRef.current = requestAnimationFrame(paintMeter);
			};

			const [audioTrack] = stream.getAudioTracks();
			audioTrack?.addEventListener(
				"ended",
				() => {
					if (micStreamRef.current === stream) stopMicrophone();
				},
				{ once: true },
			);
			setMicState("active");
			meterFrameRef.current = requestAnimationFrame(paintMeter);
		} catch (error) {
			stopMicrophone();
			setMediaError(
				error instanceof DOMException && error.name === "NotAllowedError"
					? "Microphone access was declined. You can continue without voice."
					: "Meera could not connect to your microphone. Please try again.",
			);
		}
	}, [stopMicrophone]);

	const toggleMicrophone = useCallback(() => {
		if (micState === "active") stopMicrophone();
		if (micState === "idle") void startMicrophone();
	}, [micState, startMicrophone, stopMicrophone]);

	const openCompanion = useCallback(async () => {
		const pictureInPictureApi = getPictureInPictureApi();
		if (!pictureInPictureApi) {
			setMediaError("The always-on-top companion is available in supported Chromium browsers.");
			return;
		}

		try {
			companionWindowRef.current?.close();
			const companionWindow = await pictureInPictureApi.requestWindow({ width: 350, height: 180 });
			companionWindowRef.current = companionWindow;
			setIsCompanionOpen(true);
			companionWindow.addEventListener(
				"pagehide",
				() => {
					companionWindowRef.current = null;
					setIsCompanionOpen(false);
				},
				{ once: true },
			);
			paintCompanion(companionWindow, micState, stopScreenShare, toggleMicrophone);
		} catch {
			setMediaError("The floating companion could not open. The in-page sharing badge is still active.");
		}
	}, [micState, stopScreenShare, toggleMicrophone]);

	useEffect(() => {
		const companionWindow = companionWindowRef.current;
		if (companionWindow) paintCompanion(companionWindow, micState, stopScreenShare, toggleMicrophone);
	}, [micState, stopScreenShare, toggleMicrophone]);

	const clearMediaError = useCallback(() => setMediaError(null), []);

	return {
		screenState,
		micState,
		mediaError,
		supportsCompanion,
		isCompanionOpen,
		previewRef,
		micMeterRef,
		startScreenShare,
		stopScreenShare,
		toggleMicrophone,
		openCompanion,
		clearMediaError,
	};
}
