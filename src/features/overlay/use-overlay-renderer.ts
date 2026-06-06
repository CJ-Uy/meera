"use client";

import { useEffect, useReducer, useRef } from "react";
import type { OverlayCommand } from "@/features/overlay/overlay-protocol";
import { initialOverlayState, overlayReducer } from "@/features/overlay/overlay-reducer";

function getDisplayId() {
	const value = new URLSearchParams(window.location.search).get("displayId");
	const displayId = Number(value);
	return Number.isFinite(displayId) ? displayId : 0;
}

export function useOverlayRenderer() {
	const [state, dispatch] = useReducer(overlayReducer, initialOverlayState);
	const removalTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

	useEffect(() => {
		const removalTimers = removalTimersRef.current;
		const previousHtmlBackground = document.documentElement.style.background;
		const previousBodyBackground = document.body.style.background;
		document.documentElement.style.background = "transparent";
		document.body.style.background = "transparent";

		const scheduleRemoval = (command: OverlayCommand) => {
			if (!("id" in command) || !("ttlMs" in command) || !command.ttlMs) return;
			const existingTimer = removalTimers.get(command.id);
			if (existingTimer) clearTimeout(existingTimer);
			const timer = setTimeout(() => {
				dispatch({ type: "overlay.remove", id: command.id });
				removalTimers.delete(command.id);
			}, command.ttlMs);
			removalTimers.set(command.id, timer);
		};

		const unsubscribe = window.meeraOverlay?.onCommand((command) => {
			if (command.type === "overlay.clear") {
				removalTimers.forEach(clearTimeout);
				removalTimers.clear();
			}
			dispatch(command);
			scheduleRemoval(command);
			window.meeraOverlay?.reportApplied(command.type);
		});

		window.meeraOverlay?.ready(getDisplayId());

		return () => {
			unsubscribe?.();
			removalTimers.forEach(clearTimeout);
			removalTimers.clear();
			document.documentElement.style.background = previousHtmlBackground;
			document.body.style.background = previousBodyBackground;
		};
	}, []);

	return state;
}
