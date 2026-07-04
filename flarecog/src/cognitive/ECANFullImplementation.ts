/**
 * ECANFullImplementation.ts
 * 
 * Complete Economic Attention Network (ECAN) for FlareCog.
 * 
 * This is the full implementation of OpenCog's ECAN attention allocation
 * system, adapted for Cloudflare Workers' distributed architecture.
 * 
 * Key features beyond the basic ECAN:
 * 1. Hebbian learning — strengthens links between co-attended atoms
 * 2. Rent collection — atoms pay rent from STI to stay in attentional focus
 * 3. Wage distribution — important atoms earn STI from the attention bank
 * 4. Tiered storage migration — atoms move between DO/KV/R2 based on STI
 * 5. Attentional focus boundary — dynamic threshold for the "conscious" set
 * 6. Forgetting agent — removes atoms that can't pay rent
 * 
 * Architecture:
 * - Hot tier (STI > AF threshold): Durable Object in-memory
 * - Warm tier (STI > cold threshold): KV Namespace (KV_WARM_STORAGE)
 * - Cold tier (STI <= cold threshold): R2 Bucket (flarecog-cold-storage)
 * - Attention bank: global STI/LTI pool tracked in KV
 */

/**
 * Attention Value with full ECAN semantics
 */
export interface FullAttentionValue {
  sti: number;       // Short-Term Importance: -1000 to 1000
  lti: number;       // Long-Term Importance: 0 to 1000
  vlti: boolean;     // Very Long-Term Importance: never forget
  lastRentPaid: number;  // Timestamp of last rent payment
  lastWageReceived: number; // Timestamp of last wage
  tier: 'hot' | 'warm' | 'cold';
}

/**
 * Hebbian link between co-attended atoms
 */
export interface HebbianLink {
  id: string;
  sourceAtomId: string;
  targetAtomId: string;
  strength: number;     // 0 to 1: how strongly co-attended
  confidence: number;   // 0 to 1: how many co-attendance events observed
  coAttendanceCount: number;
  lastUpdated: number;
  decayRate: number;    // How fast the link weakens without reinforcement
}

/**
 * The Attention Bank tracks global STI/LTI reserves
 */
export interface AttentionBank {
  totalSTI: number;
  totalLTI: number;
  stiReserve: number;  // Unallocated STI available for wages
  ltiReserve: number;  // Unallocated LTI
  rentCollected: number;
  wagesDistributed: number;
  lastCycleTimestamp: number;
  cycleCount: number;
}

/**
 * ECAN Configuration
 */
export interface ECANConfig {
  /** STI threshold for attentional focus (atoms above this are "conscious") */
  attentionalFocusThreshold: number;
  /** STI threshold for warm→cold migration */
  coldThreshold: number;
  /** Base rent per cycle for atoms in attentional focus */
  baseRent: number;
  /** Rent multiplier for atoms with high STI */
  rentMultiplier: number;
  /** Base wage for important atoms */
  baseWage: number;
  /** Maximum STI any atom can hold */
  maxSTI: number;
  /** Minimum STI before atom is forgotten */
  minSTI: number;
  /** Hebbian learning rate */
  hebbianLearningRate: number;
  /** Hebbian decay rate per cycle */
  hebbianDecayRate: number;
  /** Maximum number of hebbian links per atom */
  maxHebbianLinksPerAtom: number;
  /** Spreading activation factor (how much STI spreads per link) */
  spreadingFactor: number;
  /** Number of atoms in attentional focus */
  attentionalFocusSize: number;
  /** Cycle interval in milliseconds */
  cycleIntervalMs: number;
}

const DEFAULT_ECAN_CONFIG: ECANConfig = {
  attentionalFocusThreshold: 50,
  coldThreshold: 10,
  baseRent: 2,
  rentMultiplier: 0.02,
  baseWage: 5,
  maxSTI: 1000,
  minSTI: -100,
  hebbianLearningRate: 0.1,
  hebbianDecayRate: 0.01,
  maxHebbianLinksPerAtom: 20,
  spreadingFactor: 0.3,
  attentionalFocusSize: 100,
  cycleIntervalMs: 5000,
};

/**
 * Storage tier interfaces
 */
interface KVBinding {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: Record<string, string> }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string; metadata?: Record<string, string> }> }>;
}

interface R2Binding {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  put(key: string, value: string, options?: { customMetadata?: Record<string, string> }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Atom record for ECAN processing
 */
interface ECANAtom {
  id: string;
  type: string;
  name: string;
  attention: FullAttentionValue;
  incomingLinks: string[];
  outgoingLinks: string[];
}

/**
 * ECAN cycle result
 */
export interface ECANCycleResult {
  cycleNumber: number;
  timestamp: number;
  atomsInFocus: number;
  rentCollected: number;
  wagesDistributed: number;
  hebbianLinksUpdated: number;
  atomsMigratedToWarm: number;
  atomsMigratedToCold: number;
  atomsPromotedToHot: number;
  atomsForgotten: number;
  attentionBank: AttentionBank;
  topAtoms: Array<{ id: string; name: string; sti: number }>;
}

/**
 * Full ECAN Implementation
 * 
 * Manages the complete attention economy across the distributed
 * FlareCog AtomSpace, including hebbian learning, rent/wage cycles,
 * and tiered storage migration.
 */
export class ECANFullImplementation {
  private config: ECANConfig;
  private attentionBank: AttentionBank;
  private hebbianLinks: Map<string, HebbianLink> = new Map();
  private hotAtoms: Map<string, ECANAtom> = new Map();
  private kvWarm: KVBinding;
  private r2Cold: R2Binding;
  private kvAttentionCache: KVBinding;

  constructor(
    kvWarm: KVBinding,
    r2Cold: R2Binding,
    kvAttentionCache: KVBinding,
    config?: Partial<ECANConfig>
  ) {
    this.config = { ...DEFAULT_ECAN_CONFIG, ...config };
    this.kvWarm = kvWarm;
    this.r2Cold = r2Cold;
    this.kvAttentionCache = kvAttentionCache;
    this.attentionBank = {
      totalSTI: 10000,
      totalLTI: 5000,
      stiReserve: 5000,
      ltiReserve: 2500,
      rentCollected: 0,
      wagesDistributed: 0,
      lastCycleTimestamp: Date.now(),
      cycleCount: 0,
    };
  }

  /**
   * Run a complete ECAN attention allocation cycle
   */
  async runCycle(): Promise<ECANCycleResult> {
    const cycleStart = Date.now();
    this.attentionBank.cycleCount++;

    // Phase 1: Collect rent from atoms in attentional focus
    const rentResult = await this.collectRent();

    // Phase 2: Distribute wages to important atoms
    const wageResult = await this.distributeWages();

    // Phase 3: Spread attention via hebbian links
    await this.spreadAttention();

    // Phase 4: Update hebbian links (learning)
    const hebbianUpdates = await this.updateHebbianLinks();

    // Phase 5: Decay hebbian links
    await this.decayHebbianLinks();

    // Phase 6: Migrate atoms between tiers based on STI
    const migrationResult = await this.migrateAtoms();

    // Phase 7: Forget atoms below minimum STI (unless VLTI)
    const forgottenCount = await this.forgetAtoms();

    // Phase 8: Update attentional focus boundary
    this.updateAttentionalFocusBoundary();

    // Phase 9: Persist attention bank state
    await this.persistAttentionBank();

    this.attentionBank.lastCycleTimestamp = cycleStart;

    // Get top atoms for reporting
    const topAtoms = this.getTopAtoms(10);

    return {
      cycleNumber: this.attentionBank.cycleCount,
      timestamp: cycleStart,
      atomsInFocus: this.getAttentionalFocusAtoms().length,
      rentCollected: rentResult.totalRent,
      wagesDistributed: wageResult.totalWages,
      hebbianLinksUpdated: hebbianUpdates,
      atomsMigratedToWarm: migrationResult.toWarm,
      atomsMigratedToCold: migrationResult.toCold,
      atomsPromotedToHot: migrationResult.toHot,
      atomsForgotten: forgottenCount,
      attentionBank: { ...this.attentionBank },
      topAtoms,
    };
  }

  /**
   * Phase 1: Collect rent from atoms in attentional focus
   * Atoms in focus pay rent proportional to their STI
   */
  private async collectRent(): Promise<{ totalRent: number; atomsCharged: number }> {
    let totalRent = 0;
    let atomsCharged = 0;

    for (const [id, atom] of this.hotAtoms) {
      if (atom.attention.sti >= this.config.attentionalFocusThreshold) {
        const rent = this.config.baseRent + (atom.attention.sti * this.config.rentMultiplier);
        atom.attention.sti -= rent;
        atom.attention.lastRentPaid = Date.now();
        totalRent += rent;
        atomsCharged++;
      }
    }

    this.attentionBank.stiReserve += totalRent;
    this.attentionBank.rentCollected += totalRent;
    return { totalRent, atomsCharged };
  }

  /**
   * Phase 2: Distribute wages to important atoms
   * Atoms with high LTI receive STI wages from the bank
   */
  private async distributeWages(): Promise<{ totalWages: number; atomsPaid: number }> {
    let totalWages = 0;
    let atomsPaid = 0;

    // Sort atoms by LTI (most important first)
    const sortedAtoms = [...this.hotAtoms.values()]
      .sort((a, b) => b.attention.lti - a.attention.lti)
      .slice(0, this.config.attentionalFocusSize);

    for (const atom of sortedAtoms) {
      if (this.attentionBank.stiReserve <= 0) break;

      const wage = Math.min(
        this.config.baseWage * (atom.attention.lti / 100),
        this.attentionBank.stiReserve
      );

      if (wage > 0) {
        atom.attention.sti = Math.min(atom.attention.sti + wage, this.config.maxSTI);
        atom.attention.lastWageReceived = Date.now();
        this.attentionBank.stiReserve -= wage;
        totalWages += wage;
        atomsPaid++;
      }
    }

    this.attentionBank.wagesDistributed += totalWages;
    return { totalWages, atomsPaid };
  }

  /**
   * Phase 3: Spread attention via hebbian links
   * STI flows from high-STI atoms to connected atoms
   */
  private async spreadAttention(): Promise<void> {
    const spreadUpdates: Map<string, number> = new Map();

    for (const [linkId, link] of this.hebbianLinks) {
      const sourceAtom = this.hotAtoms.get(link.sourceAtomId);
      const targetAtom = this.hotAtoms.get(link.targetAtomId);

      if (sourceAtom && targetAtom) {
        // STI flows from higher to lower, modulated by link strength
        const stiDiff = sourceAtom.attention.sti - targetAtom.attention.sti;
        if (stiDiff > 0) {
          const spread = stiDiff * this.config.spreadingFactor * link.strength;
          const currentDelta = spreadUpdates.get(link.targetAtomId) || 0;
          spreadUpdates.set(link.targetAtomId, currentDelta + spread);

          // Source loses proportional STI
          const sourceDelta = spreadUpdates.get(link.sourceAtomId) || 0;
          spreadUpdates.set(link.sourceAtomId, sourceDelta - spread * 0.5);
        }
      }
    }

    // Apply all spread updates atomically
    for (const [atomId, delta] of spreadUpdates) {
      const atom = this.hotAtoms.get(atomId);
      if (atom) {
        atom.attention.sti = Math.max(
          this.config.minSTI,
          Math.min(this.config.maxSTI, atom.attention.sti + delta)
        );
      }
    }
  }

  /**
   * Phase 4: Hebbian learning — strengthen links between co-attended atoms
   * If two atoms are simultaneously in attentional focus, strengthen their link
   */
  private async updateHebbianLinks(): Promise<number> {
    const focusAtoms = this.getAttentionalFocusAtoms();
    let updatedCount = 0;

    // For each pair of atoms in attentional focus, update hebbian link
    for (let i = 0; i < focusAtoms.length; i++) {
      for (let j = i + 1; j < focusAtoms.length; j++) {
        const atomA = focusAtoms[i];
        const atomB = focusAtoms[j];

        // Only create/strengthen links between atoms that share structural links
        if (this.areStructurallyConnected(atomA, atomB)) {
          const linkId = this.getHebbianLinkId(atomA.id, atomB.id);
          let link = this.hebbianLinks.get(linkId);

          if (!link) {
            // Check if we've exceeded max links for either atom
            const aLinks = this.getHebbianLinksForAtom(atomA.id);
            const bLinks = this.getHebbianLinksForAtom(atomB.id);
            if (aLinks.length >= this.config.maxHebbianLinksPerAtom ||
                bLinks.length >= this.config.maxHebbianLinksPerAtom) {
              continue;
            }

            // Create new hebbian link
            link = {
              id: linkId,
              sourceAtomId: atomA.id,
              targetAtomId: atomB.id,
              strength: 0,
              confidence: 0,
              coAttendanceCount: 0,
              lastUpdated: Date.now(),
              decayRate: this.config.hebbianDecayRate,
            };
            this.hebbianLinks.set(linkId, link);
          }

          // Strengthen the link (hebbian learning rule)
          const learningSignal = Math.min(atomA.attention.sti, atomB.attention.sti) / this.config.maxSTI;
          link.strength = Math.min(1.0, link.strength + this.config.hebbianLearningRate * learningSignal);
          link.coAttendanceCount++;
          link.confidence = Math.min(1.0, link.coAttendanceCount / 100);
          link.lastUpdated = Date.now();
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * Phase 5: Decay hebbian links that haven't been reinforced
   */
  private async decayHebbianLinks(): Promise<void> {
    const toRemove: string[] = [];

    for (const [linkId, link] of this.hebbianLinks) {
      link.strength -= link.decayRate;
      if (link.strength <= 0) {
        toRemove.push(linkId);
      }
    }

    for (const linkId of toRemove) {
      this.hebbianLinks.delete(linkId);
    }
  }

  /**
   * Phase 6: Migrate atoms between storage tiers based on STI
   */
  private async migrateAtoms(): Promise<{ toWarm: number; toCold: number; toHot: number }> {
    let toWarm = 0;
    let toCold = 0;
    let toHot = 0;

    // Demote: hot → warm (STI dropped below AF threshold)
    for (const [id, atom] of this.hotAtoms) {
      if (atom.attention.sti < this.config.attentionalFocusThreshold &&
          atom.attention.sti >= this.config.coldThreshold &&
          !atom.attention.vlti) {
        // Move to warm tier (KV)
        atom.attention.tier = 'warm';
        await this.kvWarm.put(`atom:${id}`, JSON.stringify(atom), {
          metadata: { sti: atom.attention.sti.toString(), type: atom.type },
        });
        this.hotAtoms.delete(id);
        toWarm++;
      } else if (atom.attention.sti < this.config.coldThreshold && !atom.attention.vlti) {
        // Move to cold tier (R2)
        atom.attention.tier = 'cold';
        await this.r2Cold.put(`atom/${id}.json`, JSON.stringify(atom), {
          customMetadata: { sti: atom.attention.sti.toString(), type: atom.type },
        });
        this.hotAtoms.delete(id);
        toCold++;
      }
    }

    // Promote: check warm tier for atoms that should be promoted
    // (This happens when external stimulation boosts an atom's STI)
    const warmKeys = await this.kvWarm.list({ prefix: 'atom:', limit: 50 });
    for (const key of warmKeys.keys) {
      const stiStr = key.metadata?.sti;
      if (stiStr && parseFloat(stiStr) >= this.config.attentionalFocusThreshold) {
        const atomStr = await this.kvWarm.get(key.name);
        if (atomStr) {
          const atom: ECANAtom = JSON.parse(atomStr);
          atom.attention.tier = 'hot';
          this.hotAtoms.set(atom.id, atom);
          await this.kvWarm.delete(key.name);
          toHot++;
        }
      }
    }

    return { toWarm, toCold, toHot };
  }

  /**
   * Phase 7: Forget atoms that can't pay rent (below minSTI)
   */
  private async forgetAtoms(): Promise<number> {
    let forgottenCount = 0;

    for (const [id, atom] of this.hotAtoms) {
      if (atom.attention.sti <= this.config.minSTI && !atom.attention.vlti) {
        // Remove from hot tier
        this.hotAtoms.delete(id);
        // Remove associated hebbian links
        for (const [linkId, link] of this.hebbianLinks) {
          if (link.sourceAtomId === id || link.targetAtomId === id) {
            this.hebbianLinks.delete(linkId);
          }
        }
        forgottenCount++;
      }
    }

    return forgottenCount;
  }

  /**
   * Phase 8: Dynamically adjust attentional focus boundary
   * Uses the top-N atoms by STI to define the focus set
   */
  private updateAttentionalFocusBoundary(): void {
    const sortedSTI = [...this.hotAtoms.values()]
      .map(a => a.attention.sti)
      .sort((a, b) => b - a);

    if (sortedSTI.length >= this.config.attentionalFocusSize) {
      // Set threshold to the STI of the Nth atom
      this.config.attentionalFocusThreshold = sortedSTI[this.config.attentionalFocusSize - 1];
    }
  }

  /**
   * Persist attention bank state to KV
   */
  private async persistAttentionBank(): Promise<void> {
    await this.kvAttentionCache.put(
      'ecan:attention_bank',
      JSON.stringify(this.attentionBank)
    );
  }

  /**
   * Stimulate an atom — increase its STI from external input
   */
  async stimulateAtom(atomId: string, stiBoost: number): Promise<void> {
    const atom = this.hotAtoms.get(atomId);
    if (atom) {
      atom.attention.sti = Math.min(this.config.maxSTI, atom.attention.sti + stiBoost);
    } else {
      // Try to promote from warm tier
      const warmAtomStr = await this.kvWarm.get(`atom:${atomId}`);
      if (warmAtomStr) {
        const warmAtom: ECANAtom = JSON.parse(warmAtomStr);
        warmAtom.attention.sti = Math.min(this.config.maxSTI, warmAtom.attention.sti + stiBoost);
        warmAtom.attention.tier = 'hot';
        this.hotAtoms.set(atomId, warmAtom);
        await this.kvWarm.delete(`atom:${atomId}`);
      }
    }
  }

  /**
   * Register an atom in the ECAN system
   */
  registerAtom(atom: ECANAtom): void {
    atom.attention.tier = 'hot';
    this.hotAtoms.set(atom.id, atom);
  }

  /**
   * Get atoms currently in attentional focus
   */
  getAttentionalFocusAtoms(): ECANAtom[] {
    return [...this.hotAtoms.values()]
      .filter(a => a.attention.sti >= this.config.attentionalFocusThreshold)
      .sort((a, b) => b.attention.sti - a.attention.sti);
  }

  /**
   * Get top N atoms by STI
   */
  private getTopAtoms(n: number): Array<{ id: string; name: string; sti: number }> {
    return [...this.hotAtoms.values()]
      .sort((a, b) => b.attention.sti - a.attention.sti)
      .slice(0, n)
      .map(a => ({ id: a.id, name: a.name, sti: a.attention.sti }));
  }

  /**
   * Check if two atoms share a structural link (not hebbian)
   */
  private areStructurallyConnected(atomA: ECANAtom, atomB: ECANAtom): boolean {
    return atomA.outgoingLinks.includes(atomB.id) ||
           atomB.outgoingLinks.includes(atomA.id) ||
           atomA.incomingLinks.includes(atomB.id) ||
           atomB.incomingLinks.includes(atomA.id);
  }

  /**
   * Get canonical hebbian link ID (order-independent)
   */
  private getHebbianLinkId(atomIdA: string, atomIdB: string): string {
    return atomIdA < atomIdB ? `heb:${atomIdA}:${atomIdB}` : `heb:${atomIdB}:${atomIdA}`;
  }

  /**
   * Get all hebbian links for a given atom
   */
  private getHebbianLinksForAtom(atomId: string): HebbianLink[] {
    return [...this.hebbianLinks.values()].filter(
      l => l.sourceAtomId === atomId || l.targetAtomId === atomId
    );
  }

  /**
   * Get current ECAN statistics
   */
  getStats(): {
    hotAtomCount: number;
    hebbianLinkCount: number;
    attentionalFocusSize: number;
    attentionBank: AttentionBank;
    config: ECANConfig;
  } {
    return {
      hotAtomCount: this.hotAtoms.size,
      hebbianLinkCount: this.hebbianLinks.size,
      attentionalFocusSize: this.getAttentionalFocusAtoms().length,
      attentionBank: { ...this.attentionBank },
      config: { ...this.config },
    };
  }

  /**
   * Load attention bank state from KV (for initialization)
   */
  async loadAttentionBank(): Promise<void> {
    const bankStr = await this.kvAttentionCache.get('ecan:attention_bank');
    if (bankStr) {
      this.attentionBank = JSON.parse(bankStr);
    }
  }
}
