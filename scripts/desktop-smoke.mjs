import { spawn } from "node:child_process";
import electronPath from "electron";

const port = 3010;
const appUrl = `http://localhost:${port}`;
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const electronArgs = ["."];
if (process.platform === "linux") electronArgs.push("--no-sandbox");

const web = spawn(pnpmCommand, ["exec", "next", "dev", "-p", port.toString()], {
	stdio: ["ignore", "pipe", "pipe"],
	env: process.env,
});

let electronProcess;
let settled = false;

function stopProcess(processToStop) {
	if (processToStop && !processToStop.killed) processToStop.kill("SIGTERM");
}

function finish(code, message) {
	if (settled) return;
	settled = true;
	stopProcess(electronProcess);
	stopProcess(web);
	if (message) console[code === 0 ? "log" : "error"](message);
	setTimeout(() => process.exit(code), 150);
}

async function waitForServer() {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(appUrl);
			if (response.ok) return;
		} catch {
			// The Next.js server is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error("Timed out waiting for the Next.js desktop smoke server.");
}

web.stderr.on("data", (chunk) => process.stderr.write(chunk));
web.on("exit", (code) => {
	if (!settled && code !== 0) finish(1, `Next.js smoke server exited early with code ${code}.`);
});

try {
	await waitForServer();
	const electronEnv = {
		...process.env,
		MEERA_APP_URL: appUrl,
		MEERA_SMOKE_TEST: "1",
	};
	delete electronEnv.ELECTRON_RUN_AS_NODE;
	electronProcess = spawn(electronPath, electronArgs, {
		stdio: ["ignore", "pipe", "pipe"],
		env: electronEnv,
	});

	let output = "";
	electronProcess.stdout.on("data", (chunk) => {
		const text = chunk.toString();
		output += text;
		process.stdout.write(text);
	});
	electronProcess.stderr.on("data", (chunk) => {
		const text = chunk.toString();
		output += text;
		process.stderr.write(text);
	});
	electronProcess.on("exit", (code) => {
		if (code === 0 && output.includes("MEERA_DESKTOP_SMOKE_OK")) {
			finish(0, "Desktop overlay smoke test passed.");
		} else {
			finish(code ?? 1, "Desktop overlay smoke test failed.");
		}
	});
} catch (error) {
	finish(1, error instanceof Error ? error.message : "Desktop overlay smoke test failed.");
}

setTimeout(() => finish(1, "Desktop overlay smoke test timed out."), 45_000);
