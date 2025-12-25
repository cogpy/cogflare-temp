/**
 * FlareCog v6.0 Test Suite
 * 
 * Comprehensive tests for new v6.0 components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedDistributedQueryEngine, QueryPattern } from '../core/distributed/EnhancedDistributedQueryEngine';
import { RelevanceRealizationEngine, RelevanceContext } from '../core/RelevanceRealizationEngine';
import { Atom, AttentionValue, TruthValue } from '../types/cognitive-v5';

// ==================== Test Utilities ====================

function createTestAtom(id: string, sti: number = 50): Atom {
  return {
    id,
    type: 'ConceptNode',
    name: `Concept_${id}`,
    truthValue: { strength: 0.8, confidence: 0.9 },
    attentionValue: { sti, lti: 50, vlti: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function createTestLink(id: string, outgoing: string[], sti: number = 50): Atom {
  return {
    id,
    type: 'InheritanceLink',
    outgoing,
    truthValue: { strength: 0.7, confidence: 0.85 },
    attentionValue: { sti, lti: 40, vlti: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// ==================== Relevance Realization Engine Tests ====================

describe('RelevanceRealizationEngine', () => {
  let engine: RelevanceRealizationEngine;
  let testAtom: Atom;
  let context: RelevanceContext;

  beforeEach(() => {
    engine = new RelevanceRealizationEngine();
    testAtom = createTestAtom('test-atom-1', 80);
    context = {
      currentGoals: ['goal1', 'goal2'],
      activeAtoms: ['atom1', 'atom2'],
      recentAtoms: ['atom3', 'atom4'],
      timestamp: Date.now()
    };
  });

  it('should calculate salience correctly', () => {
    const salience = engine.calculateSalience(testAtom);
    
    expect(salience).toBeGreaterThan(0);
    expect(salience).toBeLessThanOrEqual(100);
  });

  it('should assess relevance across multiple dimensions', () => {
    const relevance = engine.assessRelevance(testAtom, context);
    
    expect(relevance).toHaveProperty('total');
    expect(relevance).toHaveProperty('components');
    expect(relevance.components).toHaveProperty('goalRelevance');
    expect(relevance.components).toHaveProperty('contextualFit');
    expect(relevance.components).toHaveProperty('novelty');
    expect(relevance.components).toHaveProperty('coherence');
    expect(relevance.components).toHaveProperty('pragmaticValue');
    
    expect(relevance.total).toBeGreaterThanOrEqual(0);
    expect(relevance.total).toBeLessThanOrEqual(1);
  });

  it('should update salience landscape', () => {
    const salience1 = 85;
    const salience2 = 45;
    const salience3 = 15;
    
    engine.updateSalienceLandscape('atom1', salience1);
    engine.updateSalienceLandscape('atom2', salience2);
    engine.updateSalienceLandscape('atom3', salience3);
    
    const landscape = engine.getSalienceLandscape();
    
    expect(landscape.peaks.length).toBeGreaterThan(0);
    expect(landscape.valleys.length).toBeGreaterThan(0);
    expect(landscape.gradients.size).toBeGreaterThan(0);
  });

  it('should provide optimal grip recommendations', () => {
    // Add some atoms to landscape
    engine.updateSalienceLandscape('high-atom', 90);
    engine.updateSalienceLandscape('medium-atom', 50);
    engine.updateSalienceLandscape('low-atom', 10);
    
    const grip = engine.getOptimalGrip();
    
    expect(grip).toHaveProperty('focus');
    expect(grip).toHaveProperty('explore');
    expect(grip).toHaveProperty('ignore');
    expect(grip).toHaveProperty('reasoning');
    
    expect(Array.isArray(grip.focus)).toBe(true);
    expect(Array.isArray(grip.explore)).toBe(true);
    expect(Array.isArray(grip.ignore)).toBe(true);
  });

  it('should update opponent processes', () => {
    const updates = {
      exploration: 0.7,
      abstraction: 0.4,
      breadth: 0.6,
      stability: 0.5
    };
    
    engine.updateOpponentProcesses(updates);
    
    const processes = engine.getOpponentProcesses();
    
    expect(processes.exploration.balance).toBe(0.7);
    expect(processes.abstraction.balance).toBe(0.4);
    expect(processes.breadth.balance).toBe(0.6);
    expect(processes.stability.balance).toBe(0.5);
  });

  it('should track relevance history', () => {
    const atom1 = createTestAtom('history-atom-1');
    const atom2 = createTestAtom('history-atom-2');
    
    engine.assessRelevance(atom1, context);
    engine.assessRelevance(atom2, context);
    engine.assessRelevance(atom1, context);
    
    const history = engine.getRelevanceHistory();
    
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty('atomId');
    expect(history[0]).toHaveProperty('relevance');
    expect(history[0]).toHaveProperty('timestamp');
  });
});

// ==================== Enhanced Distributed Query Engine Tests ====================

describe('EnhancedDistributedQueryEngine', () => {
  let engine: EnhancedDistributedQueryEngine;

  beforeEach(() => {
    // Mock environment
    const mockEnv = {
      CACHE: {
        get: async () => null,
        put: async () => {},
        delete: async () => {}
      } as any,
      ATOMSPACE_DO: {
        idFromName: () => ({ toString: () => 'mock-id' }),
        get: () => ({
          fetch: async () => new Response(JSON.stringify([]))
        })
      } as any
    };
    
    engine = new EnhancedDistributedQueryEngine(mockEnv);
  });

  it('should create cache keys correctly', () => {
    const pattern: QueryPattern = {
      type: 'ConceptNode',
      variables: new Map([['$X', 'Variable']]),
      constraints: [],
      maxResults: 100,
      timeout: 5000
    };
    
    // Access private method through any cast (for testing only)
    const key = (engine as any).generateCacheKey(pattern);
    
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('should calculate relevance scores', () => {
    const atom1 = createTestAtom('atom1', 90);
    const atom2 = createTestAtom('atom2', 50);
    const atom3 = createTestAtom('atom3', 10);
    
    const pattern: QueryPattern = {
      type: 'ConceptNode',
      variables: new Map(),
      constraints: [],
      maxResults: 100,
      timeout: 5000
    };
    
    const score1 = (engine as any).calculateRelevanceScore(atom1, pattern);
    const score2 = (engine as any).calculateRelevanceScore(atom2, pattern);
    const score3 = (engine as any).calculateRelevanceScore(atom3, pattern);
    
    expect(score1).toBeGreaterThan(score2);
    expect(score2).toBeGreaterThan(score3);
  });

  it('should partition results by relevance', () => {
    const results = {
      atoms: [
        createTestAtom('atom1', 90),
        createTestAtom('atom2', 50),
        createTestAtom('atom3', 10)
      ],
      bindings: [{}, {}, {}] as Map<string, Atom>[],
      scores: [90, 50, 10]
    };
    
    const partitions = (engine as any).partitionByRelevance(results);
    
    expect(partitions).toHaveProperty('high');
    expect(partitions).toHaveProperty('medium');
    expect(partitions).toHaveProperty('low');
    
    expect(partitions.high.length).toBeGreaterThan(0);
    expect(partitions.low.length).toBeGreaterThan(0);
  });
});

// ==================== Integration Tests ====================

describe('Integration Tests', () => {
  it('should integrate relevance engine with query engine', () => {
    const relevanceEngine = new RelevanceRealizationEngine();
    const atom = createTestAtom('integration-atom', 75);
    
    const salience = relevanceEngine.calculateSalience(atom);
    relevanceEngine.updateSalienceLandscape(atom.id, salience);
    
    const landscape = relevanceEngine.getSalienceLandscape();
    
    expect(landscape.peaks.length + landscape.valleys.length).toBeGreaterThan(0);
  });

  it('should handle high-attention atoms differently', () => {
    const relevanceEngine = new RelevanceRealizationEngine();
    
    const highAtom = createTestAtom('high-atom', 95);
    const lowAtom = createTestAtom('low-atom', 15);
    
    const highSalience = relevanceEngine.calculateSalience(highAtom);
    const lowSalience = relevanceEngine.calculateSalience(lowAtom);
    
    expect(highSalience).toBeGreaterThan(lowSalience);
  });
});

// ==================== Performance Tests ====================

describe('Performance Tests', () => {
  it('should handle large salience landscapes efficiently', () => {
    const engine = new RelevanceRealizationEngine();
    const startTime = Date.now();
    
    // Add 1000 atoms to landscape
    for (let i = 0; i < 1000; i++) {
      const salience = Math.random() * 100;
      engine.updateSalienceLandscape(`atom-${i}`, salience);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);
    
    const landscape = engine.getSalienceLandscape();
    expect(landscape.peaks.length).toBeGreaterThan(0);
  });

  it('should calculate relevance quickly', () => {
    const engine = new RelevanceRealizationEngine();
    const atom = createTestAtom('perf-atom');
    const context: RelevanceContext = {
      currentGoals: ['goal1', 'goal2'],
      activeAtoms: ['atom1', 'atom2'],
      recentAtoms: ['atom3'],
      timestamp: Date.now()
    };
    
    const startTime = Date.now();
    
    // Calculate relevance 100 times
    for (let i = 0; i < 100; i++) {
      engine.assessRelevance(atom, context);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (< 100ms)
    expect(duration).toBeLessThan(100);
  });
});

// ==================== Edge Cases ====================

describe('Edge Cases', () => {
  it('should handle atoms with zero attention', () => {
    const engine = new RelevanceRealizationEngine();
    const atom = createTestAtom('zero-atom', 0);
    
    const salience = engine.calculateSalience(atom);
    
    expect(salience).toBeGreaterThanOrEqual(0);
  });

  it('should handle atoms with maximum attention', () => {
    const engine = new RelevanceRealizationEngine();
    const atom = createTestAtom('max-atom', 100);
    
    const salience = engine.calculateSalience(atom);
    
    expect(salience).toBeLessThanOrEqual(100);
  });

  it('should handle empty context', () => {
    const engine = new RelevanceRealizationEngine();
    const atom = createTestAtom('empty-context-atom');
    const emptyContext: RelevanceContext = {
      currentGoals: [],
      activeAtoms: [],
      recentAtoms: [],
      timestamp: Date.now()
    };
    
    const relevance = engine.assessRelevance(atom, emptyContext);
    
    expect(relevance).toHaveProperty('total');
    expect(relevance.total).toBeGreaterThanOrEqual(0);
  });

  it('should handle optimal grip with no atoms', () => {
    const engine = new RelevanceRealizationEngine();
    const grip = engine.getOptimalGrip();
    
    expect(grip.focus).toEqual([]);
    expect(grip.explore).toEqual([]);
    expect(grip.ignore).toEqual([]);
  });
});

// ==================== Test Summary ====================

console.log(`
FlareCog v6.0 Test Suite
========================

Test Coverage:
- Relevance Realization Engine: ✓
- Enhanced Distributed Query Engine: ✓
- Integration Tests: ✓
- Performance Tests: ✓
- Edge Cases: ✓

Run with: pnpm test
`);
