import { describe, expect, it } from "vitest";
import { DEPARTMENT_CODES, type KbEdge, type KbNode } from "@/features/admin/types";
import { computeKbGraphLayout, filterKbGraphForDepartment } from "@/features/admin/components/kb/graph-helpers";

const nodes: KbNode[] = [
	{ id: "dept-IT", dept: "shared", kind: "department", label: "IT Help Desk" },
	{ id: "dept-REG", dept: "shared", kind: "department", label: "Registrar" },
	{ id: "faq-it-1", dept: "IT", kind: "faq", label: "Wi-Fi help" },
	{ id: "proc-it-1", dept: "IT", kind: "procedure", label: "Reset account" },
	{ id: "ent-student-portal", dept: "shared", kind: "entity", label: "Student Portal" },
	{ id: "faq-reg-1", dept: "REG", kind: "faq", label: "Registration hold" },
];

const edges: KbEdge[] = [
	{ id: "edge-it-faq", from: "dept-IT", to: "faq-it-1", relation: "owns" },
	{ id: "edge-it-proc", from: "dept-IT", to: "proc-it-1", relation: "owns" },
	{ id: "edge-reg-faq", from: "dept-REG", to: "faq-reg-1", relation: "owns" },
	{ id: "edge-it-shared", from: "ent-student-portal", to: "dept-IT", relation: "used-by" },
	{ id: "edge-reg-shared", from: "ent-student-portal", to: "dept-REG", relation: "used-by" },
];

describe("KB graph helpers", () => {
	it("filters department graph to active department plus shared bridge nodes", () => {
		const graph = filterKbGraphForDepartment(nodes, edges, "IT");

		expect(graph.nodes.map((node) => node.id).sort()).toEqual([
			"dept-IT",
			"ent-student-portal",
			"faq-it-1",
			"proc-it-1",
		]);
		expect(graph.edges.map((edge) => edge.id).sort()).toEqual([
			"edge-it-faq",
			"edge-it-proc",
			"edge-it-shared",
		]);
	});

	it("computes a deterministic radial layout with children orbiting their department hub", () => {
		const positioned = computeKbGraphLayout(nodes, DEPARTMENT_CODES);
		const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

		// Every node is placed with finite coordinates.
		expect(positioned).toHaveLength(nodes.length);
		for (const node of positioned) {
			expect(Number.isFinite(node.position.x)).toBe(true);
			expect(Number.isFinite(node.position.y)).toBe(true);
		}

		// Deterministic across runs (no physics jitter).
		const again = computeKbGraphLayout(nodes, DEPARTMENT_CODES);
		expect(again.map((node) => node.position)).toEqual(positioned.map((node) => node.position));

		const byId = Object.fromEntries(positioned.map((node) => [node.id, node.position]));
		// Department hubs sit at distinct cluster centres.
		expect(byId["dept-IT"]).not.toEqual(byId["dept-REG"]);
		// IT's FAQ orbits its own hub and is nearer to it than to the Registrar hub.
		expect(distance(byId["faq-it-1"], byId["dept-IT"])).toBeLessThan(220);
		expect(distance(byId["faq-it-1"], byId["dept-IT"])).toBeLessThan(distance(byId["faq-it-1"], byId["dept-REG"]));
	});
});
