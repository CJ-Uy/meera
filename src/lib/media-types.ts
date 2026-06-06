export type MediaState = "idle" | "requesting" | "active";

export const MEDIA_STATUS_COPY: Record<MediaState, string> = {
	idle: "Off",
	requesting: "Waiting for permission",
	active: "Live",
};
