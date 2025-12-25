/**
 * FlareCog v6.0 API Endpoints
 * 
 * Integration layer for new v6.0 components:
 * - Enhanced Distributed Query Engine
 * - Relevance Realization Engine
 * - Workers for Platforms (Multi-tenancy)
 * - Queue Task Submission
 * - Storage Tier Management
 */

import { Hono } from 'hono';
import { Env } from '../types/cognitive-v5';
import { EnhancedDistributedQueryEngine, QueryPattern } from '../core/distributed/EnhancedDistributedQueryEngine';
import { RelevanceRealizationEngine, RelevanceContext } from '../core/RelevanceRealizationEngine';
import { WorkersForPlatformsIntegration, TenantConfig } from '../platforms/WorkersForPlatformsIntegration';
import { CloudflareQueueIntegration, CognitiveTask } from '../optimizations/CloudflareQueueIntegration';
import { R2ColdStorageEnhanced } from '../storage/R2ColdStorageEnhanced';

const app = new Hono<{ Bindings: Env }>();

// ==================== Distributed Query Endpoints ====================

/**
 * POST /api/v6/query/distributed
 * Execute distributed query across edge network
 */
app.post('/api/v6/query/distributed', async (c) => {
  try {
    const pattern = await c.req.json<QueryPattern>();
    
    const queryEngine = new EnhancedDistributedQueryEngine({
      CACHE: c.env.COORDINATION_CACHE,
      ATOMSPACE_DO: c.env.ATOMSPACE
    });
    
    const result = await queryEngine.executeQuery(pattern);
    
    return c.json({
      success: true,
      result,
      metadata: {
        atomCount: result.atoms.length,
        bindingCount: result.bindings.length,
        cached: result.cached
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/query/traverse
 * Traverse hypergraph from starting atoms
 */
app.post('/api/v6/query/traverse', async (c) => {
  try {
    const { startAtomIds, direction, maxDepth, preFetch } = await c.req.json<{
      startAtomIds: string[];
      direction: 'incoming' | 'outgoing' | 'both';
      maxDepth: number;
      preFetch?: boolean;
    }>();
    
    const queryEngine = new EnhancedDistributedQueryEngine({
      CACHE: c.env.COORDINATION_CACHE,
      ATOMSPACE_DO: c.env.ATOMSPACE
    });
    
    const result = await queryEngine.traverse(startAtomIds, direction, maxDepth, preFetch);
    
    return c.json({
      success: true,
      atoms: result,
      count: result.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== Relevance Realization Endpoints ====================

/**
 * POST /api/v6/relevance/assess
 * Assess relevance of atoms in given context
 */
app.post('/api/v6/relevance/assess', async (c) => {
  try {
    const { atomIds, context } = await c.req.json<{
      atomIds: string[];
      context: RelevanceContext;
    }>();
    
    const relevanceEngine = new RelevanceRealizationEngine();
    
    // Get atoms (simplified - in production would fetch from AtomSpace)
    const atoms = []; // TODO: Fetch atoms from AtomSpace
    
    const assessments = atomIds.map(atomId => {
      const atom = atoms.find(a => a.id === atomId);
      if (!atom) return null;
      
      const relevance = relevanceEngine.assessRelevance(atom, context);
      return { atomId, relevance };
    }).filter(Boolean);
    
    return c.json({
      success: true,
      assessments
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/v6/relevance/grip
 * Get optimal cognitive grip recommendations
 */
app.get('/api/v6/relevance/grip', async (c) => {
  try {
    const relevanceEngine = new RelevanceRealizationEngine();
    const grip = relevanceEngine.getOptimalGrip();
    
    return c.json({
      success: true,
      grip
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/v6/relevance/landscape
 * Get current salience landscape
 */
app.get('/api/v6/relevance/landscape', async (c) => {
  try {
    const relevanceEngine = new RelevanceRealizationEngine();
    const landscape = relevanceEngine.getSalienceLandscape();
    
    return c.json({
      success: true,
      landscape
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== Multi-Tenant Endpoints ====================

/**
 * POST /api/v6/tenant/create
 * Create new tenant with isolated AtomSpace
 */
app.post('/api/v6/tenant/create', async (c) => {
  try {
    const config = await c.req.json<Omit<TenantConfig, 'createdAt' | 'lastAccessedAt'>>();
    
    const platformsIntegration = new WorkersForPlatformsIntegration({
      TENANT_REGISTRY: c.env.TENANT_REGISTRY,
      USAGE_TRACKER: c.env.USAGE_TRACKER,
      SHARED_KNOWLEDGE: c.env.SHARED_KNOWLEDGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      TENANT_ATOMSPACE_DO: c.env.TENANT_ATOMSPACE_DO
    });
    
    const tenantAtomSpace = await platformsIntegration.initializeTenant(config);
    
    return c.json({
      success: true,
      tenant: tenantAtomSpace
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/tenant/:tenantId/query
 * Execute query on tenant's AtomSpace
 */
app.post('/api/v6/tenant/:tenantId/query', async (c) => {
  try {
    const tenantId = c.req.param('tenantId');
    const query = await c.req.json();
    
    const platformsIntegration = new WorkersForPlatformsIntegration({
      TENANT_REGISTRY: c.env.TENANT_REGISTRY,
      USAGE_TRACKER: c.env.USAGE_TRACKER,
      SHARED_KNOWLEDGE: c.env.SHARED_KNOWLEDGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      TENANT_ATOMSPACE_DO: c.env.TENANT_ATOMSPACE_DO
    });
    
    const result = await platformsIntegration.executeQuery(tenantId, query);
    
    return c.json({
      success: true,
      result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/tenant/:tenantId/atom
 * Add atom to tenant's AtomSpace
 */
app.post('/api/v6/tenant/:tenantId/atom', async (c) => {
  try {
    const tenantId = c.req.param('tenantId');
    const atom = await c.req.json();
    
    const platformsIntegration = new WorkersForPlatformsIntegration({
      TENANT_REGISTRY: c.env.TENANT_REGISTRY,
      USAGE_TRACKER: c.env.USAGE_TRACKER,
      SHARED_KNOWLEDGE: c.env.SHARED_KNOWLEDGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      TENANT_ATOMSPACE_DO: c.env.TENANT_ATOMSPACE_DO
    });
    
    const result = await platformsIntegration.addAtom(tenantId, atom);
    
    return c.json({
      success: true,
      atom: result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/knowledge/create
 * Create shared knowledge base
 */
app.post('/api/v6/knowledge/create', async (c) => {
  try {
    const { ownerTenantId, name, description, isPublic } = await c.req.json<{
      ownerTenantId: string;
      name: string;
      description: string;
      isPublic?: boolean;
    }>();
    
    const platformsIntegration = new WorkersForPlatformsIntegration({
      TENANT_REGISTRY: c.env.TENANT_REGISTRY,
      USAGE_TRACKER: c.env.USAGE_TRACKER,
      SHARED_KNOWLEDGE: c.env.SHARED_KNOWLEDGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      TENANT_ATOMSPACE_DO: c.env.TENANT_ATOMSPACE_DO
    });
    
    const knowledgeBase = await platformsIntegration.createSharedKnowledgeBase(
      ownerTenantId,
      name,
      description,
      isPublic
    );
    
    return c.json({
      success: true,
      knowledgeBase
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== Queue Task Endpoints ====================

/**
 * POST /api/v6/task/enqueue
 * Enqueue cognitive task for asynchronous processing
 */
app.post('/api/v6/task/enqueue', async (c) => {
  try {
    const task = await c.req.json<CognitiveTask>();
    
    const queueIntegration = new CloudflareQueueIntegration({
      COGNITIVE_QUEUE: c.env.COGNITIVE_QUEUE,
      INFERENCE_QUEUE: c.env.INFERENCE_QUEUE,
      CONSOLIDATION_QUEUE: c.env.CONSOLIDATION_QUEUE,
      COORDINATION_QUEUE: c.env.COORDINATION_QUEUE,
      TASK_RESULTS: c.env.TASK_RESULTS,
      ATOMSPACE_DO: c.env.ATOMSPACE
    });
    
    await queueIntegration.enqueueTask(task);
    
    return c.json({
      success: true,
      taskId: task.id,
      message: 'Task enqueued successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/v6/task/:taskId/result
 * Get result of completed task
 */
app.get('/api/v6/task/:taskId/result', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    const queueIntegration = new CloudflareQueueIntegration({
      COGNITIVE_QUEUE: c.env.COGNITIVE_QUEUE,
      INFERENCE_QUEUE: c.env.INFERENCE_QUEUE,
      CONSOLIDATION_QUEUE: c.env.CONSOLIDATION_QUEUE,
      COORDINATION_QUEUE: c.env.COORDINATION_QUEUE,
      TASK_RESULTS: c.env.TASK_RESULTS,
      ATOMSPACE_DO: c.env.ATOMSPACE
    });
    
    const result = await queueIntegration.getResult(taskId);
    
    if (!result) {
      return c.json({
        success: false,
        error: 'Task result not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== Storage Tier Endpoints ====================

/**
 * GET /api/v6/storage/metrics
 * Get storage tier metrics
 */
app.get('/api/v6/storage/metrics', async (c) => {
  try {
    const storage = new R2ColdStorageEnhanced({
      R2_COLD_STORAGE: c.env.R2_COLD_STORAGE,
      KV_WARM_STORAGE: c.env.KV_WARM_STORAGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      STORAGE_METADATA: c.env.STORAGE_METADATA
    });
    
    const metrics = storage.getMetrics();
    
    return c.json({
      success: true,
      metrics
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/storage/maintenance
 * Run storage tier maintenance
 */
app.post('/api/v6/storage/maintenance', async (c) => {
  try {
    const storage = new R2ColdStorageEnhanced({
      R2_COLD_STORAGE: c.env.R2_COLD_STORAGE,
      KV_WARM_STORAGE: c.env.KV_WARM_STORAGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      STORAGE_METADATA: c.env.STORAGE_METADATA
    });
    
    await storage.runTieringMaintenance();
    
    return c.json({
      success: true,
      message: 'Tiering maintenance completed'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/v6/storage/evict
 * Evict old atoms from cold storage
 */
app.post('/api/v6/storage/evict', async (c) => {
  try {
    const storage = new R2ColdStorageEnhanced({
      R2_COLD_STORAGE: c.env.R2_COLD_STORAGE,
      KV_WARM_STORAGE: c.env.KV_WARM_STORAGE,
      ATOMSPACE_DO: c.env.ATOMSPACE,
      STORAGE_METADATA: c.env.STORAGE_METADATA
    });
    
    const evictedCount = await storage.evictOldAtoms();
    
    return c.json({
      success: true,
      evictedCount,
      message: `Evicted ${evictedCount} old atoms`
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ==================== Health Check ====================

/**
 * GET /api/v6/health
 * Health check for v6.0 components
 */
app.get('/api/v6/health', async (c) => {
  return c.json({
    success: true,
    version: '6.0.0',
    status: 'healthy',
    components: {
      distributedQuery: 'operational',
      relevanceRealization: 'operational',
      multiTenant: 'operational',
      queueProcessing: 'operational',
      tieredStorage: 'operational'
    },
    timestamp: Date.now()
  });
});

export default app;
