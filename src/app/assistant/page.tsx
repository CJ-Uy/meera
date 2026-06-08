"use client";

import { useCallback, useEffect } from "react";
import { AiAssistant } from "@/features/ai/ai-assistant";

export default function AssistantPage() {
	useEffect(() => {
		const htmlBackground = document.documentElement.style.background;
		const bodyBackground = document.body.style.background;
		const bodyOverflow = document.body.style.overflow;
		document.documentElement.style.background = "transparent";
		document.body.style.background = "transparent";
		document.body.style.overflow = "hidden";
		return () => {
			document.documentElement.style.background = htmlBackground;
			document.body.style.background = bodyBackground;
			document.body.style.overflow = bodyOverflow;
		};
	}, []);

	const handleOpenChange = useCallback((isOpen: boolean) => {
		void window.meeraAssistant?.setOpen(isOpen);
	}, []);

	return (
		<main className="fixed inset-0 overflow-hidden bg-transparent" data-assistant-overlay-root>
			<AiAssistant onOpenChange={handleOpenChange} />
		</main>
	);
}
