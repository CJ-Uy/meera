import { describe, expect, it } from "vitest";
import { isDesktopScreenFrameCaptureAvailable, shouldAutoCaptureSharedScreen, shouldCalibrateOverlayFrame } from "@/features/ai/image-input";

describe("AI shared-screen auto capture heuristics", () => {
	it("captures for screen and overlay guidance prompts", () => {
		expect(shouldAutoCaptureSharedScreen("Analyze my shared screen and point at the button.")).toBe(true);
		expect(shouldAutoCaptureSharedScreen("Show an overlay arrow where I should click.")).toBe(true);
		expect(shouldAutoCaptureSharedScreen("What is on my screen?")).toBe(true);
		expect(shouldAutoCaptureSharedScreen("Suggest a random YouTube video.")).toBe(true);
		expect(shouldAutoCaptureSharedScreen("Find the settings button for me.")).toBe(true);
	});

	it("does not capture for ordinary text chat", () => {
		expect(shouldAutoCaptureSharedScreen("Summarize what Meera can do.")).toBe(false);
		expect(shouldAutoCaptureSharedScreen("Write a friendly welcome message.")).toBe(false);
		expect(shouldAutoCaptureSharedScreen("Show every overlay type so I can test them.")).toBe(false);
		expect(shouldAutoCaptureSharedScreen("Clear every overlay.")).toBe(false);
		expect(shouldAutoCaptureSharedScreen("Hide the cursor.")).toBe(false);
	});

	it("only calibrates screen frames for overlay placement prompts", () => {
		expect(shouldCalibrateOverlayFrame("Put an arrow on the video thumbnail.")).toBe(true);
		expect(shouldCalibrateOverlayFrame("Highlight the button I should click.")).toBe(true);
		expect(shouldCalibrateOverlayFrame("What is on my screen?")).toBe(false);
	});

	it("reports desktop capture unavailable outside Electron", () => {
		expect(isDesktopScreenFrameCaptureAvailable()).toBe(false);
	});
});
