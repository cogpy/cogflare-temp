/**
 * imi-endpoints.ts
 * 
 * REST API endpoints for the Iterative Micro-Improvement (IMI) system.
 * Provides dashboard access, manual trigger, configuration, and history.
 * 
 * Endpoints:
 *   POST /api/imi/iterate     → Trigger one improvement iteration
 *   GET  /api/imi/status      → Current IMI status, stats, and recent history
 *   GET  /api/imi/manifest    → Full version manifest
 *   GET  /api/imi/history     → NDJSON history log
 *   POST /api/imi/config      → Update IMI configuration
 *   GET  /api/imi/snapshot    → Current cognitive architecture snapshot
 */

import { IterativeMicroImprovementLoop } from '../evolution/IterativeMicroImprovement';
import { VersionManifest } from '../evolution/VersionManifest';

export async function handleIMIRequest(
  request: Request,
  env: any,
  path: string
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // Route: POST /api/imi/iterate
  if (path.endsWith('/iterate') && method === 'POST') {
    return handleIterate(env);
  }

  // Route: GET /api/imi/status
  if (path.endsWith('/status') && method === 'GET') {
    return handleStatus(env);
  }

  // Route: GET /api/imi/manifest
  if (path.endsWith('/manifest') && method === 'GET') {
    return handleManifest(env);
  }

  // Route: GET /api/imi/history
  if (path.endsWith('/history') && method === 'GET') {
    return handleHistory(env);
  }

  // Route: POST /api/imi/config
  if (path.endsWith('/config') && method === 'POST') {
    return handleConfig(request, env);
  }

  // Route: GET /api/imi/snapshot
  if (path.endsWith('/snapshot') && method === 'GET') {
    return handleSnapshot(env);
  }

  return new Response(JSON.stringify({
    error: 'Not found',
    available: [
      'POST /api/imi/iterate',
      'GET  /api/imi/status',
      'GET  /api/imi/manifest',
      'GET  /api/imi/history',
      'POST /api/imi/config',
      'GET  /api/imi/snapshot',
    ]
  }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleIterate(env: any): Promise<Response> {
  try {
    const loop = new IterativeMicroImprovementLoop(env.STORAGE_METADATA, env.AI);
    const result = await loop.runIteration(env);

    if (!result) {
      return jsonResponse({
        success: true,
        message: 'Baseline registered or loop disabled',
        version: 0,
      });
    }

    return jsonResponse({
      success: true,
      version: result.version,
      proposal: {
        id: result.proposal.id,
        dimension: result.proposal.dimension,
        target: result.proposal.target,
        description: result.proposal.description,
        expectedImpact: result.proposal.expectedImpact,
      },
      evaluation: {
        decision: result.evaluation.decision,
        integrationScore: result.evaluation.integrationScore,
        coherenceScore: result.evaluation.coherenceScore,
        aiScore: result.evaluation.aiAssessment.score,
        reasoning: result.evaluation.aiAssessment.reasoning,
      },
      decision: result.decision,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

async function handleStatus(env: any): Promise<Response> {
  try {
    const loop = new IterativeMicroImprovementLoop(env.STORAGE_METADATA, env.AI);
    const status = await loop.getStatus();

    return jsonResponse({
      success: true,
      ...status,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

async function handleManifest(env: any): Promise<Response> {
  try {
    const manifest = new VersionManifest(env.STORAGE_METADATA);
    await manifest.initialize();

    return jsonResponse({
      success: true,
      currentVersion: manifest.getCurrentVersion(),
      stats: manifest.getStats(),
      history: manifest.getHistory().slice(-50),
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

async function handleHistory(env: any): Promise<Response> {
  try {
    const historyStr = await env.STORAGE_METADATA.get('imi:history');
    const history = historyStr
      ? historyStr.split('\n').filter(Boolean).map((l: string) => JSON.parse(l))
      : [];

    return jsonResponse({
      success: true,
      count: history.length,
      entries: history,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

async function handleConfig(request: Request, env: any): Promise<Response> {
  try {
    const body = await request.json() as any;
    
    // Validate config fields
    const validFields = ['maxIterationsPerCycle', 'maxRetries', 'timeBudgetMs', 'enabled'];
    const config: any = {};
    for (const field of validFields) {
      if (body[field] !== undefined) {
        config[field] = body[field];
      }
    }

    // Persist config
    await env.STORAGE_METADATA.put('imi:config', JSON.stringify(config));

    return jsonResponse({
      success: true,
      message: 'IMI configuration updated',
      config,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

async function handleSnapshot(env: any): Promise<Response> {
  try {
    const manifest = new VersionManifest(env.STORAGE_METADATA);
    await manifest.initialize();
    const snapshot = await manifest.captureSnapshot(env);

    return jsonResponse({
      success: true,
      snapshot,
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
