/**
 * VersionManifest.ts
 * 
 * Self-image embedding and version manifest system for FlareCog's
 * iterative micro-improvement loop.
 * 
 * Adapted from the WebContainer/bolt.new pattern:
 * - Instead of file-tree snapshots, we capture cognitive architecture state
 * - Instead of WebContainer mounting, we persist to KV/R2
 * - Instead of npm dependencies, we track Cloudflare bindings and DO health
 * 
 * The "self-image" is the system's representation of its own architecture:
 * module inventory, health metrics, integration completeness, and config state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionEntry {
  version: number;
  timestamp: number;
  status: 'baseline' | 'candidate' | 'accepted' | 'rejected' | 'rollback';
  snapshot: CognitiveSnapshot;
  proposal: ImprovementProposal | null;
  evaluation: EvaluationResult | null;
  parentVersion: number | null;
}

export interface CognitiveSnapshot {
  /** Module inventory with health metrics */
  modules: ModuleState[];
  /** Cloudflare binding configuration state */
  bindings: BindingState[];
  /** Integration completeness scores per subsystem */
  integrationScores: Record<string, number>;
  /** Active configuration parameters */
  configParams: Record<string, any>;
  /** KSM self-image at time of snapshot */
  ksmSelfImage: any;
  /** Total lines of cognitive code */
  totalCognitiveLines: number;
  /** Checksum of all cognitive module content */
  contentHash: string;
}

export interface ModuleState {
  path: string;
  name: string;
  subsystem: string;
  lines: number;
  completeness: number;   // [0, 1]
  health: number;         // [0, 1] from KSM metrics
  dependencies: string[]; // other modules this depends on
  exports: string[];      // public API surface
  lastModified: number;
}

export interface BindingState {
  name: string;
  type: 'kv' | 'r2' | 'queue' | 'do' | 'ai' | 'd1' | 'vectorize';
  configured: boolean;
  provisioned: boolean;
}

export interface ImprovementProposal {
  id: string;
  dimension: IntrospectionDimension;
  target: string;           // module path or subsystem name
  description: string;
  rationale: string;
  expectedImpact: number;   // [0, 1] estimated improvement
  complexity: 'trivial' | 'minor' | 'moderate' | 'major';
  reversible: boolean;
  mutations: ProposedMutation[];
}

export type IntrospectionDimension =
  | 'integration_completeness'  // Missing wiring between subsystems
  | 'error_resilience'          // Missing error boundaries, retry logic
  | 'type_safety'               // Type gaps, any casts, missing interfaces
  | 'performance'               // Unnecessary allocations, missing caching
  | 'cognitive_coherence'       // Subsystems not properly synergizing
  | 'observability'             // Missing health reporting, logging

export interface ProposedMutation {
  file: string;
  type: 'insert' | 'replace' | 'delete' | 'create';
  location?: { startLine: number; endLine: number };
  content: string;
  description: string;
}

export interface EvaluationResult {
  typeCheckPassed: boolean;
  integrationScore: number;     // [0, 1] overall integration completeness
  coherenceScore: number;       // [0, 1] cognitive synergy coherence
  complexityDelta: number;      // change in cyclomatic complexity
  aiAssessment: {
    score: number;              // [-5, +5] net improvement assessment
    reasoning: string;
    risks: string[];
    benefits: string[];
  };
  decision: 'keep' | 'discard' | 'retry';
}

// ---------------------------------------------------------------------------
// Version Manifest Manager
// ---------------------------------------------------------------------------

export class VersionManifest {
  private kvStore: KVNamespace;
  private manifest: VersionEntry[] = [];
  private currentVersion: number = 0;

  constructor(kvStore: KVNamespace) {
    this.kvStore = kvStore;
  }

  /**
   * Initialize the manifest, loading from KV or creating v0 baseline
   */
  async initialize(): Promise<void> {
    const stored = await this.kvStore.get('imi:manifest');
    if (stored) {
      this.manifest = JSON.parse(stored);
      this.currentVersion = this.manifest.length > 0
        ? Math.max(...this.manifest.map(e => e.version))
        : 0;
    }
  }

  /**
   * Capture the current cognitive architecture state as a snapshot
   */
  async captureSnapshot(env: any): Promise<CognitiveSnapshot> {
    const modules = await this.inventoryModules(env);
    const bindings = this.inventoryBindings(env);
    const integrationScores = await this.computeIntegrationScores(env);
    const configParams = await this.captureConfig(env);
    const ksmSelfImage = await this.getKSMSelfImage(env);

    return {
      modules,
      bindings,
      integrationScores,
      configParams,
      ksmSelfImage,
      totalCognitiveLines: modules.reduce((sum, m) => sum + m.lines, 0),
      contentHash: this.computeHash(modules),
    };
  }

  /**
   * Register a new version entry
   */
  async registerVersion(entry: Omit<VersionEntry, 'version'>): Promise<VersionEntry> {
    const version = this.currentVersion + 1;
    const fullEntry: VersionEntry = { ...entry, version };
    this.manifest.push(fullEntry);
    this.currentVersion = version;
    await this.persist();
    return fullEntry;
  }

  /**
   * Update the status of a version
   */
  async updateStatus(version: number, status: VersionEntry['status'], evaluation?: EvaluationResult): Promise<void> {
    const entry = this.manifest.find(e => e.version === version);
    if (entry) {
      entry.status = status;
      if (evaluation) entry.evaluation = evaluation;
      await this.persist();
    }
  }

  /**
   * Get the current (latest accepted) version
   */
  getCurrentVersion(): VersionEntry | null {
    // Find the latest accepted version, or the baseline
    const accepted = this.manifest
      .filter(e => e.status === 'accepted' || e.status === 'baseline')
      .sort((a, b) => b.version - a.version);
    return accepted[0] || null;
  }

  /**
   * Get the full manifest history
   */
  getHistory(): VersionEntry[] {
    return [...this.manifest];
  }

  /**
   * Get evolution statistics
   */
  getStats(): {
    totalVersions: number;
    accepted: number;
    rejected: number;
    successRate: number;
    avgImpact: number;
  } {
    const evaluated = this.manifest.filter(e => e.evaluation);
    const accepted = evaluated.filter(e => e.status === 'accepted');
    const rejected = evaluated.filter(e => e.status === 'rejected');
    
    return {
      totalVersions: this.manifest.length,
      accepted: accepted.length,
      rejected: rejected.length,
      successRate: evaluated.length > 0 ? accepted.length / evaluated.length : 0,
      avgImpact: accepted.length > 0
        ? accepted.reduce((sum, e) => sum + (e.evaluation?.aiAssessment.score || 0), 0) / accepted.length
        : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async persist(): Promise<void> {
    await this.kvStore.put('imi:manifest', JSON.stringify(this.manifest));
    // Also persist a compact version for quick access
    await this.kvStore.put('imi:current_version', String(this.currentVersion));
    await this.kvStore.put('imi:stats', JSON.stringify(this.getStats()));
  }

  private async inventoryModules(env: any): Promise<ModuleState[]> {
    // FlareCog module registry — the cognitive architecture's self-knowledge
    const moduleRegistry: ModuleState[] = [
      { path: 'src/durable-objects/AtomSpace.ts', name: 'AtomSpace', subsystem: 'atomspace', lines: 450, completeness: 0.85, health: 0.5, dependencies: [], exports: ['AtomSpace'], lastModified: Date.now() },
      { path: 'src/durable-objects/MindAgent.ts', name: 'MindAgent', subsystem: 'mind-agents', lines: 380, completeness: 0.80, health: 0.5, dependencies: ['AtomSpace'], exports: ['MindAgent'], lastModified: Date.now() },
      { path: 'src/durable-objects/CRDTAtomSpaceCoordinator.ts', name: 'CRDTAtomSpaceCoordinator', subsystem: 'crdt-coordinator', lines: 320, completeness: 0.70, health: 0.5, dependencies: ['AtomSpace'], exports: ['CRDTAtomSpaceCoordinator'], lastModified: Date.now() },
      { path: 'src/cognitive/ECANFullImplementation.ts', name: 'ECANFull', subsystem: 'ecan', lines: 480, completeness: 0.75, health: 0.5, dependencies: ['AtomSpace'], exports: ['ECANFullImplementation'], lastModified: Date.now() },
      { path: 'src/cognitive/PLNGroundedReasoning.ts', name: 'PLNGrounded', subsystem: 'pln', lines: 380, completeness: 0.70, health: 0.5, dependencies: ['AtomSpace', 'CloudFlareAIOrchestrator'], exports: ['PLNGroundedReasoning'], lastModified: Date.now() },
      { path: 'src/cognitive/MOSESEvolution.ts', name: 'MOSESEvolution', subsystem: 'moses', lines: 490, completeness: 0.70, health: 0.5, dependencies: ['AtomSpace'], exports: ['MOSESEvolution'], lastModified: Date.now() },
      { path: 'src/cognitive/CloudFlareAIOrchestrator.ts', name: 'AIOrchestrator', subsystem: 'ai-orchestrator', lines: 670, completeness: 0.65, health: 0.5, dependencies: ['AtomSpace'], exports: ['CloudFlareAIOrchestrator'], lastModified: Date.now() },
      { path: 'src/cognitive/RelevanceRealizationEngine.ts', name: 'RelevanceRealization', subsystem: 'relevance-realization', lines: 540, completeness: 0.60, health: 0.5, dependencies: ['AtomSpace', 'CloudFlareAIOrchestrator'], exports: ['RelevanceRealizationEngine'], lastModified: Date.now() },
      { path: 'src/cognitive/CognitiveSynergyEngine.ts', name: 'CognitiveSynergy', subsystem: 'cognitive-synergy', lines: 420, completeness: 0.60, health: 0.5, dependencies: ['AtomSpace', 'ECANFull', 'PLNGrounded', 'MOSESEvolution'], exports: ['CognitiveSynergyEngine'], lastModified: Date.now() },
      { path: 'src/cognitive/KSMEvolutionOrchestrator.ts', name: 'KSMEvolution', subsystem: 'ksm', lines: 310, completeness: 0.80, health: 0.5, dependencies: ['KSMClassifyWeakness', 'KSM61Table'], exports: ['KSMEvolutionOrchestrator'], lastModified: Date.now() },
      { path: 'src/core/distributed/QueueGossipTransport.ts', name: 'QueueGossip', subsystem: 'gossip-transport', lines: 320, completeness: 0.80, health: 0.5, dependencies: ['CRDTAtomSpaceCoordinator'], exports: ['QueueGossipTransport'], lastModified: Date.now() },
      { path: 'src/core/distributed/CRDTAtomSpace.ts', name: 'CRDTAtomSpace', subsystem: 'crdt-coordinator', lines: 350, completeness: 0.75, health: 0.5, dependencies: [], exports: ['CRDTAtomSpace'], lastModified: Date.now() },
      { path: 'src/handlers/QueueConsumer.ts', name: 'QueueConsumer', subsystem: 'queue-consumer', lines: 230, completeness: 0.80, health: 0.5, dependencies: ['MOSESEvolution', 'PLNGrounded', 'ECANFull'], exports: ['handleQueueBatch'], lastModified: Date.now() },
    ];

    // Enrich with KSM health metrics if available
    for (const mod of moduleRegistry) {
      const healthStr = await this.kvStore.get(`ksm:health:${mod.subsystem}`);
      if (healthStr) {
        const health = JSON.parse(healthStr);
        mod.health = health.overall;
      }
    }

    return moduleRegistry;
  }

  private inventoryBindings(env: any): BindingState[] {
    return [
      { name: 'ATOMSPACE', type: 'do', configured: true, provisioned: !!env?.ATOMSPACE },
      { name: 'MIND_AGENT', type: 'do', configured: true, provisioned: !!env?.MIND_AGENT },
      { name: 'CRDT_ATOMSPACE_COORDINATOR', type: 'do', configured: true, provisioned: !!env?.CRDT_ATOMSPACE_COORDINATOR },
      { name: 'STORAGE_METADATA', type: 'kv', configured: true, provisioned: !!env?.STORAGE_METADATA },
      { name: 'TASK_RESULTS', type: 'kv', configured: true, provisioned: !!env?.TASK_RESULTS },
      { name: 'KV_WARM_STORAGE', type: 'kv', configured: true, provisioned: !!env?.KV_WARM_STORAGE },
      { name: 'R2_COLD_STORAGE', type: 'r2', configured: true, provisioned: !!env?.R2_COLD_STORAGE },
      { name: 'COGNITIVE_QUEUE', type: 'queue', configured: true, provisioned: !!env?.COGNITIVE_QUEUE },
      { name: 'INFERENCE_QUEUE', type: 'queue', configured: true, provisioned: !!env?.INFERENCE_QUEUE },
      { name: 'CONSOLIDATION_QUEUE', type: 'queue', configured: true, provisioned: !!env?.CONSOLIDATION_QUEUE },
      { name: 'COORDINATION_QUEUE', type: 'queue', configured: true, provisioned: !!env?.COORDINATION_QUEUE },
      { name: 'AI', type: 'ai', configured: true, provisioned: !!env?.AI },
      { name: 'VECTORIZE_INDEX', type: 'vectorize', configured: false, provisioned: false },
      { name: 'D1_COORDINATION', type: 'd1', configured: false, provisioned: false },
    ];
  }

  private async computeIntegrationScores(env: any): Promise<Record<string, number>> {
    // Integration scores measure how well subsystems are wired together
    return {
      'atomspace-ecan': 0.70,         // ECAN reads/writes AtomSpace STI values
      'atomspace-pln': 0.65,          // PLN queries AtomSpace for premises
      'atomspace-moses': 0.60,        // MOSES stores evolved programs in AtomSpace
      'ecan-pln': 0.50,              // PLN should focus on high-STI atoms
      'ecan-moses': 0.40,            // MOSES fitness should consider attention
      'pln-ai-orchestrator': 0.65,   // PLN validates AI outputs
      'crdt-gossip': 0.75,           // Gossip transport wired to CRDT coordinator
      'synergy-all': 0.55,           // Synergy engine orchestrates all subsystems
      'ksm-all': 0.70,              // KSM monitors all subsystem health
      'relevance-synergy': 0.45,     // Relevance should guide synergy priorities
      'queue-subsystems': 0.75,      // Queue consumer routes to all subsystems
    };
  }

  private async captureConfig(env: any): Promise<Record<string, any>> {
    return {
      cronSchedule: '*/5 * * * *',
      ecanRentRate: 0.01,
      ecanWageRate: 0.05,
      plnConfidenceThreshold: 0.6,
      mosesPopulationSize: 50,
      mosesMaxGenerations: 100,
      gossipInterval: 30000,
      tierMigrationThresholds: { hot: 80, warm: 40, cold: 0 },
      ksmEnabled: true,
      imiEnabled: true,
    };
  }

  private async getKSMSelfImage(env: any): Promise<any> {
    const selfImageStr = await this.kvStore.get('ksm:self_image');
    return selfImageStr ? JSON.parse(selfImageStr) : null;
  }

  private computeHash(modules: ModuleState[]): string {
    // Simple hash based on module paths and line counts
    const content = modules.map(m => `${m.path}:${m.lines}:${m.completeness}`).join('|');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
