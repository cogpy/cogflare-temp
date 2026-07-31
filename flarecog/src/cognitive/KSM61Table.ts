/**
 * KSM61Table.ts
 * 
 * The 61-Definition Periodic Table for the FlareCog Cognitive Architecture.
 * 
 * Machine-readable instantiation of Winiwarter's Periodic System of System
 * Concepts, applied self-referentially to the FlareCog domain via:
 * 
 *     /flarecog ( /ksm-agent-pipeline-evolve )
 * 
 * The table serves as the Autognosis self-image vocabulary: the KSM evolver
 * traverses this 61-node graph to (a) classify the weakest cognitive subsystem
 * into a coordinate cell, and (b) select the linkage-chain transformation
 * that strengthens it.
 */

export type Direction = 'local' | 'global';
export type Dimension = 'spatiality' | 'temporality' | 'causality';
export type Organization = 'existence' | 'distinction' | 'disjunction' | 'conjunction' | 'transition' | 'closure' | 'recursion';
export type Composite = 'structure' | 'process' | 'control' | 'space' | 'time' | 'causality';

export interface Definition {
  id: number;
  level: 'generator' | 'composite' | 'cell';
  name?: string;
  composite?: Composite;
  organization?: Organization;
  operator?: string;
  instantiation: string;
}

// ---------------------------------------------------------------------------
// The 13 Primary Categories (Generators): definitions 1-13
// ---------------------------------------------------------------------------
export const GENERATORS: Record<number, { name: string; instantiation: string }> = {
  1: { name: "autognosis", instantiation: "The Relevance Realization Engine — FlareCog's capacity to build a self-image by computing Optimal Grip" },
  2: { name: "local", instantiation: "The reductionist perspective: individual Durable Objects, single atoms, local ECAN attention values" },
  3: { name: "global", instantiation: "The holistic perspective: the entire Cloudflare edge network as a unified cognitive substrate" },
  4: { name: "spatiality", instantiation: "The topology and architecture of FlareCog: the hypergraph structure of AtomSpace" },
  5: { name: "temporality", instantiation: "The dynamics and change over time: the cognitive synergy cycle, ECAN rent/wage cycles" },
  6: { name: "causality", instantiation: "The regulation and rules governing FlareCog: PLN probabilistic logic, ECAN economic laws" },
  7: { name: "existence", instantiation: "The Atom — the elementary unit of cognitive representation" },
  8: { name: "distinction", instantiation: "The Node/Link duality — the binary complementary division of AtomSpace" },
  9: { name: "disjunction", instantiation: "Unconnected multiplicity: multiple independent AtomSpace shards across DOs" },
  10: { name: "conjunction", instantiation: "Dense coupling and union: Hebbian links binding co-attended atoms" },
  11: { name: "transition", instantiation: "Sequential branching and containment: the tier migration path (Hot→Warm→Cold)" },
  12: { name: "closure", instantiation: "The boundary establishing a closed unit: the Durable Object as an encapsulated AtomSpace shard" },
  13: { name: "recursion", instantiation: "Self-similar repetition driving level transition: the KSM evolution cycle applied to FlareCog itself" },
};

// ---------------------------------------------------------------------------
// The 6 Composites: definitions 14-19
// ---------------------------------------------------------------------------
export const COMPOSITES: Record<number, { name: Composite; instantiation: string }> = {
  14: { name: "structure", instantiation: "The internal architecture of individual components: the TypeScript class hierarchy" },
  15: { name: "process", instantiation: "The kinematics of individual operations: a single ECAN attention spreading step" },
  16: { name: "control", instantiation: "The regulation of individual parts: TruthValue confidence thresholds for PLN acceptance" },
  17: { name: "space", instantiation: "The topology of the whole distributed system: the Cloudflare edge network as a cognitive field" },
  18: { name: "time", instantiation: "The dynamics of the whole system: the global cognitive synergy cycle running on cron" },
  19: { name: "causality", instantiation: "The laws governing the whole system: the CAP theorem, the ECAN conservation law" },
};

// ---------------------------------------------------------------------------
// The 42 Coordinate Cells: definitions 20-61
// ---------------------------------------------------------------------------
export const CELLS: Record<Composite, Record<Organization, { id: number; operator: string; instantiation: string }>> = {
  structure: {
    existence:   { id: 20, operator: "∃", instantiation: "The Atom Record — A single typed node or link stored as a JSON object" },
    distinction: { id: 21, operator: "¬", instantiation: "Node vs. Link — The binary structural distinction" },
    disjunction: { id: 22, operator: "∨", instantiation: "Disconnected Subgraphs — Multiple atoms within a single DO that share no links" },
    conjunction: { id: 23, operator: "∧", instantiation: "The Hebbian Link — A structural coupling between two co-attended atoms" },
    transition:  { id: 24, operator: "→", instantiation: "The Tier Migration Path — The sequential structural containment (Hot→Warm→Cold)" },
    closure:     { id: 25, operator: "↔", instantiation: "The Durable Object Boundary — The encapsulation boundary of a single AtomSpace shard" },
    recursion:   { id: 26, operator: "∀", instantiation: "Atoms Containing Atoms — Links whose outgoing sets contain other links" },
  },
  process: {
    existence:   { id: 27, operator: "∃", instantiation: "The Atom Insertion — The act of creating a single atom in the AtomSpace" },
    distinction: { id: 28, operator: "¬", instantiation: "Stimulate vs. Decay — The binary process distinction for STI" },
    disjunction: { id: 29, operator: "∨", instantiation: "Parallel Queue Messages — Multiple independent process events executing concurrently" },
    conjunction: { id: 30, operator: "∧", instantiation: "The Cognitive Synergy Step — The conjunction of ECAN + PLN + MOSES" },
    transition:  { id: 31, operator: "→", instantiation: "The Inference Chain — A sequential PLN deduction" },
    closure:     { id: 32, operator: "↔", instantiation: "The ECAN Cycle Completion — A full rent→wage→spread cycle returning to equilibrium" },
    recursion:   { id: 33, operator: "∀", instantiation: "MOSES Programs Generating Programs — Evolutionary recursion" },
  },
  control: {
    existence:   { id: 34, operator: "∃", instantiation: "The TruthValue — The { strength, confidence } pair governing belief" },
    distinction: { id: 35, operator: "¬", instantiation: "Accept vs. Reject — The binary control distinction for PLN inference" },
    disjunction: { id: 36, operator: "∨", instantiation: "Independent Rules — Multiple unrelated control rules active simultaneously" },
    conjunction: { id: 37, operator: "∧", instantiation: "The Grounding Validation — PLN confidence AND AtomSpace match AND embedding similarity" },
    transition:  { id: 38, operator: "→", instantiation: "The Retry Escalation — Control transitions from normal processing → retry → DLQ" },
    closure:     { id: 39, operator: "↔", instantiation: "The CRDT Convergence — The point at which all peers have exchanged all deltas" },
    recursion:   { id: 40, operator: "∀", instantiation: "The KSM Self-Application — FlareCog applying its own cognitive grammar to evolve itself" },
  },
  space: {
    existence:   { id: 41, operator: "∈", instantiation: "The Edge Location — A single Cloudflare PoP where a DO instance is placed" },
    distinction: { id: 42, operator: "∉", instantiation: "Shard vs. Federation — The global spatial distinction" },
    disjunction: { id: 43, operator: "∩", instantiation: "Network Partitions — Disconnected islands that evolve independently" },
    conjunction: { id: 44, operator: "∪", instantiation: "The Federated AtomSpace — The CRDT merge of all DO shards into a single hypergraph" },
    transition:  { id: 45, operator: "⊂", instantiation: "The Gossip Propagation Path — A delta propagating through the peer graph" },
    closure:     { id: 46, operator: "⊆", instantiation: "The Tenant Isolation Boundary — Each tenant's AtomSpace namespace is a closed subset" },
    recursion:   { id: 47, operator: "∅", instantiation: "Workers for Platforms — The platform spawning tenant-specific Workers" },
  },
  time: {
    existence:   { id: 48, operator: "∈", instantiation: "The Cron Tick — A single scheduled invocation triggering the synergy cycle" },
    distinction: { id: 49, operator: "∉", instantiation: "Convergence vs. Divergence — The global temporal distinction" },
    disjunction: { id: 50, operator: "∩", instantiation: "Asynchronous Queues — Messages in different Queues proceeding at independent rates" },
    conjunction: { id: 51, operator: "∪", instantiation: "The Global Attention Equilibrium — When all ECAN cycles have balanced rent and wages" },
    transition:  { id: 52, operator: "⊂", instantiation: "The Evolutionary Epoch — MOSES populations transitioning from one generation to the next" },
    closure:     { id: 53, operator: "⊆", instantiation: "The Consolidation Epoch — The periodic phase where low-STI atoms migrate to cold storage" },
    recursion:   { id: 54, operator: "∅", instantiation: "The KSM Hypercycle — Each KSM evolution cycle enabling the next cycle at a higher level" },
  },
  causality: {
    existence:   { id: 55, operator: "∈", instantiation: "The CAP Constraint — In a distributed system, you cannot guarantee C, A, and P simultaneously" },
    distinction: { id: 56, operator: "∉", instantiation: "Eventual vs. Strong Consistency — CRDT guarantees eventual consistency but NOT strong" },
    disjunction: { id: 57, operator: "∩", instantiation: "Independent Fitness Landscapes — Different MOSES populations evolving under different functions" },
    conjunction: { id: 58, operator: "∪", instantiation: "The Cognitive Synergy Law — ECAN + PLN + MOSES must all cooperate for emergent intelligence" },
    transition:  { id: 59, operator: "⊂", instantiation: "The Relevance Cascade — A change in Optimal Grip parameters cascading through the system" },
    closure:     { id: 60, operator: "⊆", instantiation: "The Platform Invariant — The DO export rule as a system-wide invariant" },
    recursion:   { id: 61, operator: "∅", instantiation: "The Autognosis Fixed Point — FlareCog using its Relevance Realization Engine to evaluate itself" },
  },
};
