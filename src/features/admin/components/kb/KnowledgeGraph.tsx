"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState, type CSSProperties } from "react";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow } from "@xyflow/react";
import { Card, Pill } from "@/components/demo/shared";
import { computeKbGraphLayout, getKbGraphForScope, type KbGraphScope } from "@/features/admin/components/kb/graph-helpers";
import { KbNodeInspector } from "@/features/admin/components/kb/KbNodeInspector";
import { departmentAccent } from "@/features/admin/department-theme";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_CODES, DEPARTMENT_LABELS, type DepartmentCode, type KbNode } from "@/features/admin/types";

function accentFor(node: KbNode) {
	const code = (node.kind === "department" ? node.id.replace("dept-", "") : node.dept) as DepartmentCode | "shared";
	return departmentAccent(code);
}

function dotSize(node: KbNode) {
	if (node.kind === "department") return 54;
	if (node.kind === "faq") return 30;
	if (node.kind === "procedure") return 28;
	return 22;
}

const HIDDEN_HANDLE: CSSProperties = { opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1, border: "none", background: "transparent" };

function KbDot({ data }: { data: { node: KbNode; selected: boolean } }) {
	const { node, selected } = data;
	const accent = accentFor(node);
	const isHub = node.kind === "department";
	const size = dotSize(node);

	return (
		<div style={{ position: "relative", width: size, height: size }}>
			<Handle type="target" position={Position.Top} style={HIDDEN_HANDLE} isConnectable={false} />
			<div
				title={node.label}
				style={{
					width: size,
					height: size,
					borderRadius: "50%",
					background: isHub ? accent.solid : "#fff",
					border: `${isHub ? 2 : 3}px solid ${accent.solid}`,
					boxShadow: selected
						? `0 0 0 4px ${accent.soft}, 0 8px 18px rgba(28,51,73,0.22)`
						: "0 2px 6px rgba(28,51,73,0.12)",
					display: "grid",
					placeItems: "center",
					cursor: "pointer",
					transition: "box-shadow 0.15s ease",
				}}
			>
				{isHub ? (
					<span style={{ color: "#fff", fontWeight: 800, fontSize: 12, letterSpacing: "0.04em" }}>{node.id.replace("dept-", "")}</span>
				) : (
					<span style={{ width: size * 0.34, height: size * 0.34, borderRadius: "50%", background: accent.solid }} />
				)}
			</div>
			<div style={{ position: "absolute", top: size + 6, left: "50%", transform: "translateX(-50%)", width: 144, textAlign: "center", pointerEvents: "none" }}>
				<span
					style={{
						fontSize: isHub ? 12 : 11,
						fontWeight: isHub ? 800 : 700,
						lineHeight: 1.2,
						color: selected ? accent.text : "var(--ink)",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{node.label}
				</span>
			</div>
			<Handle type="source" position={Position.Bottom} style={HIDDEN_HANDLE} isConnectable={false} />
		</div>
	);
}

export function KnowledgeGraph() {
	const { kb, activeDepartment, loading } = useAdmin();
	const [scope, setScope] = useState<KbGraphScope>("department");
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const nodeTypes = useMemo(() => ({ kbNode: KbDot }), []);
	const graph = useMemo(() => getKbGraphForScope(kb.nodes, kb.edges, activeDepartment, scope), [activeDepartment, kb.edges, kb.nodes, scope]);
	const positioned = useMemo(() => computeKbGraphLayout(graph.nodes, DEPARTMENT_CODES), [graph.nodes]);
	const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? null;

	const flowNodes = useMemo(
		() => positioned.map((node) => ({ id: node.id, type: "kbNode", position: node.position, data: { node, selected: node.id === selectedNodeId }, draggable: false })),
		[positioned, selectedNodeId],
	);
	const flowEdges = useMemo(
		() =>
			graph.edges.map((edge) => {
				const touchesSelected = selectedNodeId !== null && (edge.from === selectedNodeId || edge.to === selectedNodeId);
				return {
					id: edge.id,
					source: edge.from,
					target: edge.to,
					type: "straight",
					style: { stroke: touchesSelected ? "var(--teal)" : "var(--line-2)", strokeWidth: touchesSelected ? 2.2 : 1.4, opacity: touchesSelected ? 1 : 0.85 },
				};
			}),
		[graph.edges, selectedNodeId],
	);

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

				<div className="h-[620px]" style={{ background: "radial-gradient(circle at 30% 20%, #FFFFFF 0%, #FCFAF6 55%, #F6EEE1 100%)" }}>
					{loading ? (
						<div className="flex h-full items-center justify-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading knowledge graph...</div>
					) : graph.nodes.length === 0 ? (
						<div className="flex h-full items-center justify-center text-sm font-bold" style={{ color: "var(--muted)" }}>No knowledge nodes for this scope yet — add one from the panel above.</div>
					) : (
						<ReactFlow
							nodes={flowNodes}
							edges={flowEdges}
							nodeTypes={nodeTypes}
							nodesDraggable={false}
							nodesConnectable={false}
							fitView
							fitViewOptions={{ padding: 0.28 }}
							minZoom={0.3}
							onNodeClick={(_: unknown, node: { id: string }) => setSelectedNodeId(node.id)}
							onPaneClick={() => setSelectedNodeId(null)}
							proOptions={{ hideAttribution: true }}
						>
							<Background color="var(--line-2)" gap={26} size={1} />
							<Controls showInteractive={false} />
							<MiniMap pannable zoomable nodeColor={(node: { data?: { node?: KbNode } }) => (node.data?.node ? accentFor(node.data.node).solid : "var(--teal)")} nodeStrokeWidth={0} maskColor="rgba(251,246,238,0.6)" />
						</ReactFlow>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2 border-t p-4" style={{ borderColor: "var(--line)" }}>
					<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Legend</span>
					{DEPARTMENT_CODES.map((dept) => {
						const tint = departmentAccent(dept);
						return (
							<span key={dept} className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ borderColor: "var(--line)", color: tint.text }}>
								<span className="size-2.5 rounded-full" style={{ background: tint.solid }} />
								{dept}
							</span>
						);
					})}
					<span className="ml-auto" />
					<Pill tint="green">{graph.nodes.length} nodes</Pill>
					<Pill tint="rose">{graph.edges.length} edges</Pill>
				</div>
			</Card>

			<KbNodeInspector node={selectedNode} onDeleted={() => setSelectedNodeId(null)} />
		</section>
	);
}
