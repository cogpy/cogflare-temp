/**
 * KSMEvolutionOrchestrator.ts
 * 
 * The autoresearch-style KSM evolution orchestrator for FlareCog.
 * 
 * Implements the 12-step Alexander structure-preserving transformation cycle
 * as a self-referential evolution loop that:
 * 
 * 1. OBSERVE — Collect loss metrics from all cognitive subsystems
 * 2. DISCOVER — Identify the weakest center (highest loss)
 * 3. DETECT — Classify the weakness via the 61-definition table
 * 4. THINK — Select repair strategy from the cognitive grammar
 * 5. MUTATE — Apply the strategy as a concrete transformation
 * 6. VERIFY — Run the subsystem and measure new loss
 * 7. KEEP/DISCARD — Keep mutation only if loss decreased
 * 8. CONSOLIDATE — Update the self-image (Autognosis)
 * 
 * The orchestrator persists its evolution history in KV for auditability,
 * and runs as part of the scheduled cognitive synergy cycle.
 * 
 * Composition: /flarecog ( /ksm-agent-pipeline-evolve )
 */

import {
  classifyWeakness,
  classifyWeakestAgent,
  classifyAllAgents,
  WeaknessClassification,
  RepairStrategy,
  AGENT_CELL_ANCHORS,
} from './KSMClassifyWeakness';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentLossMetric {
  agent: string;
  loss: number;          // [0, 1] — lower is better
  timestamp: number;
  details: Record<string, number>;  // sub-metrics
}

export interface KSMCycleResult {
  cycleNumber: number;
  timestamp: number;
  phase: 'observe' | 'discover' | 'detect' | 'think' | 'mutate' | 'verify' | 'consolidate';
  weakestAgent: string;
  classification: WeaknessClassification;
  preLoss: number;
  postLoss: number | null;
  delta: number | null;
  decision: 'keep' | 'discard' | 'pending';
  selfImage: AutognosisSelfImage;
}

export interface AutognosisSelfImage {
  /** Current loss metrics for all agents */
  agentLosses: Record<string, number>;
  /** Historical loss trajectory (last 20 cycles) */
  lossTrajectory: Array<{ cycle: number; losses: Record<string, number> }>;
  /** Current weakest center */
  weakestCenter: string;
  /** Overall system health [0, 1] — average of (1 - loss) across all agents */
  systemHealth: number;
  /** Number of completed KSM cycles */
  totalCycles: number;
  /** Number of successful mutations (kept) */
  successfulMutations: number;
  /** Current strategy in effect */
  activeStrategy: RepairStrategy | null;
  /** The 61-table classification of the current weakest center */
  currentClassification: WeaknessClassification | null;
}

// ---------------------------------------------------------------------------
// Loss metric collectors for each FlareCog subsystem
// ---------------------------------------------------------------------------

/**
 * Compute loss metrics for all FlareCog cognitive subsystems.
 * 
 * Each subsystem exposes observable quality signals that are normalized
 * to [0, 1] where 0 = perfect and 1 = completely broken.
 */
export interface SubsystemMetricCollector {
  collectAtomSpaceLoss(env: any): Promise<AgentLossMetric>;
  collectECANLoss(env: any): Promise<AgentLossMetric>;
  collectPLNLoss(env: any): Promise<AgentLossMetric>;
  collectMOSESLoss(env: any): Promise<AgentLossMetric>;
  collectCRDTLoss(env: any): Promise<AgentLossMetric>;
  collectGossipLoss(env: any): Promise<AgentLossMetric>;
  collectSynergyLoss(env: any): Promise<AgentLossMetric>;
  collectRelevanceLoss(env: any): Promise<AgentLossMetric>;
  collectAIOrchLoss(env: any): Promise<AgentLossMetric>;
  collectMindAgentLoss(env: any): Promise<AgentLossMetric>;
  collectQueueConsumerLoss(env: any): Promise<AgentLossMetric>;
  collectPlatformLoss(env: any): Promise<AgentLossMetric>;
}

/**
 * Default metric collector using KV-stored health signals
 */
export class DefaultMetricCollector implements SubsystemMetricCollector {
  private kvStore: any;

  constructor(kvStore: any) {
    this.kvStore = kvStore;
  }

  async collectAtomSpaceLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('atomspace');
    return {
      agent: 'atomspace',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectECANLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('ecan');
    return {
      agent: 'ecan',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectPLNLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('pln');
    return {
      agent: 'pln',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectMOSESLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('moses');
    return {
      agent: 'moses',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectCRDTLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('crdt-coordinator');
    return {
      agent: 'crdt-coordinator',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectGossipLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('gossip-transport');
    return {
      agent: 'gossip-transport',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectSynergyLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('cognitive-synergy');
    return {
      agent: 'cognitive-synergy',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectRelevanceLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('relevance-realization');
    return {
      agent: 'relevance-realization',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectAIOrchLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('ai-orchestrator');
    return {
      agent: 'ai-orchestrator',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectMindAgentLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('mind-agents');
    return {
      agent: 'mind-agents',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectQueueConsumerLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('queue-consumer');
    return {
      agent: 'queue-consumer',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  async collectPlatformLoss(env: any): Promise<AgentLossMetric> {
    const health = await this.getHealthMetric('multi-tenant-platform');
    return {
      agent: 'multi-tenant-platform',
      loss: 1 - health.overall,
      timestamp: Date.now(),
      details: health.details,
    };
  }

  private async getHealthMetric(agent: string): Promise<{ overall: number; details: Record<string, number> }> {
    const raw = await this.kvStore.get(`ksm:health:${agent}`);
    if (raw) {
      return JSON.parse(raw);
    }
    // Default: assume 50% health if no metric is stored yet
    return { overall: 0.5, details: { default: 0.5 } };
  }
}

// ---------------------------------------------------------------------------
// The KSM Evolution Orchestrator
// ---------------------------------------------------------------------------

export class KSMEvolutionOrchestrator {
  private kvStore: any;
  private metricCollector: SubsystemMetricCollector;
  private selfImage: AutognosisSelfImage;
  private cycleHistory: KSMCycleResult[] = [];

  constructor(kvStore: any, metricCollector?: SubsystemMetricCollector) {
    this.kvStore = kvStore;
    this.metricCollector = metricCollector || new DefaultMetricCollector(kvStore);
    this.selfImage = {
      agentLosses: {},
      lossTrajectory: [],
      weakestCenter: '',
      systemHealth: 0.5,
      totalCycles: 0,
      successfulMutations: 0,
      activeStrategy: null,
      currentClassification: null,
    };
  }

  /**
   * Run one complete KSM evolution cycle (the 12-step transformation)
   */
  async runCycle(env: any): Promise<KSMCycleResult> {
    // Load persisted state
    await this.loadState();

    // Step 1: OBSERVE — collect loss metrics from all subsystems
    const losses = await this.stepObserve(env);

    // Step 2: DISCOVER — identify the weakest center
    const weakest = this.stepDiscover(losses);

    // Step 3-4: DETECT + THINK — classify via 61-table and select strategy
    const classification = this.stepDetectAndThink(weakest.agent, weakest.loss);

    // Step 5: MUTATE — record the transformation intent
    // (In a live system, this would trigger actual code/config changes)
    const preLoss = weakest.loss;

    // Step 6: VERIFY — the next cycle will measure the post-mutation loss
    // For now, record the cycle result as pending
    const cycleResult: KSMCycleResult = {
      cycleNumber: this.selfImage.totalCycles + 1,
      timestamp: Date.now(),
      phase: 'consolidate',
      weakestAgent: weakest.agent,
      classification,
      preLoss,
      postLoss: null,
      delta: null,
      decision: 'pending',
      selfImage: { ...this.selfImage },
    };

    // Step 7: KEEP/DISCARD — check if previous cycle's mutation improved things
    await this.stepKeepDiscard(losses);

    // Step 8: CONSOLIDATE — update the self-image
    this.stepConsolidate(losses, classification);

    // Persist state
    await this.persistState(cycleResult);

    return cycleResult;
  }

  /**
   * Step 1: OBSERVE — Collect loss metrics from all cognitive subsystems
   */
  private async stepObserve(env: any): Promise<Record<string, number>> {
    const collectors = [
      this.metricCollector.collectAtomSpaceLoss(env),
      this.metricCollector.collectECANLoss(env),
      this.metricCollector.collectPLNLoss(env),
      this.metricCollector.collectMOSESLoss(env),
      this.metricCollector.collectCRDTLoss(env),
      this.metricCollector.collectGossipLoss(env),
      this.metricCollector.collectSynergyLoss(env),
      this.metricCollector.collectRelevanceLoss(env),
      this.metricCollector.collectAIOrchLoss(env),
      this.metricCollector.collectMindAgentLoss(env),
      this.metricCollector.collectQueueConsumerLoss(env),
      this.metricCollector.collectPlatformLoss(env),
    ];

    const metrics = await Promise.all(collectors);
    const losses: Record<string, number> = {};
    for (const m of metrics) {
      losses[m.agent] = m.loss;
    }
    return losses;
  }

  /**
   * Step 2: DISCOVER — Identify the weakest center (highest loss)
   */
  private stepDiscover(losses: Record<string, number>): { agent: string; loss: number } {
    let weakest = { agent: '', loss: -1 };
    for (const [agent, loss] of Object.entries(losses)) {
      if (loss > weakest.loss) {
        weakest = { agent, loss };
      }
    }
    return weakest;
  }

  /**
   * Steps 3-4: DETECT + THINK — Classify via 61-table and select strategy
   */
  private stepDetectAndThink(agentName: string, loss: number): WeaknessClassification {
    return classifyWeakness(agentName, loss);
  }

  /**
   * Step 7: KEEP/DISCARD — Check if the previous cycle's mutation improved things
   */
  private async stepKeepDiscard(currentLosses: Record<string, number>): Promise<void> {
    if (this.cycleHistory.length === 0) return;

    const lastCycle = this.cycleHistory[this.cycleHistory.length - 1];
    if (lastCycle.decision === 'pending') {
      const currentLoss = currentLosses[lastCycle.weakestAgent];
      if (currentLoss !== undefined) {
        lastCycle.postLoss = currentLoss;
        lastCycle.delta = lastCycle.preLoss - currentLoss;
        lastCycle.decision = lastCycle.delta > 0 ? 'keep' : 'discard';
        if (lastCycle.decision === 'keep') {
          this.selfImage.successfulMutations++;
        }
      }
    }
  }

  /**
   * Step 8: CONSOLIDATE — Update the Autognosis self-image
   */
  private stepConsolidate(
    losses: Record<string, number>,
    classification: WeaknessClassification
  ): void {
    this.selfImage.agentLosses = losses;
    this.selfImage.weakestCenter = classification.agent;
    this.selfImage.currentClassification = classification;
    this.selfImage.activeStrategy = classification.strategy;
    this.selfImage.totalCycles++;

    // Calculate system health as average of (1 - loss)
    const lossValues = Object.values(losses);
    this.selfImage.systemHealth = lossValues.length > 0
      ? lossValues.reduce((sum, l) => sum + (1 - l), 0) / lossValues.length
      : 0.5;

    // Update loss trajectory (keep last 20)
    this.selfImage.lossTrajectory.push({
      cycle: this.selfImage.totalCycles,
      losses: { ...losses },
    });
    if (this.selfImage.lossTrajectory.length > 20) {
      this.selfImage.lossTrajectory.shift();
    }
  }

  /**
   * Persist the orchestrator state to KV
   */
  private async persistState(cycleResult: KSMCycleResult): Promise<void> {
    this.cycleHistory.push(cycleResult);
    // Keep only last 50 cycles in memory
    if (this.cycleHistory.length > 50) {
      this.cycleHistory = this.cycleHistory.slice(-50);
    }

    await this.kvStore.put('ksm:self_image', JSON.stringify(this.selfImage));
    await this.kvStore.put('ksm:cycle_history', JSON.stringify(this.cycleHistory));
    await this.kvStore.put(
      `ksm:cycle:${cycleResult.cycleNumber}`,
      JSON.stringify(cycleResult),
      { expirationTtl: 86400 * 30 } // 30 days
    );
  }

  /**
   * Load persisted state from KV
   */
  private async loadState(): Promise<void> {
    const selfImageStr = await this.kvStore.get('ksm:self_image');
    if (selfImageStr) {
      this.selfImage = JSON.parse(selfImageStr);
    }
    const historyStr = await this.kvStore.get('ksm:cycle_history');
    if (historyStr) {
      this.cycleHistory = JSON.parse(historyStr);
    }
  }

  /**
   * Get the current Autognosis self-image
   */
  getSelfImage(): AutognosisSelfImage {
    return { ...this.selfImage };
  }

  /**
   * Get the full classification of all agents
   */
  getFullClassification(): WeaknessClassification[] {
    return classifyAllAgents(this.selfImage.agentLosses);
  }

  /**
   * Report a health metric for a subsystem (called by subsystems themselves)
   */
  async reportHealth(agent: string, overall: number, details: Record<string, number>): Promise<void> {
    await this.kvStore.put(
      `ksm:health:${agent}`,
      JSON.stringify({ overall, details })
    );
  }
}
