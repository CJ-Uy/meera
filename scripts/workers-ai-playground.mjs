#!/usr/bin/env node
/**
 * Local Workers AI playground.
 *
 * Usage:
 *   node --env-file=.env.local scripts/workers-ai-playground.mjs --list
 *   node --env-file=.env.local scripts/workers-ai-playground.mjs <model> <prompt>
 *
 * Gateway compat model ids use the "workers-ai/" prefix:
 *   workers-ai/@cf/meta/llama-3.1-8b-instruct
 * Direct Workers AI endpoint model ids do not:
 *   @cf/meta/llama-3.1-8b-instruct
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_MODEL = "workers-ai/@cf/meta/llama-3.1-8b-instruct";
const TIMEOUT_MS = 30_000;

function loadEnvLocalIfNeeded() {
	if (process.env.WORKERS_AI_BASE_URL) {
		return;
	}

	let envFile;
	try {
		envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
	} catch {
		return;
	}

	for (const line of envFile.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
		if (!match) {
			continue;
		}

		const [, key, rawValue] = match;
		if (process.env[key] !== undefined) {
			continue;
		}

		let value = rawValue.trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
}

function parseArgs(argv) {
	const args = {
		json: false,
		list: false,
		model: undefined,
		prompt: undefined,
		system: undefined,
		help: false,
		positionals: [],
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "--help":
			case "-h":
				args.help = true;
				break;
			case "--json":
				args.json = true;
				break;
			case "--list":
				args.list = true;
				break;
			case "--model":
				args.model = readFlagValue(argv, index, "--model");
				index += 1;
				break;
			case "--prompt":
				args.prompt = readFlagValue(argv, index, "--prompt");
				index += 1;
				break;
			case "--system":
				args.system = readFlagValue(argv, index, "--system");
				index += 1;
				break;
			default:
				if (arg.startsWith("--")) {
					throw new Error(`Unknown flag: ${arg}`);
				}
				args.positionals.push(arg);
		}
	}

	if (!args.model && args.positionals.length >= 2) {
		args.model = args.positionals[0];
		args.prompt ??= args.positionals.slice(1).join(" ");
	} else if (!args.prompt && args.positionals.length > 0) {
		args.prompt = args.positionals.join(" ");
	}

	return args;
}

function readFlagValue(argv, index, flag) {
	const value = argv[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`${flag} requires a value.`);
	}
	return value;
}

function usage() {
	return `Workers AI playground

Usage:
  pnpm ai:models
  pnpm ai:chat <model> <prompt...>
  pnpm ai:chat --model <id> --prompt <text> [--system <text>] [--json]

Flags:
  --list             List available models.
  --model <id>       Model id to use. Defaults to WORKERS_AI_PLAYGROUND_MODEL.
  --prompt <text>    User prompt.
  --system <text>    Optional system prompt.
  --json             Print the raw JSON response.
  --help             Show this help.`;
}

function getConfig() {
	const baseUrl = process.env.WORKERS_AI_BASE_URL?.replace(/\/+$/, "");
	const apiKey = process.env.WORKERS_AI_API_KEY;
	const gatewayAuthToken = process.env.WORKERS_AI_GATEWAY_AUTH_TOKEN;
	const defaultModel = process.env.WORKERS_AI_PLAYGROUND_MODEL || DEFAULT_MODEL;

	if (!baseUrl) {
		throw new Error("Missing WORKERS_AI_BASE_URL. Add it to .env.local.");
	}
	if (!apiKey) {
		throw new Error("Missing WORKERS_AI_API_KEY. Add a Workers AI: Read token to .env.local.");
	}

	return { apiKey, baseUrl, defaultModel, gatewayAuthToken };
}

function buildHeaders(config) {
	const headers = {
		Authorization: `Bearer ${config.apiKey}`,
		"Content-Type": "application/json",
	};

	if (config.gatewayAuthToken) {
		headers["cf-aig-authorization"] = `Bearer ${config.gatewayAuthToken}`;
	}

	return headers;
}

async function requestJson(url, options) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetch(url, { ...options, signal: controller.signal });
		const body = await response.text();
		if (!response.ok) {
			throw new Error(`Request failed with ${response.status} ${response.statusText}\n${body}`);
		}
		return body ? JSON.parse(body) : {};
	} catch (error) {
		if (error.name === "AbortError") {
			throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s.`);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

async function listModels(config) {
	const json = await requestJson(`${config.baseUrl}/models`, {
		method: "GET",
		headers: buildHeaders(config),
	});
	const models = Array.isArray(json.data) ? json.data : Array.isArray(json.result) ? json.result : [];

	for (const model of models) {
		const id = model.id || model.name || String(model);
		const details = [model.name && model.name !== id ? model.name : undefined, model.task]
			.filter(Boolean)
			.join(" - ");
		console.log(details ? `${id} (${details})` : id);
	}
}

async function chat(config, args) {
	const model = args.model || config.defaultModel;
	if (!args.prompt) {
		throw new Error("Missing prompt. Pass <model> <prompt...> or --prompt <text>.");
	}

	const messages = [];
	if (args.system) {
		messages.push({ role: "system", content: args.system });
	}
	messages.push({ role: "user", content: args.prompt });

	const json = await requestJson(`${config.baseUrl}/chat/completions`, {
		method: "POST",
		headers: buildHeaders(config),
		body: JSON.stringify({
			model,
			messages,
			max_tokens: 512,
			stream: false,
		}),
	});

	if (args.json) {
		console.log(JSON.stringify(json, null, 2));
		return;
	}

	const content = json.choices?.[0]?.message?.content;
	if (Array.isArray(content)) {
		console.log(content.map((part) => part.text || part.content || "").join(""));
	} else if (content) {
		console.log(content);
	} else {
		console.log(JSON.stringify(json, null, 2));
	}
}

async function main() {
	loadEnvLocalIfNeeded();
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		console.log(usage());
		return;
	}

	const config = getConfig();
	if (args.list) {
		await listModels(config);
		return;
	}

	await chat(config, args);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
