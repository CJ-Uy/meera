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

	it("computes deterministic layered positions by department and kind", () => {
		const positioned = computeKbGraphLayout(nodes, DEPARTMENT_CODES);
		const byId = Object.fromEntries(positioned.map((node) => [node.id, node.position]));

		expect(byId["dept-IT"]).toEqual({ x: 0, y: 0 });
		expect(byId["faq-it-1"].y).toBe(180);
		expect(byId["proc-it-1"].y).toBe(360);
		expect(byId["ent-student-portal"].y).toBe(540);
		expect(byId["dept-REG"].x).toBeGreaterThan(byId["dept-IT"].x);
	});
});
