import type {
	ArrowShowCommand,
	BubbleShowCommand,
	CursorMoveCommand,
	HighlightShowCommand,
	OverlayCommand,
} from "@/features/overlay/overlay-protocol";
import { normalizePoint, normalizeRect } from "@/features/overlay/overlay-protocol";

export type OverlayAnnotation = ArrowShowCommand | BubbleShowCommand | HighlightShowCommand;

export type OverlayState = {
	cursor: (CursorMoveCommand & { visible: true }) | { visible: false };
	annotations: Record<string, OverlayAnnotation>;
};

export const initialOverlayState: OverlayState = {
	cursor: { visible: false },
	annotations: {},
};

export function overlayReducer(state: OverlayState, command: OverlayCommand): OverlayState {
	switch (command.type) {
		case "cursor.move":
			return {
				...state,
				cursor: {
					...command,
					target: normalizePoint(command.target),
					visible: true,
				},
			};
		case "cursor.hide":
			return { ...state, cursor: { visible: false } };
		case "arrow.show":
		case "bubble.show":
			return {
				...state,
				annotations: {
					...state.annotations,
					[command.id]: { ...command, target: normalizePoint(command.target) },
				},
			};
		case "highlight.show":
			return {
				...state,
				annotations: {
					...state.annotations,
					[command.id]: { ...command, rect: normalizeRect(command.rect) },
				},
			};
		case "overlay.remove": {
			const annotations = { ...state.annotations };
			delete annotations[command.id];
			return { ...state, annotations };
		}
		case "overlay.clear":
			return initialOverlayState;
		default:
			return state;
	}
}
