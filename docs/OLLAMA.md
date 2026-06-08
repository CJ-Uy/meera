# Using Ollama In Meera

Meera uses the remote Ollama instance at `https://ollama.cjuy.dev` through a server-side Next.js API route.

The browser and Electron renderer never call Ollama directly. This avoids browser CORS problems, keeps future credentials server-side, and gives Meera one place to validate requests and model responses.

## Models

- Text-only chat: `qwen3.5:9b`
- Any request containing an uploaded or shared-screen image: `qwen3-vl:8b`

The vision model uses a `4096` token context by default. Its larger default context tried to reserve more memory than the current Ollama host has available.

## Configuration

Copy `.env.example` to `.env.local` when you need to override the defaults:

```env
OLLAMA_BASE_URL=https://ollama.cjuy.dev
OLLAMA_CHAT_MODEL=qwen3.5:9b
OLLAMA_VISION_MODEL=qwen3-vl:8b
OLLAMA_CHAT_CONTEXT=8192
OLLAMA_VISION_CONTEXT=4096
OLLAMA_REQUEST_TIMEOUT_MS=180000
```

`OLLAMA_API_KEY` is optional. Keep it server-side and never create a `NEXT_PUBLIC_OLLAMA_*` variable.

## Running It

Open the browser app:

```powershell
pnpm dev
```

Then visit `http://localhost:3000/demo`.

The browser demo is only the support-session UI. Desktop overlays and the assistant launcher require Electron.

Open the Electron app with desktop overlays:

```powershell
pnpm desktop:dev
```

Click the Meera logo button floating at the bottom-right of the desktop to open the chat panel. The Electron launcher and chat panel are one always-on-top assistant window, separate from the main app window.

Try:

- `What can you help me with?`
- Upload an image, then ask `Describe this image.`
- In Electron, ask `What is on my screen?`
- In Electron, ask `Analyze my screen and point at the most important control.`
- In Electron, ask `Show every overlay type so I can test them.`
- Use **Screen** in the chat panel when you want to manually attach a fresh desktop frame.

## Architecture

### Server-side provider

- `src/app/api/ai/chat/route.ts`
  - `GET` checks Ollama/model availability.
  - `POST` validates chat input and calls Ollama.
- `src/features/ai/ollama-client.ts`
  - Selects the text or vision model.
  - Strips image data URLs to the base64 format Ollama expects.
  - Applies timeouts, context limits, system instructions, and overlay tools.
- `src/features/ai/ai-prompt.ts`
  - Defines Meera's system instructions.

### Validated actions

- `src/features/ai/ai-tools.ts`
	- Declares the tools Ollama can call.
	- Converts untrusted tool arguments into the existing `OverlayCommand` contract.
	- Clamps coordinates and rejects unknown tools.
	- Recovers guarded coordinate-style overlay responses when a model writes text instead of native tool calls.
- `src/features/ai/use-ai-overlay-actions.ts`
  - Executes validated commands through the existing Electron overlay bridge.

Supported AI overlay tools:

- Move or hide the AI cursor
- Show an arrow
- Show a highlight rectangle
- Show an overlay chat bubble
- Remove one annotation
- Clear the overlay

To add a future AI action:

1. Add a narrow tool declaration in `ai-tools.ts`.
2. Add strict argument conversion and validation.
3. Execute it through a dedicated client-side action hook.
4. Add tests for valid, malformed, and unsupported arguments.

Do not let model output call Electron IPC, shell commands, or browser APIs directly.

### Images and desktop frames

- `src/features/ai/image-input.ts`
	- Accepts JPEG, PNG, and WebP uploads.
	- Converts and resizes images before sending them.
	- Captures a still frame from Electron's desktop capture bridge.
	- Detects screen, visual guidance, and overlay prompts that should receive an automatic desktop frame.
- `src/features/ai/ai-assistant.tsx`
	- Renders the Electron assistant launcher and chat surface.
	- Composes chat, uploads, manual desktop frame capture, automatic frame capture, and action feedback.
- `src/app/assistant/page.tsx`
  - Renders the Electron-only assistant overlay surface.
- `electron/main.ts`
  - Creates the always-on-top assistant FAB window.
  - Resizes the window between the closed FAB size and open chat size.
  - Captures desktop frames for the assistant through Electron.

Screen understanding is request-based. In Electron, when auto-capture is enabled in the assistant, Meera attaches one fresh desktop frame before prompts that mention the screen, pointing, highlighting, cursors, arrows, overlays, or visual guidance. It is not a continuous autonomous screen-watching loop.

## API Shape

Meera sends a validated request to `POST /api/ai/chat`:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is on my screen?",
      "images": [
        {
          "id": "image-id",
          "name": "shared-screen.jpg",
          "mimeType": "image/jpeg",
          "dataUrl": "data:image/jpeg;base64,...",
          "source": "screen"
        }
      ]
    }
  ]
}
```

The response contains assistant text plus any requested overlay tool calls. The client validates every tool call again before sending an overlay command. Native model tool calls are preferred; coordinate-style overlay text is only recovered for prompts that clearly ask for visual overlay actions.

## Deployment Notes

- The default Ollama URL is currently reachable without a token. Add authentication or an application-level access check before exposing a public production deployment.
- Set server-side environment variables in the deployment platform. Do not ship Ollama credentials in React, Electron preload, or renderer code.
- Keep the vision context conservative unless the Ollama host has enough free memory.
- Uploaded and captured images are sent to the configured Ollama server for processing.
