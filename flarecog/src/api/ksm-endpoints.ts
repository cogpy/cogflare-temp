/**
 * ksm-endpoints.ts
 * 
 * REST API endpoints for the KSM Evolution Orchestrator.
 * Wires the 61-definition cognitive grammar into the FlareCog Worker
 * as observable, triggerable, and queryable HTTP endpoints.
 * 
 * Endpoints:
 *   POST /api/ksm/cycle          — Trigger one KSM evolution cycle
 *   GET  /api/ksm/self-image     — Get the current Autognosis self-image
 *   GET  /api/ksm/classification — Get full 61-table classification of all agents
 *   GET  /api/ksm/history        — Get cycle history
 *   POST /api/ksm/report-health  — Report a subsystem health metric
 *   GET  /api/ksm/table          — Get the complete 61-definition table
 */

import { KSMEvolutionOrchestrator } from '../cognitive/KSMEvolutionOrchestrator';
import { GENERATORS, COMPOSITES, CELLS } from '../cognitive/KSM61Table';
import { AGENT_CELL_ANCHORS, LINKAGE_CHAINS } from '../cognitive/KSMClassifyWeakness';

export interface KSMEnv {
  STORAGE_METADATA: KVNamespace;
  TASK_RESULTS: KVNamespace;
}

/**
 * Handle KSM-related API requests
 */
export async function handleKSMRequest(
  request: Request,
  env: KSMEnv,
  path: string
): Promise<Response> {
  const orchestrator = new KSMEvolutionOrchestrator(env.STORAGE_METADATA);

  switch (path) {
    case '/api/ksm/cycle':
      return handleRunCycle(request, orchestrator, env);
    case '/api/ksm/self-image':
      return handleGetSelfImage(orchestrator);
    case '/api/ksm/classification':
      return handleGetClassification(orchestrator);
    case '/api/ksm/history':
      return handleGetHistory(env);
    case '/api/ksm/report-health':
      return handleReportHealth(request, orchestrator);
    case '/api/ksm/table':
      return handleGetTable();
    default:
      return new Response(JSON.stringify({ error: 'KSM endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

/**
 * POST /api/ksm/cycle — Trigger one KSM evolution cycle
 */
async function handleRunCycle(
  request: Request,
  orchestrator: KSMEvolutionOrchestrator,
  env: KSMEnv
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const result = await orchestrator.runCycle(env);
    return new Response(JSON.stringify({
      success: true,
      cycle: result.cycleNumber,
      weakestAgent: result.weakestAgent,
      classification: {
        anchor: `#${result.classification.anchor_cell.definition_id} ${result.classification.anchor_cell.operator} (${result.classification.anchor_cell.composite}/${result.classification.anchor_cell.organization})`,
        repair: `#${result.classification.repair_cell.definition_id} ${result.classification.repair_cell.operator} (${result.classification.repair_cell.composite}/${result.classification.repair_cell.organization})`,
        chain: result.classification.linkage_chain,
        strategy: result.classification.strategy,
        action: result.classification.strategy_action,
      },
      preLoss: result.preLoss,
      systemHealth: result.selfImage.systemHealth,
      decision: result.decision,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/ksm/self-image — Get the current Autognosis self-image
 */
async function handleGetSelfImage(
  orchestrator: KSMEvolutionOrchestrator
): Promise<Response> {
  const selfImage = orchestrator.getSelfImage();
  return new Response(JSON.stringify({
    selfImage,
    agentAnchors: Object.entries(AGENT_CELL_ANCHORS).map(([agent, anchor]) => ({
      agent,
      composite: anchor.composite,
      organization: anchor.organization,
      cellId: CELLS[anchor.composite][anchor.organization].id,
    })),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/ksm/classification — Get full 61-table classification
 */
async function handleGetClassification(
  orchestrator: KSMEvolutionOrchestrator
): Promise<Response> {
  const classifications = orchestrator.getFullClassification();
  return new Response(JSON.stringify({
    classifications,
    linkageChains: LINKAGE_CHAINS,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/ksm/history — Get cycle history
 */
async function handleGetHistory(env: KSMEnv): Promise<Response> {
  const historyStr = await env.STORAGE_METADATA.get('ksm:cycle_history');
  const history = historyStr ? JSON.parse(historyStr) : [];
  return new Response(JSON.stringify({
    totalCycles: history.length,
    history: history.slice(-20), // last 20 cycles
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /api/ksm/report-health — Report a subsystem health metric
 */
async function handleReportHealth(
  request: Request,
  orchestrator: KSMEvolutionOrchestrator
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { agent: string; overall: number; details?: Record<string, number> };
    if (!body.agent || body.overall === undefined) {
      return new Response(JSON.stringify({ error: 'Missing agent or overall' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await orchestrator.reportHealth(
      body.agent,
      Math.max(0, Math.min(1, body.overall)),
      body.details || {}
    );

    return new Response(JSON.stringify({ success: true, agent: body.agent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/ksm/table — Get the complete 61-definition table
 */
async function handleGetTable(): Promise<Response> {
  const table = {
    generators: Object.entries(GENERATORS).map(([id, g]) => ({
      id: parseInt(id),
      level: 'generator',
      name: g.name,
      instantiation: g.instantiation,
    })),
    composites: Object.entries(COMPOSITES).map(([id, c]) => ({
      id: parseInt(id),
      level: 'composite',
      name: c.name,
      instantiation: c.instantiation,
    })),
    cells: Object.entries(CELLS).flatMap(([composite, orgs]) =>
      Object.entries(orgs).map(([org, cell]) => ({
        id: cell.id,
        level: 'cell',
        composite,
        organization: org,
        operator: cell.operator,
        instantiation: cell.instantiation,
      }))
    ).sort((a, b) => a.id - b.id),
    agentAnchors: AGENT_CELL_ANCHORS,
    linkageChains: LINKAGE_CHAINS,
    totalDefinitions: 61,
  };

  return new Response(JSON.stringify(table, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
