/**
 * Comprehensive Integration Tests for Cognitive Components
 * 
 * Tests the integration of:
 * - PLN Reasoning
 * - ECAN Attention
 * - HTN Planning
 * - Scheme Kernel
 * - Cognitive Orchestrator
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PLNReasoning } from "../PLNReasoning";
import { ECANManager } from "../ECANAttention";
import { HTNPlanner } from "../HTNPlannerIntegration";
import { SchemeKernel, CognitiveGrammar } from "../SchemeKernel";
import { CognitiveOrchestrator } from "../CognitiveOrchestrator";
import { Atom, Link, Node, Goal, TruthValue } from "../../types/cognitive";

// Helper function to create test atoms
function createTestNode(
	id: string,
	name: string,
	truthValue?: TruthValue
): Node {
	return {
		id,
		type: "ConceptNode",
		name,
		truthValue: truthValue || { strength: 0.8, confidence: 0.7 },
		attentionValue: { sti: 50, lti: 20, vlti: 0 },
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

function createTestLink(
	id: string,
	outgoing: string[],
	truthValue?: TruthValue
): Link {
	return {
		id,
		type: "ImplicationLink",
		outgoing,
		truthValue: truthValue || { strength: 0.7, confidence: 0.6 },
		attentionValue: { sti: 30, lti: 10, vlti: 0 },
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

describe("PLN Reasoning Tests", () => {
	it("should perform deduction inference", () => {
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");
		const nodeC = createTestNode("c", "C");

		const linkAB = createTestLink("ab", [nodeA.id, nodeB.id], {
			strength: 0.9,
			confidence: 0.8,
		});
		const linkBC = createTestLink("bc", [nodeB.id, nodeC.id], {
			strength: 0.8,
			confidence: 0.7,
		});

		const result = PLNReasoning.deduction(linkAB, linkBC);

		expect(result).not.toBeNull();
		expect(result!.rule).toBe("Deduction");
		expect(result!.conclusion.outgoing).toEqual([nodeA.id, nodeC.id]);
		expect(result!.truthValue.strength).toBeCloseTo(0.72, 2); // 0.9 * 0.8
	});

	it("should perform induction inference", () => {
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");
		const nodeC = createTestNode("c", "C");

		const linkAB = createTestLink("ab", [nodeA.id, nodeB.id]);
		const linkAC = createTestLink("ac", [nodeA.id, nodeC.id]);

		const result = PLNReasoning.induction(linkAB, linkAC);

		expect(result).not.toBeNull();
		expect(result!.rule).toBe("Induction");
		expect(result!.conclusion.outgoing).toEqual([nodeB.id, nodeC.id]);
	});

	it("should perform revision of truth values", () => {
		const tv1: TruthValue = { strength: 0.7, confidence: 0.6 };
		const tv2: TruthValue = { strength: 0.8, confidence: 0.5 };

		const revised = PLNReasoning.revision(tv1, tv2);

		expect(revised.strength).toBeGreaterThan(0.7);
		expect(revised.strength).toBeLessThan(0.8);
		expect(revised.confidence).toBeGreaterThan(0.6);
	});

	it("should calculate similarity", () => {
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");

		const similarity = PLNReasoning.similarity(nodeA, nodeB, 5, 10);

		expect(similarity.strength).toBe(0.5); // 5/10
		expect(similarity.confidence).toBeGreaterThan(0);
	});

	it("should perform inference chain", () => {
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");
		const nodeC = createTestNode("c", "C");

		const linkAB = createTestLink("ab", [nodeA.id, nodeB.id], {
			strength: 0.9,
			confidence: 0.8,
		});
		const linkBC = createTestLink("bc", [nodeB.id, nodeC.id], {
			strength: 0.8,
			confidence: 0.7,
		});

		const results = PLNReasoning.inferenceChain([linkAB, linkBC], 2);

		expect(results.length).toBeGreaterThan(0);
		expect(results.some((r) => r.rule === "Deduction")).toBe(true);
	});
});

describe("ECAN Attention Tests", () => {
	let ecanManager: ECANManager;

	beforeEach(() => {
		ecanManager = new ECANManager();
	});

	it("should update attention values with decay", () => {
		const atom = createTestNode("test", "TestNode");
		atom.attentionValue = { sti: 100, lti: 50, vlti: 0 };

		const updated = ecanManager.updateAttention(atom, 0);

		expect(updated.sti).toBeLessThan(100); // Decayed
		expect(updated.lti).toBeGreaterThan(0);
	});

	it("should stimulate atoms", () => {
		const atom = createTestNode("test", "TestNode");
		atom.attentionValue = { sti: 50, lti: 20, vlti: 0 };

		const updated = ecanManager.stimulate(atom, 30);

		expect(updated.sti).toBeGreaterThan(50);
	});

	it("should identify atoms for forgetting", () => {
		const lowSTIAtom = createTestNode("low", "LowSTI");
		lowSTIAtom.attentionValue = { sti: -150, lti: 0, vlti: 0 };

		const highVLTIAtom = createTestNode("high", "HighVLTI");
		highVLTIAtom.attentionValue = { sti: -150, lti: 0, vlti: 100 };

		expect(ecanManager.shouldForget(lowSTIAtom)).toBe(true);
		expect(ecanManager.shouldForget(highVLTIAtom)).toBe(false);
	});

	it("should get attentional focus", () => {
		const atoms = [
			createTestNode("a", "A"),
			createTestNode("b", "B"),
			createTestNode("c", "C"),
		];

		atoms[0].attentionValue.sti = 100;
		atoms[1].attentionValue.sti = 50;
		atoms[2].attentionValue.sti = 10;

		const focus = ecanManager.getAttentionalFocus(atoms, 2);

		expect(focus.length).toBe(2);
		expect(focus[0].id).toBe("a");
		expect(focus[1].id).toBe("b");
	});

	it("should calculate attention statistics", () => {
		const atoms = [
			createTestNode("a", "A"),
			createTestNode("b", "B"),
			createTestNode("c", "C"),
		];

		atoms[0].attentionValue.sti = 100;
		atoms[1].attentionValue.sti = 50;
		atoms[2].attentionValue.sti = -200;

		const stats = ecanManager.getStatistics(atoms);

		expect(stats.totalSTI).toBe(-50);
		expect(stats.averageSTI).toBeCloseTo(-16.67, 1);
		expect(stats.forgettableAtoms).toBeGreaterThan(0);
	});
});

describe("HTN Planner Tests", () => {
	let planner: HTNPlanner;

	beforeEach(() => {
		planner = new HTNPlanner();
	});

	it("should register and retrieve tasks", () => {
		const task = {
			id: "test_task",
			name: "Test Task",
			type: "primitive" as const,
			parameters: {},
			preconditions: [],
			effects: [],
			action: { type: "create_atom" as const, parameters: {} },
		};

		planner.registerTask(task);
		const retrieved = planner.getTask("test_task");

		expect(retrieved).toBeDefined();
		expect(retrieved!.name).toBe("Test Task");
	});

	it("should plan for a goal", async () => {
		const goal: Goal = {
			id: "goal1",
			type: "explicit",
			description: "Test Goal",
			priority: 5,
			status: "active",
			conditions: [],
			actions: [
				{ type: "create_atom", parameters: { name: "test" } },
			],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const state = {
			atoms: new Map(),
			goals: [goal],
			currentTime: Date.now(),
		};

		const plan = await planner.plan(goal, state);

		expect(plan.success).toBe(true);
		expect(plan.tasks.length).toBeGreaterThan(0);
	});

	it("should get all registered tasks", () => {
		const tasks = planner.getAllTasks();
		expect(tasks.length).toBeGreaterThan(0); // Default tasks
	});
});

describe("Scheme Kernel Tests", () => {
	let kernel: SchemeKernel;

	beforeEach(() => {
		kernel = new SchemeKernel();
	});

	it("should evaluate arithmetic expressions", () => {
		expect(kernel.execute("(+ 1 2 3)")).toBe(6);
		expect(kernel.execute("(* 2 3 4)")).toBe(24);
		expect(kernel.execute("(- 10 3)")).toBe(7);
	});

	it("should evaluate comparison expressions", () => {
		expect(kernel.execute("(= 5 5)")).toBe(true);
		expect(kernel.execute("(< 3 5)")).toBe(true);
		expect(kernel.execute("(> 10 5)")).toBe(true);
	});

	it("should handle variable definition", () => {
		kernel.execute("(define x 42)");
		expect(kernel.execute("x")).toBe(42);
	});

	it("should handle lambda functions", () => {
		kernel.execute("(define square (lambda (x) (* x x)))");
		expect(kernel.execute("(square 5)")).toBe(25);
	});

	it("should handle if expressions", () => {
		const result = kernel.execute("(if #t 1 2)");
		expect(result).toBe(1);

		const result2 = kernel.execute("(if #f 1 2)");
		expect(result2).toBe(2);
	});

	it("should convert atoms to Scheme", () => {
		const node = createTestNode("test", "TestNode");
		const schemeRepr = kernel.atomToScheme(node);

		expect(schemeRepr).toBeDefined();
	});
});

describe("Cognitive Grammar Tests", () => {
	let grammar: CognitiveGrammar;

	beforeEach(() => {
		grammar = new CognitiveGrammar();
	});

	it("should execute cognitive operations", () => {
		const result = grammar.execute("(+ 1 2)");
		expect(result).toBe(3);
	});

	it("should have pattern matching capability", () => {
		// Test pattern matching primitive
		const result = grammar.execute("(match-pattern 'x 'y)");
		expect(result).toBeDefined();
	});
});

describe("Cognitive Orchestrator Tests", () => {
	let orchestrator: CognitiveOrchestrator;
	let mockEnv: any;

	beforeEach(() => {
		mockEnv = {
			ATOMSPACE: {},
			MIND_AGENT: {},
			COGNITIVE_DB: {},
			ATOM_CACHE: {},
			AI: {},
		};

		orchestrator = new CognitiveOrchestrator(mockEnv, {
			enablePLN: true,
			enableECAN: true,
			enableHTN: true,
			enableScheme: true,
			cycleInterval: 1000,
			maxInferencesPerCycle: 5,
			maxPlansPerCycle: 3,
		});
	});

	it("should initialize with correct configuration", () => {
		const status = orchestrator.getStatus();

		expect(status.components.pln).toBe(true);
		expect(status.components.ecan).toBe(true);
		expect(status.components.htn).toBe(true);
		expect(status.components.scheme).toBe(true);
	});

	it("should perform inference", async () => {
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");
		const linkAB = createTestLink("ab", [nodeA.id, nodeB.id]);

		const inferences = await orchestrator.performInference([linkAB]);

		expect(Array.isArray(inferences)).toBe(true);
	});

	it("should execute Scheme code", () => {
		const result = orchestrator.executeScheme("(+ 10 20)");
		expect(result).toBe(30);
	});

	it("should get attention statistics", () => {
		const atoms = [
			createTestNode("a", "A"),
			createTestNode("b", "B"),
		];

		const stats = orchestrator.getAttentionStatistics(atoms);

		expect(stats).toBeDefined();
		expect(stats.totalSTI).toBeDefined();
		expect(stats.averageSTI).toBeDefined();
	});

	it("should stimulate atoms", () => {
		const atoms = [createTestNode("a", "A")];
		const updates = orchestrator.stimulateAtoms(atoms, 50);

		expect(updates.size).toBe(1);
		expect(updates.has("a")).toBe(true);
	});

	it("should update configuration", () => {
		orchestrator.updateConfig({ cycleInterval: 2000 });
		const status = orchestrator.getStatus();

		expect(status.config.cycleInterval).toBe(2000);
	});

	it("should reset orchestrator", () => {
		orchestrator.reset();
		const status = orchestrator.getStatus();

		expect(status.cycleCount).toBe(0);
		expect(status.isRunning).toBe(false);
	});

	it("should get all components", () => {
		const components = orchestrator.getComponents();

		expect(components.plnReasoning).toBeDefined();
		expect(components.ecanManager).toBeDefined();
		expect(components.htnPlanner).toBeDefined();
		expect(components.schemeKernel).toBeDefined();
		expect(components.cognitiveGrammar).toBeDefined();
	});
});

describe("Integration Tests", () => {
	it("should integrate PLN and ECAN", () => {
		const ecan = new ECANManager();
		const nodeA = createTestNode("a", "A");
		const nodeB = createTestNode("b", "B");
		const linkAB = createTestLink("ab", [nodeA.id, nodeB.id]);

		// Stimulate atoms
		const updatedA = ecan.stimulate(nodeA, 100);
		const updatedB = ecan.stimulate(nodeB, 50);

		// Perform inference
		const inferences = PLNReasoning.inferenceChain([linkAB], 1);

		expect(updatedA.sti).toBeGreaterThan(nodeA.attentionValue.sti);
		expect(inferences).toBeDefined();
	});

	it("should integrate HTN and Scheme", async () => {
		const planner = new HTNPlanner();
		const kernel = new SchemeKernel();

		const goal: Goal = {
			id: "goal1",
			type: "explicit",
			description: "Test Integration",
			priority: 5,
			status: "active",
			conditions: [],
			actions: [{ type: "create_atom", parameters: {} }],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		const state = {
			atoms: new Map(),
			goals: [goal],
			currentTime: Date.now(),
		};

		const plan = await planner.plan(goal, state);
		const schemeResult = kernel.execute("(+ 1 1)");

		expect(plan.success).toBe(true);
		expect(schemeResult).toBe(2);
	});
});
