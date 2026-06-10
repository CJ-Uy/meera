import type { DepartmentCode, KbEdge, KbNode } from "@/features/admin/types";

export type KbGraphScope = "department" | "system";

export type PositionedKbNode = KbNode & {
	position: {
		x: number;
		y: number;
	};
};

/** Which cluster a node belongs to: its department code, or "shared". */
function clusterKey(node: KbNode): string {
	if (node.kind === "department") return node.id.replace("dept-", "");
	return node.dept === "shared" ? "shared" : node.dept;
}

const CLUSTER_RADIUS = 460; // distance of each department hub from the canvas centre
const TWO_PI = Math.PI * 2;

/**
 * Force-directed-style radial layout: each department is a hub with its FAQs,
 * procedures, and entities orbiting around it, and the shared cluster anchors
 * the middle. Reads as a node-and-edge network rather than a flow chart, and is
 * fully deterministic so the canvas never jitters between renders.
 */
export function computeKbGraphLayout(nodes: KbNode[], departments: readonly DepartmentCode[]): PositionedKbNode[] {
	const groups = new Map<string, KbNode[]>();
	for (const node of nodes) {
		const key = clusterKey(node);
		const bucket = groups.get(key);
		if (bucket) bucket.push(node);
		else groups.set(key, [node]);
	}

	const keys = [...groups.keys()];
	const nonShared = keys
		.filter((key) => key !== "shared")
		.sort((a, b) => departments.indexOf(a as DepartmentCode) - departments.indexOf(b as DepartmentCode));
	const hasShared = keys.includes("shared");

	// Place each cluster centre.
	const centres = new Map<string, { x: number; y: number }>();
	if (nonShared.length <= 1) {
		if (nonShared.length === 1) centres.set(nonShared[0], { x: 0, y: 0 });
		if (hasShared) centres.set("shared", nonShared.length === 1 ? { x: 0, y: -CLUSTER_RADIUS } : { x: 0, y: 0 });
	} else {
		nonShared.forEach((key, index) => {
			const angle = (index / nonShared.length) * TWO_PI - Math.PI / 2;
			centres.set(key, { x: Math.cos(angle) * CLUSTER_RADIUS, y: Math.sin(angle) * CLUSTER_RADIUS });
		});
		if (hasShared) centres.set("shared", { x: 0, y: 0 });
	}

	const positioned: PositionedKbNode[] = [];
	for (const [key, members] of groups) {
		const centre = centres.get(key) ?? { x: 0, y: 0 };
		const hub = members.find((node) => node.kind === "department");
		const orbiters = members.filter((node) => node.kind !== "department").sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));

		if (hub) positioned.push({ ...hub, position: centre });

		const orbitRadius = 130 + Math.min(orbiters.length, 8) * 12;
		orbiters.forEach((node, index) => {
			const angle = (index / Math.max(1, orbiters.length)) * TWO_PI - Math.PI / 2;
			positioned.push({
				...node,
				position: { x: centre.x + Math.cos(angle) * orbitRadius, y: centre.y + Math.sin(angle) * orbitRadius },
			});
		});
	}

	return positioned;
}

export function filterKbGraphForDepartment(nodes: KbNode[], edges: KbEdge[], department: DepartmentCode) {
	const deptNodeId = `dept-${department}`;
	const visibleIds = new Set(
		nodes
			.filter((node) => node.id === deptNodeId || node.dept === department)
			.map((node) => node.id),
	);

	for (const edge of edges) {
		if (visibleIds.has(edge.from) || visibleIds.has(edge.to)) {
			const from = nodes.find((node) => node.id === edge.from);
			const to = nodes.find((node) => node.id === edge.to);
			if (from?.dept === "shared" && from.kind !== "department") visibleIds.add(from.id);
			if (to?.dept === "shared" && to.kind !== "department") visibleIds.add(to.id);
		}
	}

	const filteredNodes = nodes.filter((node) => visibleIds.has(node.id));
	const filteredEdges = edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to));

	return { nodes: filteredNodes, edges: filteredEdges };
}

export function getKbGraphForScope(nodes: KbNode[], edges: KbEdge[], department: DepartmentCode, scope: KbGraphScope) {
	return scope === "system" ? { nodes, edges } : filterKbGraphForDepartment(nodes, edges, department);
}
