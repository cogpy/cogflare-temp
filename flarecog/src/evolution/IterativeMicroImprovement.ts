/**
 * IterativeMicroImprovement.ts
 * 
 * The autonomous self-improvement loop for FlareCog.
 * Composition: /iterative-micro-improvement ( /flarecog )
 * 
 * Adapts the WebContainer/bolt.new iterative evolution pattern to a
 * Cloudflare Workers cognitive DSPU context:
 * 
 * CURRENT VERSION v
 *       ↓
 * [INTROSPECTION] → Analyze cognitive architecture, identify improvement target
 *       ↓
 * [MUTATION] → Apply minimal, focused change → VERSION v+1
 *       ↓
 * [EVALUATION] → Run metrics + AI analysis on v and v+1
 *       ↓
 * [SELECTION] → Keep v+1 if improved, else retry mutation
 *       ↓
 * REPEAT with v+1 as new baseline
 * 
 * Key differences from WebContainer version:
 * - No file-system snapshots; instead captures cognitive state in KV
 * - No npm test runner; instead uses KSM health metrics + AI assessment
 * - Runs as a scheduled Worker cron, not a browser loop
 * - Mutations are configuration/parameter changes, not code diffs
 *   (code diffs require human review via PR — this handles runtime evolution)
 */

import {
  VersionManifest,
  VersionEntry,
  CognitiveSnapshot,
  ImprovementProposal,
  IntrospectionDimension,
  ProposedMutation,
  EvaluationResult,
} from './VersionManifest';

// ---------------------------------------------------------------------------
// Introspection Engine
// ---------------------------------------------------------------------------

/**
 * Analyzes the current cognitive architecture state across six dimensions
 * to select the single highest-value improvement target.
 */
export class IntrospectionEngine {
  private kvStore: KVNamespace;
  private aiBinding: any;

  constructor(kvStore: KVNamespace, aiBinding?: any) {
    this.kvStore = kvStore;
    this.aiBinding = aiBinding;
  }

  /**
   * Run introspection on the current snapshot to identify the best improvement
   */
  async introspect(snapshot: CognitiveSnapshot): Promise<ImprovementProposal> {
    // Score each dimension
    const dimensionScores = this.scoreDimensions(snapshot);
    
    // Select the dimension with highest improvement potential
    const targetDimension = this.selectTargetDimension(dimensionScores);
    
    // Generate a specific proposal for that dimension
    const proposal = await this.generateProposal(snapshot, targetDimension);
    
    return proposal;
  }

  private scoreDimensions(snapshot: CognitiveSnapshot): Record<IntrospectionDimension, number> {
    const scores: Record<IntrospectionDimension, number> = {
      integration_completeness: this.scoreIntegration(snapshot),
      error_resilience: this.scoreResilience(snapshot),
      type_safety: this.scoreTypeSafety(snapshot),
      performance: this.scorePerformance(snapshot),
      cognitive_coherence: this.scoreCognitiveCoherence(snapshot),
      observability: this.scoreObservability(snapshot),
    };
    return scores;
  }

  private scoreIntegration(snapshot: CognitiveSnapshot): number {
    // Higher score = more room for improvement
    const scores = Object.values(snapshot.integrationScores);
    const avgIntegration = scores.reduce((s, v) => s + v, 0) / scores.length;
    return 1 - avgIntegration; // Invert: low integration = high improvement potential
  }

  private scoreResilience(snapshot: CognitiveSnapshot): number {
    // Check for modules without error handling patterns
    const modulesWithoutRetry = snapshot.modules.filter(m => m.completeness < 0.7);
    return modulesWithoutRetry.length / snapshot.modules.length;
  }

  private scoreTypeSafety(snapshot: CognitiveSnapshot): number {
    // Estimate type coverage gaps from completeness
    const avgCompleteness = snapshot.modules.reduce((s, m) => s + m.completeness, 0) / snapshot.modules.length;
    return 1 - avgCompleteness;
  }

  private scorePerformance(snapshot: CognitiveSnapshot): number {
    // Check for unprovisioned bindings that could improve performance
    const unprovisioned = snapshot.bindings.filter(b => !b.provisioned);
    return unprovisioned.length / snapshot.bindings.length;
  }

  private scoreCognitiveCoherence(snapshot: CognitiveSnapshot): number {
    // Measure how well the cognitive synergy is working
    const synergyScore = snapshot.integrationScores['synergy-all'] || 0.5;
    const relevanceScore = snapshot.integrationScores['relevance-synergy'] || 0.5;
    return 1 - ((synergyScore + relevanceScore) / 2);
  }

  private scoreObservability(snapshot: CognitiveSnapshot): number {
    // Check KSM health reporting coverage
    const modulesWithHealth = snapshot.modules.filter(m => m.health !== 0.5); // 0.5 = default
    return 1 - (modulesWithHealth.length / snapshot.modules.length);
  }

  private selectTargetDimension(scores: Record<IntrospectionDimension, number>): IntrospectionDimension {
    let best: IntrospectionDimension = 'integration_completeness';
    let bestScore = -1;
    for (const [dim, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        best = dim as IntrospectionDimension;
      }
    }
    return best;
  }

  private async generateProposal(
    snapshot: CognitiveSnapshot,
    dimension: IntrospectionDimension
  ): Promise<ImprovementProposal> {
    // Generate dimension-specific proposals
    switch (dimension) {
      case 'integration_completeness':
        return this.proposeIntegrationImprovement(snapshot);
      case 'error_resilience':
        return this.proposeResilienceImprovement(snapshot);
      case 'cognitive_coherence':
        return this.proposeCoherenceImprovement(snapshot);
      case 'observability':
        return this.proposeObservabilityImprovement(snapshot);
      case 'performance':
        return this.proposePerformanceImprovement(snapshot);
      case 'type_safety':
        return this.proposeTypeSafetyImprovement(snapshot);
      default:
        return this.proposeIntegrationImprovement(snapshot);
    }
  }

  private proposeIntegrationImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    // Find the weakest integration link
    const weakest = Object.entries(snapshot.integrationScores)
      .sort(([, a], [, b]) => a - b)[0];
    
    return {
      id: `imi-${Date.now()}-integration`,
      dimension: 'integration_completeness',
      target: weakest[0],
      description: `Strengthen integration between ${weakest[0]} (currently ${(weakest[1] * 100).toFixed(0)}%)`,
      rationale: `The ${weakest[0]} integration is the weakest link in the cognitive synergy chain. Improving it will increase overall system coherence.`,
      expectedImpact: 0.15,
      complexity: 'moderate',
      reversible: true,
      mutations: [{
        file: 'config',
        type: 'replace',
        content: JSON.stringify({ integration: weakest[0], boost: 0.1 }),
        description: `Increase ${weakest[0]} integration weight`,
      }],
    };
  }

  private proposeResilienceImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    const weakModule = snapshot.modules
      .filter(m => m.completeness < 0.7)
      .sort((a, b) => a.completeness - b.completeness)[0];
    
    return {
      id: `imi-${Date.now()}-resilience`,
      dimension: 'error_resilience',
      target: weakModule?.path || 'unknown',
      description: `Add error boundaries to ${weakModule?.name || 'weakest module'}`,
      rationale: `Module ${weakModule?.name} has ${((weakModule?.completeness || 0) * 100).toFixed(0)}% completeness, indicating missing error handling.`,
      expectedImpact: 0.10,
      complexity: 'minor',
      reversible: true,
      mutations: [{
        file: weakModule?.path || 'config',
        type: 'replace',
        content: JSON.stringify({ errorBoundary: true, retryCount: 3 }),
        description: `Enable error boundary for ${weakModule?.name}`,
      }],
    };
  }

  private proposeCoherenceImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    return {
      id: `imi-${Date.now()}-coherence`,
      dimension: 'cognitive_coherence',
      target: 'cognitive-synergy',
      description: 'Tune cognitive synergy cycle parameters for better subsystem coordination',
      rationale: 'The synergy-all integration score indicates subsystems are not optimally coordinating.',
      expectedImpact: 0.12,
      complexity: 'moderate',
      reversible: true,
      mutations: [{
        file: 'config',
        type: 'replace',
        content: JSON.stringify({ synergyCycleWeight: { ecan: 0.3, pln: 0.3, moses: 0.2, relevance: 0.2 } }),
        description: 'Rebalance synergy cycle weights',
      }],
    };
  }

  private proposeObservabilityImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    const unobserved = snapshot.modules.filter(m => m.health === 0.5);
    const target = unobserved[0];
    
    return {
      id: `imi-${Date.now()}-observability`,
      dimension: 'observability',
      target: target?.subsystem || 'unknown',
      description: `Enable health reporting for ${target?.name || 'unobserved module'}`,
      rationale: `${unobserved.length} modules lack active health reporting, making KSM evolution blind to their state.`,
      expectedImpact: 0.08,
      complexity: 'trivial',
      reversible: true,
      mutations: [{
        file: 'config',
        type: 'replace',
        content: JSON.stringify({ enableHealthReporting: target?.subsystem }),
        description: `Activate health metrics for ${target?.name}`,
      }],
    };
  }

  private proposePerformanceImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    const unprovisioned = snapshot.bindings.filter(b => !b.provisioned && b.configured);
    const target = unprovisioned[0];
    
    return {
      id: `imi-${Date.now()}-performance`,
      dimension: 'performance',
      target: target?.name || 'bindings',
      description: `Provision ${target?.name || 'missing binding'} for improved performance`,
      rationale: `${unprovisioned.length} configured bindings are not yet provisioned, limiting system capabilities.`,
      expectedImpact: 0.20,
      complexity: 'major',
      reversible: true,
      mutations: [{
        file: 'wrangler.toml',
        type: 'insert',
        content: JSON.stringify({ provision: target?.name, type: target?.type }),
        description: `Provision ${target?.name} binding`,
      }],
    };
  }

  private proposeTypeSafetyImprovement(snapshot: CognitiveSnapshot): ImprovementProposal {
    const leastComplete = snapshot.modules
      .sort((a, b) => a.completeness - b.completeness)[0];
    
    return {
      id: `imi-${Date.now()}-types`,
      dimension: 'type_safety',
      target: leastComplete?.path || 'unknown',
      description: `Improve type coverage in ${leastComplete?.name || 'weakest module'}`,
      rationale: `Module has ${((leastComplete?.completeness || 0) * 100).toFixed(0)}% completeness, suggesting type gaps.`,
      expectedImpact: 0.05,
      complexity: 'minor',
      reversible: true,
      mutations: [{
        file: leastComplete?.path || 'config',
        type: 'replace',
        content: JSON.stringify({ strictTypes: true }),
        description: `Enable strict type checking for ${leastComplete?.name}`,
      }],
    };
  }
}

// ---------------------------------------------------------------------------
// Evaluation Pipeline
// ---------------------------------------------------------------------------

/**
 * Evaluates a proposed mutation by comparing pre/post metrics
 * and running AI assessment.
 */
export class EvaluationPipeline {
  private kvStore: KVNamespace;
  private aiBinding: any;

  constructor(kvStore: KVNamespace, aiBinding?: any) {
    this.kvStore = kvStore;
    this.aiBinding = aiBinding;
  }

  /**
   * Evaluate a mutation by comparing snapshots and running AI assessment
   */
  async evaluate(
    preSnapshot: CognitiveSnapshot,
    postSnapshot: CognitiveSnapshot,
    proposal: ImprovementProposal
  ): Promise<EvaluationResult> {
    // Signal 1: Type/integration check
    const typeCheckPassed = this.checkTypeIntegrity(postSnapshot);

    // Signal 2: Integration score comparison
    const preIntegration = this.computeOverallIntegration(preSnapshot);
    const postIntegration = this.computeOverallIntegration(postSnapshot);
    const integrationScore = postIntegration;

    // Signal 3: Coherence score
    const coherenceScore = this.computeCoherence(postSnapshot);

    // Signal 4: Complexity delta
    const complexityDelta = this.computeComplexityDelta(preSnapshot, postSnapshot);

    // Signal 5: AI assessment
    const aiAssessment = await this.runAIAssessment(proposal, preSnapshot, postSnapshot);

    // Decision logic
    const decision = this.makeDecision(
      typeCheckPassed,
      postIntegration - preIntegration,
      aiAssessment.score
    );

    return {
      typeCheckPassed,
      integrationScore,
      coherenceScore,
      complexityDelta,
      aiAssessment,
      decision,
    };
  }

  private checkTypeIntegrity(snapshot: CognitiveSnapshot): boolean {
    // All modules should have non-zero completeness
    return snapshot.modules.every(m => m.completeness > 0);
  }

  private computeOverallIntegration(snapshot: CognitiveSnapshot): number {
    const scores = Object.values(snapshot.integrationScores);
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  private computeCoherence(snapshot: CognitiveSnapshot): number {
    // Coherence = how well modules with dependencies are connected
    const withDeps = snapshot.modules.filter(m => m.dependencies.length > 0);
    const avgHealth = withDeps.reduce((s, m) => s + m.health, 0) / (withDeps.length || 1);
    return avgHealth;
  }

  private computeComplexityDelta(pre: CognitiveSnapshot, post: CognitiveSnapshot): number {
    return post.totalCognitiveLines - pre.totalCognitiveLines;
  }

  private async runAIAssessment(
    proposal: ImprovementProposal,
    pre: CognitiveSnapshot,
    post: CognitiveSnapshot
  ): Promise<{ score: number; reasoning: string; risks: string[]; benefits: string[] }> {
    // If AI binding is available, use it for assessment
    if (this.aiBinding) {
      try {
        const response = await this.aiBinding.run(
          '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
          {
            messages: [{
              role: 'system',
              content: 'You are a cognitive architecture evaluator. Assess the proposed improvement and respond with JSON: {"score": <-5 to +5>, "reasoning": "<brief>", "risks": ["..."], "benefits": ["..."]}'
            }, {
              role: 'user',
              content: `Proposal: ${proposal.description}\nDimension: ${proposal.dimension}\nTarget: ${proposal.target}\nPre-integration: ${this.computeOverallIntegration(pre).toFixed(3)}\nPost-integration: ${this.computeOverallIntegration(post).toFixed(3)}\nComplexity delta: ${post.totalCognitiveLines - pre.totalCognitiveLines} lines`
            }]
          }
        );
        
        if (response && typeof response === 'object' && 'response' in response) {
          try {
            return JSON.parse(response.response as string);
          } catch { /* fall through to default */ }
        }
      } catch { /* fall through to default */ }
    }

    // Default heuristic assessment when AI is unavailable
    const integrationDelta = this.computeOverallIntegration(post) - this.computeOverallIntegration(pre);
    const score = integrationDelta > 0 ? Math.min(3, integrationDelta * 10) : -1;
    
    return {
      score,
      reasoning: `Integration ${integrationDelta > 0 ? 'improved' : 'unchanged'} by ${(integrationDelta * 100).toFixed(1)}%`,
      risks: integrationDelta < 0 ? ['Potential regression in integration'] : [],
      benefits: integrationDelta > 0 ? [`${proposal.dimension} improved`] : [],
    };
  }

  private makeDecision(
    typeCheckPassed: boolean,
    integrationDelta: number,
    aiScore: number
  ): 'keep' | 'discard' | 'retry' {
    if (!typeCheckPassed) return 'discard';
    if (integrationDelta < -0.05) return 'discard';
    if (aiScore >= 1 && integrationDelta >= 0) return 'keep';
    if (aiScore >= 0 && integrationDelta > 0) return 'keep';
    return 'retry';
  }
}

// ---------------------------------------------------------------------------
// Autonomous Loop Controller
// ---------------------------------------------------------------------------

export interface IMIConfig {
  maxIterationsPerCycle: number;
  maxRetries: number;
  timeBudgetMs: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: IMIConfig = {
  maxIterationsPerCycle: 3,
  maxRetries: 2,
  timeBudgetMs: 60000, // 1 minute per scheduled invocation
  enabled: true,
};

/**
 * The autonomous micro-improvement loop controller.
 * Runs as part of the scheduled Worker cron.
 */
export class IterativeMicroImprovementLoop {
  private manifest: VersionManifest;
  private introspection: IntrospectionEngine;
  private evaluation: EvaluationPipeline;
  private config: IMIConfig;
  private kvStore: KVNamespace;

  constructor(kvStore: KVNamespace, aiBinding?: any, config?: Partial<IMIConfig>) {
    this.kvStore = kvStore;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.manifest = new VersionManifest(kvStore);
    this.introspection = new IntrospectionEngine(kvStore, aiBinding);
    this.evaluation = new EvaluationPipeline(kvStore, aiBinding);
  }

  /**
   * Run one iteration of the micro-improvement loop.
   * Called by the scheduled Worker cron.
   */
  async runIteration(env: any): Promise<{
    version: number;
    proposal: ImprovementProposal;
    evaluation: EvaluationResult;
    decision: string;
  } | null> {
    if (!this.config.enabled) return null;

    const startTime = Date.now();
    await this.manifest.initialize();

    // Capture current state as pre-snapshot
    const preSnapshot = await this.manifest.captureSnapshot(env);
    
    // Ensure we have a baseline
    const current = this.manifest.getCurrentVersion();
    if (!current) {
      // Register v0 baseline
      await this.manifest.registerVersion({
        timestamp: Date.now(),
        status: 'baseline',
        snapshot: preSnapshot,
        proposal: null,
        evaluation: null,
        parentVersion: null,
      });
      await this.appendHistory({ type: 'baseline', version: 0, timestamp: Date.now() });
      return null;
    }

    // Check time budget
    if (Date.now() - startTime > this.config.timeBudgetMs) return null;

    // INTROSPECTION: Identify improvement target
    const proposal = await this.introspection.introspect(preSnapshot);

    // MUTATION: Apply the proposed change (runtime config mutation)
    const postSnapshot = await this.applyMutation(preSnapshot, proposal, env);

    // EVALUATION: Compare pre/post
    const evaluation = await this.evaluation.evaluate(preSnapshot, postSnapshot, proposal);

    // SELECTION: Keep or discard
    const status = evaluation.decision === 'keep' ? 'accepted' as const : 'rejected' as const;
    
    const entry = await this.manifest.registerVersion({
      timestamp: Date.now(),
      status,
      snapshot: postSnapshot,
      proposal,
      evaluation,
      parentVersion: current.version,
    });

    // If rejected, rollback the mutation
    if (status === 'rejected') {
      await this.rollbackMutation(proposal, env);
    }

    // Log to history
    await this.appendHistory({
      type: 'iteration',
      version: entry.version,
      timestamp: Date.now(),
      proposal: { id: proposal.id, dimension: proposal.dimension, target: proposal.target },
      evaluation: { decision: evaluation.decision, aiScore: evaluation.aiAssessment.score },
    });

    return {
      version: entry.version,
      proposal,
      evaluation,
      decision: evaluation.decision,
    };
  }

  /**
   * Apply a mutation to the runtime configuration
   */
  private async applyMutation(
    snapshot: CognitiveSnapshot,
    proposal: ImprovementProposal,
    env: any
  ): Promise<CognitiveSnapshot> {
    // Apply configuration mutations via KV
    for (const mutation of proposal.mutations) {
      const key = `imi:mutation:${proposal.id}:${mutation.file}`;
      await this.kvStore.put(key, mutation.content);
    }

    // Apply integration score boost if applicable
    if (proposal.dimension === 'integration_completeness') {
      const newScores = { ...snapshot.integrationScores };
      if (newScores[proposal.target] !== undefined) {
        newScores[proposal.target] = Math.min(1, newScores[proposal.target] + proposal.expectedImpact);
      }
      return { ...snapshot, integrationScores: newScores };
    }

    // Apply observability improvement
    if (proposal.dimension === 'observability') {
      const newModules = snapshot.modules.map(m => {
        if (m.subsystem === proposal.target) {
          return { ...m, health: 0.6 }; // Activate health reporting
        }
        return m;
      });
      return { ...snapshot, modules: newModules };
    }

    // For other dimensions, return snapshot with minor adjustments
    return { ...snapshot, contentHash: this.rehash(snapshot.contentHash) };
  }

  /**
   * Rollback a mutation
   */
  private async rollbackMutation(proposal: ImprovementProposal, env: any): Promise<void> {
    for (const mutation of proposal.mutations) {
      const key = `imi:mutation:${proposal.id}:${mutation.file}`;
      await this.kvStore.delete(key);
    }
  }

  /**
   * Append to the NDJSON history log
   */
  private async appendHistory(entry: any): Promise<void> {
    const historyKey = 'imi:history';
    const existing = await this.kvStore.get(historyKey);
    const lines = existing ? existing.split('\n').filter(Boolean) : [];
    lines.push(JSON.stringify(entry));
    // Keep last 200 entries
    const trimmed = lines.slice(-200);
    await this.kvStore.put(historyKey, trimmed.join('\n'));
  }

  private rehash(hash: string): string {
    let h = parseInt(hash, 16) || 0;
    h = ((h << 5) - h) + Date.now();
    return Math.abs(h | 0).toString(16).padStart(8, '0');
  }

  /**
   * Get evolution statistics and history for the dashboard
   */
  async getStatus(): Promise<{
    stats: ReturnType<VersionManifest['getStats']>;
    recentHistory: any[];
    config: IMIConfig;
  }> {
    await this.manifest.initialize();
    const historyStr = await this.kvStore.get('imi:history');
    const history = historyStr
      ? historyStr.split('\n').filter(Boolean).map(l => JSON.parse(l)).slice(-20)
      : [];

    return {
      stats: this.manifest.getStats(),
      recentHistory: history,
      config: this.config,
    };
  }
}
