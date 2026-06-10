"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState } from "react";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow } from "@xyflow/react";
import { Card, Pill } from "@/components/demo/shared";
import { computeKbGraphLayout, getKbGraphForScope, type KbGraphScope } from "@/features/admin/components/kb/graph-helpers";
import { KbNodeInspector } from "@/features/admin/components/kb/KbNodeInspector";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_CODES, DEPARTMENT_LABELS, type KbNode } from "@/features/admin/types";

const DEPARTMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
	IT: { bg: "var(--teal-050)", border: "var(--teal)", text: "var(--teal-700)" },
	REG: { bg: "var(--sand-050)", border: "var(--sand)", text: "var(--sand-600)" },
	MED: { bg: "var(--green-050)", border: "var(--green)", text: "#4f7e32" },
	SS: { bg: "#FCE9E1", border: "var(--rose)", text: "#a95338" },
	FIN: { bg: "var(--gold-050)", border: "var(--gold)", text: "#8b6428" },
	shared: { bg: "#FFFFFF", border: "var(--ink)", text: "var(--ink)" },
};

const KIND_LABELS: Record<KbNode["kind"], string> = {
	department: "Dept",
	faq: "FAQ",
	procedure: "Procedure",
	entity: "Entity",
};

function nodeColors(node: KbNode) {
	if (node.kind === "department") {
		const code = node.id.replace("dept-", "");
		return DEPARTMENT_COLORS[code] ?? DEPARTMENT_COLORS.shared;
	}
	return DEPARTMENT_COLORS[node.dept] ?? DEPARTMENT_COLORS.shared;
}

function CustomKbNode({ data }: { data: { node: KbNode } }) {
	const node = data.node;
	const colors = nodeColors(node);

	return (
		<div className="min-w-[190px] max-w-[230px] rounded-[18px] border-2 p-3 shadow-sm" style={{ borderColor: colors.border, background: colors.bg, color: "var(--ink)" }}>
			<Handle type="target" position={Position.Top} style={{ background: colors.border, borderColor: colors.border }} />
			<div className="flex items-center justify-between gap-2">
				<span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.12em]" style={{ color: colors.text }}>{KIND_LABELS[node.kind]}</span>
				<span className="rounded-full px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase" style={{ background: "#fff", color: colors.text }}>{node.dept}</span>
			</div>
			<div className="mt-2 line-clamp-3 text-sm font-[800] leading-snug">{node.label}</div>
			<Handle type="source" position={Position.Bottom} style={{ background: colors.border, borderColor: colors.border }} />
		</div>
	);
}

export function KnowledgeGraph() {
	const { kb, activeDepartment, loading } = useAdmin();
	const [scope, setScope] = useState<KbGraphScope>("department");
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const nodeTypes = useMemo(() => ({ kbNode: CustomKbNode }), []);
	const graph = useMemo(() => getKbGraphForScope(kb.nodes, kb.edges, activeDepartment, scope), [activeDepartment, kb.edges, kb.nodes, scope]);
	const positioned = useMemo(() => computeKbGraphLayout(graph.nodes, DEPARTMENT_CODES), [graph.nodes]);
	const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
	const flowNodes = useMemo(() => positioned.map((node) => ({
		id: node.id,
		type: "kbNode",
		position: node.position,
		data: { node },
	})), [positioned]);
	const flowEdges = useMemo(() => graph.edges.map((edge) => ({
		id: edge.id,
		source: edge.from,
		target: edge.to,
		label: edge.relation,
		type: "smoothstep",
		animated: edge.relation.includes("shared") || edge.relation.includes("used"),
		style: { stroke: "var(--line-2)", strokeWidth: 2 },
	})), [graph.edges]);

	return (
		<section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
			<Card className="overflow-hidden p-0">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}>
					<div>
						<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>GraphRAG canvas</p>
						<h2 className="mt-1 text-lg font-[800]">{scope === "department" ? DEPARTMENT_LABELS[activeDepartment] : "Whole-system"} knowledge graph</h2>
					</div>
					<div className="flex rounded-full border bg-white p-1" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-sm)" }}>
						{[
							{ value: "department" as const, label: "Department" },
							{ value: "system" as const, label: "Whole system" },
						].map((option) => (
							<button key={option.value} type="button" onClick={() => setScope(option.value)} className="rounded-full px-3 py-1.5 text-xs font-[800] transition" style={{ background: scope === option.value ? "var(--teal)" : "transparent", color: scope === option.value ? "#fff" : "var(--ink-2)" }}>
								{option.label}
							</button>
						))}
					</div>
				</div>

				<div className="h-[620px] bg-[#FCFAF6]">
					{loading ? (
						<div className="flex h-full items-center justify-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading knowledge graph...</div>
					) : (
						<ReactFlow
							nodes={flowNodes}
							edges={flowEdges}
							nodeTypes={nodeTypes}
							nodesDraggable={false}
							fitView
							fitViewOptions={{ padding: 0.2 }}
							onNodeClick={(_: unknown, node: { id: string }) => setSelectedNodeId(node.id)}
							proOptions={{ hideAttribution: true }}
						>
							<Background color="var(--line-2)" gap={24} size={1} />
							<Controls />
							<MiniMap pannable zoomable nodeColor={(node: { data?: { node?: KbNode } }) => node.data?.node ? nodeColors(node.data.node).border : "var(--teal)"} />
						</ReactFlow>
					)}
				</div>

				<div className="flex flex-wrap gap-2 border-t p-4" style={{ borderColor: "var(--line)" }}>
					{DEPARTMENT_CODES.map((dept) => <Pill key={dept} tint={dept === activeDepartment ? "teal" : "sand"}>{dept}</Pill>)}
					<Pill tint="green">{graph.nodes.length} nodes</Pill>
					<Pill tint="rose">{graph.edges.length} edges</Pill>
				</div>
			</Card>

			<KbNodeInspector node={selectedNode} onDeleted={() => setSelectedNodeId(null)} />
		</section>
	);
}
