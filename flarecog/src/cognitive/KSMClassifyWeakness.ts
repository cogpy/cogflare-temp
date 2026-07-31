/**
 * KSMClassifyWeakness.ts
 * 
 * Classifies a FlareCog cognitive subsystem's weakness into a 61-table
 * coordinate cell and selects the appropriate repair strategy.
 * 
 * This replaces ad-hoc strategy selection ("if loss > 0.5 then X else Y")
 * with a principled mapping from the Universal Cognitive Grammar:
 * 
 * 1. Each agent is anchored to its identity cell (what it IS in the grammar)
 * 2. The loss band determines the organizational level of repair
 * 3. The linkage chain determines the traversal path for transformation
 * 4. The strategy is a concrete mutation action
 * 
 * Composition: /flarecog ( /ksm-agent-pipeline-evolve )
 */

import { CELLS, Composite, Organization } from './KSM61Table';

// ---------------------------------------------------------------------------
// Agent -> primary coordinate cell mapping
// Each FlareCog cognitive subsystem is anchored to the cell that best names
// what it IS in the grammar, not its pipeline position.
// ---------------------------------------------------------------------------
export const AGENT_CELL_ANCHORS: Record<string, { composite: Composite; organization: Organization }> = {
  // AtomSpace stores what exists in the cognitive field
  "atomspace":                { composite: "structure", organization: "existence" },     // 20
  // ECAN distinguishes important from unimportant (attention allocation)
  "ecan":                     { composite: "process",   organization: "distinction" },   // 28
  // PLN validates through conjunctive grounding (multiple criteria)
  "pln":                      { composite: "control",   organization: "conjunction" },   // 37
  // MOSES evolves programs through generational recursion
  "moses":                    { composite: "process",   organization: "recursion" },     // 33
  // CRDT Coordinator unifies distributed shards (spatial conjunction)
  "crdt-coordinator":         { composite: "space",     organization: "conjunction" },   // 44
  // Queue Gossip Transport propagates deltas (spatial transition)
  "gossip-transport":         { composite: "space",     organization: "transition" },    // 45
  // Cognitive Synergy Engine orchestrates temporal conjunction of subsystems
  "cognitive-synergy":        { composite: "time",      organization: "conjunction" },   // 51
  // Relevance Realization is the causal transition (relevance cascade)
  "relevance-realization":    { composite: "causality", organization: "transition" },    // 59
  // AI Orchestrator explores alternative model strategies (control disjunction)
  "ai-orchestrator":          { composite: "control",   organization: "disjunction" },   // 36
  // MindAgents execute sequential transitions in the process domain
  "mind-agents":              { composite: "process",   organization: "transition" },    // 31
  // Queue Consumer routes messages (structural transition)
  "queue-consumer":           { composite: "structure", organization: "transition" },    // 24
  // Multi-Tenant Platform is the spatial closure (tenant isolation boundary)
  "multi-tenant-platform":    { composite: "space",     organization: "closure" },       // 46
};

// ---------------------------------------------------------------------------
// Linkage chains — the three operative chains for FlareCog
// ---------------------------------------------------------------------------
export const LINKAGE_CHAINS: Record<string, number[]> = {
  // Local composites (structure, process, control) → experiment chain
  experiment:  [34, 35, 36, 37, 38, 39, 40],
  // Global space → federation chain
  federation:  [41, 42, 43, 44, 45, 46, 47],
  // Global time/causality → evolution chain
  evolution:   [55, 56, 57, 58, 59, 60, 61],
};

// ---------------------------------------------------------------------------
// Loss band → organization level mapping
// Higher loss = more fundamental failure = earlier repair in the sequence
// ---------------------------------------------------------------------------
export const LOSS_TO_ORGANIZATION: Array<{ threshold: number; organization: Organization }> = [
  { threshold: 0.85, organization: "existence" },     // nearly nothing works: re-establish the unit
  { threshold: 0.70, organization: "distinction" },   // outputs exist but are indistinguishable from noise
  { threshold: 0.55, organization: "disjunction" },   // alternatives are not being explored
  { threshold: 0.40, organization: "conjunction" },   // parts don't combine into quality artifacts
  { threshold: 0.25, organization: "transition" },    // staging/handoff logic is weak
  { threshold: 0.10, organization: "closure" },       // near-complete: seal and validate the unit
  { threshold: 0.00, organization: "recursion" },     // healthy: recurse to the next level
];

// ---------------------------------------------------------------------------
// Strategy semantics — concrete mutation actions per organization level
// ---------------------------------------------------------------------------
export type RepairStrategy =
  | 'rebuild_core_loop'
  | 'add_validation'
  | 'widen_search'
  | 'combine_criteria'
  | 'repair_handoff'
  | 'seal_and_validate'
  | 'fine_tune';

export const STRATEGY_FOR_ORGANIZATION: Record<Organization, RepairStrategy> = {
  existence:   'rebuild_core_loop',
  distinction: 'add_validation',
  disjunction: 'widen_search',
  conjunction: 'combine_criteria',
  transition:  'repair_handoff',
  closure:     'seal_and_validate',
  recursion:   'fine_tune',
};

export const STRATEGY_ACTIONS: Record<RepairStrategy, string> = {
  rebuild_core_loop: "Re-establish the subsystem's minimal working unit (main loop produces at least one valid artifact).",
  add_validation:    "Add schema/quality validation separating signal from noise in the subsystem's outputs.",
  widen_search:      "Introduce an alternative heuristic branch and compare against the incumbent.",
  combine_criteria:  "Fuse multiple quality signals into the loss computation or artifact assembly.",
  repair_handoff:    "Fix staging/sequencing logic at the subsystem's upstream/downstream boundaries (Queue/DO).",
  seal_and_validate: "Finalize outputs: schema-validate, close the artifact set, register completion.",
  fine_tune:         "Incremental parameter/threshold optimization; keep only if metric gain justifies complexity.",
};

// ---------------------------------------------------------------------------
// Classification result interface
// ---------------------------------------------------------------------------
export interface WeaknessClassification {
  agent: string;
  loss: number;
  anchor_cell: {
    composite: Composite;
    organization: Organization;
    definition_id: number;
    operator: string;
    instantiation: string;
  };
  repair_cell: {
    composite: Composite;
    organization: Organization;
    definition_id: number;
    operator: string;
    instantiation: string;
  };
  linkage_chain: string;
  chain_definition_ids: number[];
  strategy: RepairStrategy;
  strategy_action: string;
}

// ---------------------------------------------------------------------------
// Main classification function
// ---------------------------------------------------------------------------

/**
 * Classify a FlareCog cognitive subsystem's weakness into a 61-table coordinate.
 * 
 * Returns the agent's anchor cell plus the repair cell implied by its loss
 * band, along with the linkage chain to traverse and the concrete strategy.
 * 
 * @param agentName - The name of the cognitive subsystem (must be a key in AGENT_CELL_ANCHORS)
 * @param loss - The subsystem's loss metric in [0, 1] (lower is better)
 */
export function classifyWeakness(agentName: string, loss: number): WeaknessClassification {
  // Get the agent's anchor cell
  const anchor = AGENT_CELL_ANCHORS[agentName] || { composite: 'causality' as Composite, organization: 'distinction' as Organization };
  const anchorCell = CELLS[anchor.composite][anchor.organization];

  // Determine repair organization from loss band
  let repairOrg: Organization = 'recursion';
  for (const { threshold, organization } of LOSS_TO_ORGANIZATION) {
    if (loss >= threshold) {
      repairOrg = organization;
      break;
    }
  }
  const repairCell = CELLS[anchor.composite][repairOrg];

  // Choose linkage chain based on composite domain
  let chain: string;
  if (anchor.composite === 'structure' || anchor.composite === 'process' || anchor.composite === 'control') {
    chain = 'experiment';
  } else if (anchor.composite === 'space') {
    chain = 'federation';
  } else {
    chain = 'evolution';
  }

  // Get the strategy for the repair organization
  const strategy = STRATEGY_FOR_ORGANIZATION[repairOrg];

  return {
    agent: agentName,
    loss,
    anchor_cell: {
      composite: anchor.composite,
      organization: anchor.organization,
      definition_id: anchorCell.id,
      operator: anchorCell.operator,
      instantiation: anchorCell.instantiation,
    },
    repair_cell: {
      composite: anchor.composite,
      organization: repairOrg,
      definition_id: repairCell.id,
      operator: repairCell.operator,
      instantiation: repairCell.instantiation,
    },
    linkage_chain: chain,
    chain_definition_ids: LINKAGE_CHAINS[chain],
    strategy,
    strategy_action: STRATEGY_ACTIONS[strategy],
  };
}

/**
 * Classify all agents and return sorted by loss (weakest first)
 */
export function classifyAllAgents(
  agentLosses: Record<string, number>
): WeaknessClassification[] {
  return Object.entries(agentLosses)
    .map(([agent, loss]) => classifyWeakness(agent, loss))
    .sort((a, b) => b.loss - a.loss);
}

/**
 * Get the weakest agent classification
 */
export function classifyWeakestAgent(
  agentLosses: Record<string, number>
): WeaknessClassification {
  const all = classifyAllAgents(agentLosses);
  return all[0];
}
