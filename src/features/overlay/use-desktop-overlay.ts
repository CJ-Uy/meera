"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clearDesktopOverlay, isDesktopOverlayAvailable, sendOverlayCommand } from "@/features/overlay/overlay-client";
import type { OverlayCommand, OverlaySequenceStep } from "@/features/overlay/overlay-protocol";
import type { DesktopOverlayStatus } from "@/types/electron";

const subscribeToNothing = () => () => {};

export function useDesktopOverlay() {
	const available = useSyncExternalStore(subscribeToNothing, isDesktopOverlayAvailable, () => false);
	const [status, setStatus] = useState<DesktopOverlayStatus | null>(null);
	const [isRunningSequence, setIsRunningSequence] = useState(false);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const sequenceIdRef = useRef(0);

	useEffect(() => {
		if (!available) return;
		let active = true;
		void window.meeraOverlay?.getStatus().then((nextStatus) => {
			if (active) setStatus(nextStatus);
		});
		return () => {
			active = false;
		};
	}, [available]);

	const cancelSequence = useCallback(() => {
		sequenceIdRef.current += 1;
		timersRef.current.forEach(clearTimeout);
		timersRef.current = [];
		setIsRunningSequence(false);
	}, []);

	const sendCommand = useCallback(async (command: OverlayCommand) => {
		await sendOverlayCommand(command);
	}, []);

	const clear = useCallback(async () => {
		cancelSequence();
		await clearDesktopOverlay();
	}, [cancelSequence]);

	const runSequence = useCallback(
		(steps: OverlaySequenceStep[]) => {
			cancelSequence();
			const sequenceId = sequenceIdRef.current;
			setIsRunningSequence(true);

			for (const step of steps) {
				const timer = setTimeout(() => {
					if (sequenceIdRef.current !== sequenceId) return;
					void sendOverlayCommand(step.command);
				}, step.afterMs);
				timersRef.current.push(timer);
			}

			const finalDelay = Math.max(0, ...steps.map((step) => step.afterMs)) + 250;
			timersRef.current.push(
				setTimeout(() => {
					if (sequenceIdRef.current === sequenceId) setIsRunningSequence(false);
				}, finalDelay),
			);
		},
		[cancelSequence],
	);

	useEffect(() => cancelSequence, [cancelSequence]);

	return {
		available,
		status,
		isRunningSequence,
		sendCommand,
		runSequence,
		cancelSequence,
		clear,
	};
}
