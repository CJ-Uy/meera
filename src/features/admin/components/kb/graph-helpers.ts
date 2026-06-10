import type { DepartmentCode, KbEdge, KbNode } from "@/features/admin/types";

export type KbGraphScope = "department" | "system";

export type PositionedKbNode = KbNode & {
	position: {
		x: number;
		y: number;
	};
};

const KIND_ORDER: KbNode["kind"][] = ["department", "faq", "procedure", "entity"];
const ROW_GAP = 180;
const COLUMN_GAP = 280;

function departmentColumn(node: KbNode, departments: readonly DepartmentCode[]) {
	if (node.kind === "department") {
		const code = node.id.replace("dept-", "") as DepartmentCode;
		const index = departments.indexOf(code);
		return index === -1 ? departments.length : index;
	}
	if (node.dept === "shared") return departments.length;
	const index = departments.indexOf(node.dept);
	return index === -1 ? departments.length : index;
}

function kindRow(kind: KbNode["kind"]) {
	const index = KIND_ORDER.indexOf(kind);
	return index === -1 ? KIND_ORDER.length : index;
}

export function computeKbGraphLayout(nodes: KbNode[], departments: readonly DepartmentCode[]): PositionedKbNode[] {
	const sorted = [...nodes].sort((a, b) => {
		const deptDelta = departmentColumn(a, departments) - departmentColumn(b, departments);
		if (deptDelta !== 0) return deptDelta;
		const rowDelta = kindRow(a.kind) - kindRow(b.kind);
		if (rowDelta !== 0) return rowDelta;
		return a.id.localeCompare(b.id);
	});

	const rowCounts = new Map<string, number>();

	return sorted.map((node) => {
		const column = departmentColumn(node, departments);
		const row = kindRow(node.kind);
		const rowKey = `${column}:${row}`;
		const offset = rowCounts.get(rowKey) ?? 0;
		rowCounts.set(rowKey, offset + 1);

		return {
			...node,
			position: {
				x: column * COLUMN_GAP + offset * 72,
				y: row * ROW_GAP,
			},
		};
	});
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
