import { getDatabaseAdapter } from "@/db";
import { AISIS_KB_NODES } from "@/features/ai/aisis-knowledge";
import type { KbNode } from "@/features/admin/types";

/**
 * Lightweight knowledge-base retrieval for the chat assistant.
 *
 * The admin-curated KB (label + body, tagged by department/kind) is scored against the latest user
 * message by keyword overlap and the top matches are formatted into a compact context block that the
 * AI service appends to the system prompt. This is deliberately dependency-free (no embeddings/vector
 * store) so it works in every adapter (local-sqlite, D1, shared API) and degrades to "" on any failure —
 * the chat must never break because the KB was unreachable or empty.
 */

const DEFAULT_MAX_ENTRIES = 4;
const MAX_BODY_CHARS = 600;
const NODE_CACHE_TTL_MS = 30_000;
const MIN_TERM_LENGTH = 3;

// Common words that carry no retrieval signal. Keeps short questions from matching everything.
const STOP_WORDS = new Set([
	"the", "and", "for", "are", "was", "but", "not", "you", "your", "with", "this", "that", "have", "has", "had",
	"how", "what", "when", "where", "why", "who", "which", "can", "could", "would", "should", "will", "does", "did",
	"about", "from", "into", "out", "get", "got", "any", "all", "please", "help", "need", "want", "there", "their",
	"its", "our", "they", "them", "his", "her", "him", "she", "been", "being", "than", "then", "some",
]);

type KbNodeCache = { at: number; nodes: KbNode[] };
let nodeCache: KbNodeCache | null = null;

/** DB-backed KB nodes, cached briefly. Returns [] (never throws) so a DB hiccup can't break chat. */
async function loadDbKbNodes(): Promise<KbNode[]> {
	try {
		const snapshot = await getDatabaseAdapter().loadAdminSnapshot();
		return snapshot.kb?.nodes ?? [];
	} catch (error) {
		console.error("[Meera KB] could not load DB knowledge nodes", error);
		return [];
	}
}

/**
 * All KB nodes available to retrieval: the built-in AISIS guide merged with admin-curated DB entries.
 * DB entries override the static defaults by id, so admins can correct or extend the AISIS guide.
 */
async function loadKbNodes(): Promise<KbNode[]> {
	if (nodeCache && Date.now() - nodeCache.at < NODE_CACHE_TTL_MS) return nodeCache.nodes;
	const byId = new Map<string, KbNode>();
	for (const node of AISIS_KB_NODES) byId.set(node.id, node);
	for (const node of await loadDbKbNodes()) byId.set(node.id, node);
	const nodes = [...byId.values()];
	nodeCache = { at: Date.now(), nodes };
	return nodes;
}

/** Test/maintenance hook: drop the cached KB nodes so the next retrieval reloads from the adapter. */
export function clearKnowledgeCache() {
	nodeCache = null;
}

function tokenize(text: string): string[] {
	return (
		text
			.toLowerCase()
			.match(/[a-z0-9]+/g)
			?.filter((term) => term.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(term)) ?? []
	);
}

function scoreNode(node: KbNode, queryTerms: Set<string>): number {
	const bodyTerms = new Set(tokenize(`${node.body ?? ""} ${node.dept} ${node.kind}`));
	const labelTerms = new Set(tokenize(node.label));
	let score = 0;
	for (const term of queryTerms) {
		// Label hits are the strongest signal (they name the topic); body/metadata hits count once.
		if (labelTerms.has(term)) score += 2;
		else if (bodyTerms.has(term)) score += 1;
	}
	return score;
}

function formatNode(node: KbNode): string {
	const body = (node.body ?? "").trim().replace(/\s+/g, " ");
	const trimmed = body.length > MAX_BODY_CHARS ? `${body.slice(0, MAX_BODY_CHARS)}…` : body;
	const dept = node.dept === "shared" ? "Shared" : node.dept;
	return `- [${dept} · ${node.kind}] ${node.label}${trimmed ? `: ${trimmed}` : ""}`;
}

/**
 * Returns a formatted context block of the most relevant KB entries for `query`, or "" when there is no
 * query, no matching knowledge, or the KB could not be loaded.
 */
export async function retrieveKnowledgeContext(query: string, limit = DEFAULT_MAX_ENTRIES): Promise<string> {
	const queryTerms = new Set(tokenize(query));
	if (queryTerms.size === 0) return "";

	let nodes: KbNode[];
	try {
		nodes = await loadKbNodes();
	} catch (error) {
		console.error("[Meera KB] retrieval failed", error);
		return "";
	}

	const ranked = nodes
		.map((node) => ({ node, score: scoreNode(node, queryTerms) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);

	if (ranked.length === 0) return "";
	return ranked.map((entry) => formatNode(entry.node)).join("\n");
}
