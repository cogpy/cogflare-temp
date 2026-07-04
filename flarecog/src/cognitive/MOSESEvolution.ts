/**
 * MOSESEvolution.ts
 * 
 * Meta-Optimizing Semantic Evolutionary Search (MOSES) for Cloudflare Workers.
 * 
 * MOSES evolves programs (combo trees) to fit a given fitness function.
 * In FlareCog, this is implemented using Cloudflare Queues for asynchronous
 * parallel fitness evaluation across Workers.
 * 
 * Architecture:
 * - COGNITIVE_QUEUE: carries generation tasks (evaluate fitness of candidate programs)
 * - INFERENCE_QUEUE: carries inference tasks (use evolved programs for reasoning)
 * - Each evolutionary generation is a batch of Queue messages
 * - Workers evaluate fitness in parallel
 * - Best programs are stored in AtomSpace as SchemaNode atoms
 * 
 * This implements Priority 4 from the FlareCog roadmap.
 */

/**
 * A program node in the combo tree representation
 */
export interface ComboNode {
  type: 'operator' | 'terminal' | 'variable' | 'constant';
  value: string;
  children: ComboNode[];
}

/**
 * A candidate program with fitness metadata
 */
export interface CandidateProgram {
  id: string;
  tree: ComboNode;
  fitness: number;
  complexity: number;
  generation: number;
  parentIds: string[];
  createdAt: number;
}

/**
 * Fitness function specification
 */
export interface FitnessSpec {
  type: 'classification' | 'regression' | 'pattern_match' | 'custom';
  trainingData: Array<{ input: Record<string, number>; expectedOutput: number }>;
  maxComplexity: number;
  targetFitness: number;
}

/**
 * MOSES evolution configuration
 */
export interface MOSESConfig {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRatio: number;
  complexityPenalty: number;
  diversityBonus: number;
  tournamentSize: number;
  operatorSet: string[];
  terminalSet: string[];
  variableSet: string[];
  maxTreeDepth: number;
}

const DEFAULT_CONFIG: MOSESConfig = {
  populationSize: 50,
  maxGenerations: 100,
  mutationRate: 0.15,
  crossoverRate: 0.7,
  elitismRatio: 0.1,
  complexityPenalty: 0.01,
  diversityBonus: 0.05,
  tournamentSize: 5,
  operatorSet: ['and', 'or', 'not', 'if', 'plus', 'times', 'greater', 'less', 'equal'],
  terminalSet: ['true', 'false', '0', '1'],
  variableSet: ['$x0', '$x1', '$x2', '$x3'],
  maxTreeDepth: 7,
};

/**
 * Queue message types for MOSES evolution
 */
export interface MOSESQueueMessage {
  type: 'evaluate_fitness' | 'evolve_generation' | 'store_result' | 'report_progress';
  payload: EvaluateFitnessPayload | EvolveGenerationPayload | StoreResultPayload | ReportProgressPayload;
}

export interface EvaluateFitnessPayload {
  kind: 'evaluate_fitness';
  programId: string;
  program: ComboNode;
  fitnessSpec: FitnessSpec;
  generation: number;
}

export interface EvolveGenerationPayload {
  kind: 'evolve_generation';
  generation: number;
  population: CandidateProgram[];
  config: MOSESConfig;
  fitnessSpec: FitnessSpec;
}

export interface StoreResultPayload {
  kind: 'store_result';
  program: CandidateProgram;
  atomSpaceId: string;
}

export interface ReportProgressPayload {
  kind: 'report_progress';
  generation: number;
  bestFitness: number;
  averageFitness: number;
  populationSize: number;
  convergenceRate: number;
}

/**
 * Queue binding interface
 */
interface QueueBinding {
  send(message: unknown, options?: { contentType?: string; delaySeconds?: number }): Promise<void>;
  sendBatch(messages: Array<{ body: unknown; contentType?: string; delaySeconds?: number }>): Promise<void>;
}

/**
 * KV binding for storing evolution state
 */
interface KVBinding {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * MOSES Evolution Engine
 * 
 * Manages the evolutionary search process using Cloudflare Queues
 * for distributed fitness evaluation.
 */
export class MOSESEvolution {
  private config: MOSESConfig;
  private cognitiveQueue: QueueBinding;
  private taskResults: KVBinding;

  constructor(
    cognitiveQueue: QueueBinding,
    taskResults: KVBinding,
    config?: Partial<MOSESConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cognitiveQueue = cognitiveQueue;
    this.taskResults = taskResults;
  }

  /**
   * Start a new MOSES evolution run
   * Creates initial population and queues first generation for evaluation
   */
  async startEvolution(fitnessSpec: FitnessSpec, runId?: string): Promise<string> {
    const evolutionId = runId || `moses-${Date.now()}`;

    // Generate initial random population
    const population = this.generateInitialPopulation(fitnessSpec);

    // Store evolution state
    await this.taskResults.put(`moses:${evolutionId}:state`, JSON.stringify({
      evolutionId,
      generation: 0,
      status: 'running',
      bestFitness: 0,
      startedAt: Date.now(),
      config: this.config,
      fitnessSpec,
    }), { expirationTtl: 86400 }); // 24h TTL

    // Queue fitness evaluation for each candidate
    const messages = population.map(program => ({
      body: {
        type: 'evaluate_fitness' as const,
        payload: {
          kind: 'evaluate_fitness' as const,
          programId: program.id,
          program: program.tree,
          fitnessSpec,
          generation: 0,
        },
      } as MOSESQueueMessage,
    }));

    // Send in batches of 100
    for (let i = 0; i < messages.length; i += 100) {
      await this.cognitiveQueue.sendBatch(messages.slice(i, i + 100));
    }

    // Store population for this generation
    await this.taskResults.put(
      `moses:${evolutionId}:gen:0`,
      JSON.stringify(population),
      { expirationTtl: 86400 }
    );

    return evolutionId;
  }

  /**
   * Process a fitness evaluation result and potentially trigger next generation
   */
  async processFitnessResult(
    evolutionId: string,
    programId: string,
    fitness: number
  ): Promise<{ generationComplete: boolean; nextGeneration?: number }> {
    // Update the program's fitness in stored population
    const genKey = await this.getCurrentGenerationKey(evolutionId);
    const populationStr = await this.taskResults.get(genKey);
    if (!populationStr) return { generationComplete: false };

    const population: CandidateProgram[] = JSON.parse(populationStr);
    const program = population.find(p => p.id === programId);
    if (program) {
      program.fitness = fitness;
    }

    // Check if all fitness evaluations are complete
    const allEvaluated = population.every(p => p.fitness !== -1);
    await this.taskResults.put(genKey, JSON.stringify(population), { expirationTtl: 86400 });

    if (allEvaluated) {
      // Trigger next generation evolution
      const stateStr = await this.taskResults.get(`moses:${evolutionId}:state`);
      if (!stateStr) return { generationComplete: true };

      const state = JSON.parse(stateStr);
      const nextGen = state.generation + 1;

      if (nextGen >= this.config.maxGenerations || this.hasConverged(population, state.fitnessSpec)) {
        // Evolution complete
        state.status = 'complete';
        state.bestFitness = Math.max(...population.map(p => p.fitness));
        await this.taskResults.put(`moses:${evolutionId}:state`, JSON.stringify(state), { expirationTtl: 86400 });
        return { generationComplete: true };
      }

      // Queue next generation evolution
      await this.cognitiveQueue.send({
        type: 'evolve_generation',
        payload: {
          kind: 'evolve_generation',
          generation: nextGen,
          population,
          config: this.config,
          fitnessSpec: state.fitnessSpec,
        },
      } as MOSESQueueMessage);

      state.generation = nextGen;
      state.bestFitness = Math.max(...population.map(p => p.fitness));
      await this.taskResults.put(`moses:${evolutionId}:state`, JSON.stringify(state), { expirationTtl: 86400 });

      return { generationComplete: true, nextGeneration: nextGen };
    }

    return { generationComplete: false };
  }

  /**
   * Evolve the next generation from the current population
   * Uses tournament selection, crossover, and mutation
   */
  async evolveNextGeneration(
    evolutionId: string,
    currentPopulation: CandidateProgram[],
    fitnessSpec: FitnessSpec,
    generation: number
  ): Promise<CandidateProgram[]> {
    const nextPopulation: CandidateProgram[] = [];

    // Elitism: keep top performers
    const eliteCount = Math.floor(this.config.populationSize * this.config.elitismRatio);
    const sorted = [...currentPopulation].sort((a, b) => b.fitness - a.fitness);
    const elites = sorted.slice(0, eliteCount).map(p => ({
      ...p,
      generation,
      id: `prog-${generation}-${nextPopulation.length}`,
    }));
    nextPopulation.push(...elites);

    // Fill rest with crossover and mutation
    while (nextPopulation.length < this.config.populationSize) {
      const random = Math.random();

      if (random < this.config.crossoverRate) {
        // Crossover
        const parent1 = this.tournamentSelect(currentPopulation);
        const parent2 = this.tournamentSelect(currentPopulation);
        const child = this.crossover(parent1, parent2, generation, nextPopulation.length);
        nextPopulation.push(child);
      } else if (random < this.config.crossoverRate + this.config.mutationRate) {
        // Mutation
        const parent = this.tournamentSelect(currentPopulation);
        const mutant = this.mutate(parent, generation, nextPopulation.length);
        nextPopulation.push(mutant);
      } else {
        // Reproduction (copy)
        const parent = this.tournamentSelect(currentPopulation);
        nextPopulation.push({
          ...parent,
          id: `prog-${generation}-${nextPopulation.length}`,
          generation,
          parentIds: [parent.id],
        });
      }
    }

    // Queue fitness evaluation for new generation
    const messages = nextPopulation.map(program => ({
      body: {
        type: 'evaluate_fitness' as const,
        payload: {
          kind: 'evaluate_fitness' as const,
          programId: program.id,
          program: program.tree,
          fitnessSpec,
          generation,
        },
      } as MOSESQueueMessage,
    }));

    for (let i = 0; i < messages.length; i += 100) {
      await this.cognitiveQueue.sendBatch(messages.slice(i, i + 100));
    }

    // Store new generation
    await this.taskResults.put(
      `moses:${evolutionId}:gen:${generation}`,
      JSON.stringify(nextPopulation),
      { expirationTtl: 86400 }
    );

    return nextPopulation;
  }

  /**
   * Evaluate a program's fitness against the training data
   */
  evaluateFitness(program: ComboNode, fitnessSpec: FitnessSpec): number {
    let correctCount = 0;
    let totalError = 0;

    for (const sample of fitnessSpec.trainingData) {
      try {
        const output = this.executeProgram(program, sample.input);
        if (fitnessSpec.type === 'classification') {
          if (Math.round(output) === sample.expectedOutput) correctCount++;
        } else {
          totalError += Math.abs(output - sample.expectedOutput);
        }
      } catch {
        // Program crashed on this input — penalize
        totalError += 1.0;
      }
    }

    let rawFitness: number;
    if (fitnessSpec.type === 'classification') {
      rawFitness = correctCount / fitnessSpec.trainingData.length;
    } else {
      rawFitness = 1.0 / (1.0 + totalError / fitnessSpec.trainingData.length);
    }

    // Apply complexity penalty
    const complexity = this.measureComplexity(program);
    const penalizedFitness = rawFitness - this.config.complexityPenalty * complexity;

    return Math.max(0, penalizedFitness);
  }

  /**
   * Execute a combo tree program with given variable bindings
   */
  private executeProgram(node: ComboNode, variables: Record<string, number>): number {
    switch (node.type) {
      case 'constant':
        return parseFloat(node.value) || 0;
      case 'variable':
        return variables[node.value] || 0;
      case 'terminal':
        if (node.value === 'true') return 1;
        if (node.value === 'false') return 0;
        return parseFloat(node.value) || 0;
      case 'operator':
        return this.executeOperator(node, variables);
      default:
        return 0;
    }
  }

  private executeOperator(node: ComboNode, variables: Record<string, number>): number {
    const args = node.children.map(child => this.executeProgram(child, variables));

    switch (node.value) {
      case 'and': return (args[0] > 0.5 && args[1] > 0.5) ? 1 : 0;
      case 'or': return (args[0] > 0.5 || args[1] > 0.5) ? 1 : 0;
      case 'not': return args[0] > 0.5 ? 0 : 1;
      case 'if': return args[0] > 0.5 ? args[1] : (args[2] || 0);
      case 'plus': return args[0] + args[1];
      case 'times': return args[0] * args[1];
      case 'greater': return args[0] > args[1] ? 1 : 0;
      case 'less': return args[0] < args[1] ? 1 : 0;
      case 'equal': return Math.abs(args[0] - args[1]) < 0.001 ? 1 : 0;
      default: return 0;
    }
  }

  /**
   * Generate initial random population
   */
  private generateInitialPopulation(fitnessSpec: FitnessSpec): CandidateProgram[] {
    const population: CandidateProgram[] = [];
    for (let i = 0; i < this.config.populationSize; i++) {
      const tree = this.generateRandomTree(Math.floor(Math.random() * 4) + 2);
      population.push({
        id: `prog-0-${i}`,
        tree,
        fitness: -1, // Not yet evaluated
        complexity: this.measureComplexity(tree),
        generation: 0,
        parentIds: [],
        createdAt: Date.now(),
      });
    }
    return population;
  }

  /**
   * Generate a random combo tree of given max depth
   */
  private generateRandomTree(maxDepth: number): ComboNode {
    if (maxDepth <= 1 || Math.random() < 0.3) {
      // Generate terminal or variable
      if (Math.random() < 0.5 && this.config.variableSet.length > 0) {
        const varIdx = Math.floor(Math.random() * this.config.variableSet.length);
        return { type: 'variable', value: this.config.variableSet[varIdx], children: [] };
      } else {
        const termIdx = Math.floor(Math.random() * this.config.terminalSet.length);
        return { type: 'terminal', value: this.config.terminalSet[termIdx], children: [] };
      }
    }

    // Generate operator with children
    const opIdx = Math.floor(Math.random() * this.config.operatorSet.length);
    const op = this.config.operatorSet[opIdx];
    const arity = this.getOperatorArity(op);
    const children: ComboNode[] = [];
    for (let i = 0; i < arity; i++) {
      children.push(this.generateRandomTree(maxDepth - 1));
    }

    return { type: 'operator', value: op, children };
  }

  private getOperatorArity(op: string): number {
    switch (op) {
      case 'not': return 1;
      case 'if': return 3;
      default: return 2;
    }
  }

  /**
   * Tournament selection
   */
  private tournamentSelect(population: CandidateProgram[]): CandidateProgram {
    let best: CandidateProgram | null = null;
    for (let i = 0; i < this.config.tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      const candidate = population[idx];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best!;
  }

  /**
   * Crossover: swap subtrees between two parents
   */
  private crossover(parent1: CandidateProgram, parent2: CandidateProgram, generation: number, index: number): CandidateProgram {
    const tree1 = JSON.parse(JSON.stringify(parent1.tree)) as ComboNode;
    const tree2 = JSON.parse(JSON.stringify(parent2.tree)) as ComboNode;

    // Select random subtree from each parent and swap
    const nodes1 = this.flattenTree(tree1);
    const nodes2 = this.flattenTree(tree2);

    if (nodes1.length > 1 && nodes2.length > 1) {
      const idx1 = Math.floor(Math.random() * (nodes1.length - 1)) + 1;
      const idx2 = Math.floor(Math.random() * (nodes2.length - 1)) + 1;

      // Replace subtree in tree1 with subtree from tree2
      const replacement = nodes2[idx2];
      this.replaceSubtree(tree1, nodes1[idx1], replacement);
    }

    // Enforce max depth
    const pruned = this.pruneTree(tree1, this.config.maxTreeDepth);

    return {
      id: `prog-${generation}-${index}`,
      tree: pruned,
      fitness: -1,
      complexity: this.measureComplexity(pruned),
      generation,
      parentIds: [parent1.id, parent2.id],
      createdAt: Date.now(),
    };
  }

  /**
   * Mutation: randomly modify a subtree
   */
  private mutate(parent: CandidateProgram, generation: number, index: number): CandidateProgram {
    const tree = JSON.parse(JSON.stringify(parent.tree)) as ComboNode;
    const nodes = this.flattenTree(tree);

    if (nodes.length > 0) {
      const mutationPoint = Math.floor(Math.random() * nodes.length);
      const targetNode = nodes[mutationPoint];

      // Replace with a new random subtree
      const newSubtree = this.generateRandomTree(3);
      Object.assign(targetNode, newSubtree);
    }

    const pruned = this.pruneTree(tree, this.config.maxTreeDepth);

    return {
      id: `prog-${generation}-${index}`,
      tree: pruned,
      fitness: -1,
      complexity: this.measureComplexity(pruned),
      generation,
      parentIds: [parent.id],
      createdAt: Date.now(),
    };
  }

  /**
   * Flatten a tree into an array of all nodes (BFS)
   */
  private flattenTree(node: ComboNode): ComboNode[] {
    const result: ComboNode[] = [node];
    for (const child of node.children) {
      result.push(...this.flattenTree(child));
    }
    return result;
  }

  /**
   * Replace a target node in the tree with a replacement
   */
  private replaceSubtree(root: ComboNode, target: ComboNode, replacement: ComboNode): boolean {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i] === target) {
        root.children[i] = replacement;
        return true;
      }
      if (this.replaceSubtree(root.children[i], target, replacement)) return true;
    }
    return false;
  }

  /**
   * Prune a tree to maximum depth
   */
  private pruneTree(node: ComboNode, maxDepth: number): ComboNode {
    if (maxDepth <= 1) {
      // Convert to terminal
      return { type: 'terminal', value: '0', children: [] };
    }
    return {
      ...node,
      children: node.children.map(child => this.pruneTree(child, maxDepth - 1)),
    };
  }

  /**
   * Measure program complexity (number of nodes)
   */
  private measureComplexity(node: ComboNode): number {
    return 1 + node.children.reduce((sum, child) => sum + this.measureComplexity(child), 0);
  }

  /**
   * Check if evolution has converged
   */
  private hasConverged(population: CandidateProgram[], fitnessSpec: FitnessSpec): boolean {
    const bestFitness = Math.max(...population.map(p => p.fitness));
    return bestFitness >= fitnessSpec.targetFitness;
  }

  /**
   * Get current generation key for KV storage
   */
  private async getCurrentGenerationKey(evolutionId: string): Promise<string> {
    const stateStr = await this.taskResults.get(`moses:${evolutionId}:state`);
    if (!stateStr) return `moses:${evolutionId}:gen:0`;
    const state = JSON.parse(stateStr);
    return `moses:${evolutionId}:gen:${state.generation}`;
  }

  /**
   * Convert the best evolved program to an AtomSpace SchemaNode representation
   */
  programToAtomSpace(program: CandidateProgram): {
    type: string;
    name: string;
    truthValue: { strength: number; confidence: number };
    metadata: Record<string, unknown>;
  } {
    return {
      type: 'SchemaNode',
      name: `evolved:${program.id}`,
      truthValue: {
        strength: program.fitness,
        confidence: Math.min(0.9, program.fitness * 0.95),
      },
      metadata: {
        comboTree: program.tree,
        complexity: program.complexity,
        generation: program.generation,
        parentIds: program.parentIds,
        evolvedAt: program.createdAt,
      },
    };
  }
}
