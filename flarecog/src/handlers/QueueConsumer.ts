/**
 * QueueConsumer.ts
 * 
 * Unified Queue consumer handler for FlareCog.
 * Routes incoming Queue messages to the appropriate processor:
 * 
 * - COORDINATION_QUEUE → QueueGossipTransport (CRDT sync)
 * - COGNITIVE_QUEUE → MOSESEvolution (fitness evaluation, generation evolution)
 * - INFERENCE_QUEUE → PLNGroundedReasoning (validated inference)
 * - CONSOLIDATION_QUEUE → ECANFullImplementation (storage tier migration)
 * 
 * This handler is called from the Worker's queue() export.
 */

import { processGossipBatch, GossipEnvelope } from '../core/distributed/QueueGossipTransport';
import { MOSESEvolution, MOSESQueueMessage, EvaluateFitnessPayload, EvolveGenerationPayload } from '../cognitive/MOSESEvolution';

/**
 * Environment bindings needed by the queue consumer
 */
interface QueueEnv {
  ATOMSPACE: DurableObjectNamespace;
  MIND_AGENT: DurableObjectNamespace;
  CRDT_ATOMSPACE_COORDINATOR: DurableObjectNamespace;
  COGNITIVE_QUEUE: Queue;
  INFERENCE_QUEUE: Queue;
  COORDINATION_QUEUE: Queue;
  CONSOLIDATION_QUEUE: Queue;
  TASK_RESULTS: KVNamespace;
  KV_WARM_STORAGE: KVNamespace;
  STORAGE_METADATA: KVNamespace;
  R2_COLD_STORAGE: R2Bucket;
  AI: Ai;
}

interface Queue {
  send(message: unknown, options?: { contentType?: string; delaySeconds?: number }): Promise<void>;
  sendBatch(messages: Array<{ body: unknown; contentType?: string; delaySeconds?: number }>): Promise<void>;
}

interface Ai {
  run(model: string, input: unknown): Promise<unknown>;
}

interface MessageBatch<T> {
  queue: string;
  messages: Array<{
    id: string;
    timestamp: Date;
    body: T;
    ack(): void;
    retry(): void;
  }>;
}

/**
 * Main queue consumer handler
 * Routes messages based on the queue they arrived from
 */
export async function handleQueueBatch(
  batch: MessageBatch<unknown>,
  env: QueueEnv
): Promise<void> {
  const queueName = batch.queue;

  switch (queueName) {
    case 'flarecog-coordination-queue':
      await handleCoordinationQueue(batch as MessageBatch<GossipEnvelope>, env);
      break;

    case 'flarecog-cognitive-queue':
      await handleCognitiveQueue(batch as MessageBatch<MOSESQueueMessage>, env);
      break;

    case 'flarecog-inference-queue':
      await handleInferenceQueue(batch, env);
      break;

    case 'flarecog-consolidation-queue':
      await handleConsolidationQueue(batch, env);
      break;

    default:
      // Unknown queue — ack all messages to prevent infinite retry
      for (const msg of batch.messages) {
        console.warn(`Unknown queue: ${queueName}, message: ${msg.id}`);
        msg.ack();
      }
  }
}

/**
 * Handle COORDINATION_QUEUE messages (CRDT gossip)
 */
async function handleCoordinationQueue(
  batch: MessageBatch<GossipEnvelope>,
  env: QueueEnv
): Promise<void> {
  const messages = batch.messages.map(msg => ({
    body: msg.body,
    ack: () => msg.ack(),
    retry: () => msg.retry(),
  }));

  const result = await processGossipBatch(
    messages,
    env.CRDT_ATOMSPACE_COORDINATOR
  );

  console.log(
    `Gossip batch processed: ${result.processed} ok, ${result.retried} retried, ${result.discarded} discarded`
  );
}

/**
 * Handle COGNITIVE_QUEUE messages (MOSES evolution)
 */
async function handleCognitiveQueue(
  batch: MessageBatch<MOSESQueueMessage>,
  env: QueueEnv
): Promise<void> {
  const moses = new MOSESEvolution(
    env.COGNITIVE_QUEUE as unknown as { send: any; sendBatch: any },
    env.TASK_RESULTS as unknown as { get: any; put: any; delete: any }
  );

  for (const msg of batch.messages) {
    try {
      const queueMsg = msg.body;

      switch (queueMsg.type) {
        case 'evaluate_fitness': {
          const payload = queueMsg.payload as EvaluateFitnessPayload;
          const fitness = moses.evaluateFitness(payload.program, payload.fitnessSpec);

          // Store fitness result
          await env.TASK_RESULTS.put(
            `moses:fitness:${payload.programId}`,
            JSON.stringify({ fitness, generation: payload.generation }),
            { expirationTtl: 3600 }
          );

          msg.ack();
          break;
        }

        case 'evolve_generation': {
          const payload = queueMsg.payload as EvolveGenerationPayload;

          // Extract evolution ID from the first program's ID
          const evolutionId = payload.population[0]?.id?.split('-')[0] || 'unknown';

          await moses.evolveNextGeneration(
            evolutionId,
            payload.population,
            payload.fitnessSpec,
            payload.generation
          );

          msg.ack();
          break;
        }

        case 'store_result': {
          // Store evolved program in AtomSpace
          const payload = queueMsg.payload as any;
          const atomSpaceId = env.ATOMSPACE.idFromName(payload.atomSpaceId || 'primary');
          const atomSpaceStub = env.ATOMSPACE.get(atomSpaceId);

          const atomRepr = moses.programToAtomSpace(payload.program);
          await atomSpaceStub.fetch(
            new Request('http://internal/atomspace/node', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(atomRepr),
            })
          );

          msg.ack();
          break;
        }

        default:
          msg.ack();
      }
    } catch (error) {
      console.error(`MOSES queue error: ${error}`);
      msg.retry();
    }
  }
}

/**
 * Handle INFERENCE_QUEUE messages (PLN-grounded reasoning)
 */
async function handleInferenceQueue(
  batch: MessageBatch<unknown>,
  env: QueueEnv
): Promise<void> {
  for (const msg of batch.messages) {
    try {
      const payload = msg.body as {
        type: string;
        query: string;
        atomSpaceId?: string;
        requestId: string;
      };

      if (payload.type === 'grounded_inference') {
        // Forward to AtomSpace DO for PLN-grounded reasoning
        const atomSpaceId = env.ATOMSPACE.idFromName(payload.atomSpaceId || 'primary');
        const atomSpaceStub = env.ATOMSPACE.get(atomSpaceId);

        const response = await atomSpaceStub.fetch(
          new Request('http://internal/api/cognitive/grounded-reason', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: payload.query }),
          })
        );

        if (response.ok) {
          const result = await response.json();
          // Store result for retrieval
          await env.TASK_RESULTS.put(
            `inference:${payload.requestId}`,
            JSON.stringify(result),
            { expirationTtl: 3600 }
          );
        }

        msg.ack();
      } else {
        msg.ack();
      }
    } catch (error) {
      console.error(`Inference queue error: ${error}`);
      msg.retry();
    }
  }
}

/**
 * Handle CONSOLIDATION_QUEUE messages (ECAN storage tier migration)
 */
async function handleConsolidationQueue(
  batch: MessageBatch<unknown>,
  env: QueueEnv
): Promise<void> {
  for (const msg of batch.messages) {
    try {
      const payload = msg.body as {
        type: string;
        atomId: string;
        fromTier: 'hot' | 'warm' | 'cold';
        toTier: 'hot' | 'warm' | 'cold';
        atomData?: string;
      };

      switch (payload.type) {
        case 'migrate_to_warm': {
          // Move atom from hot (DO) to warm (KV)
          if (payload.atomData) {
            await env.KV_WARM_STORAGE.put(
              `atom:${payload.atomId}`,
              payload.atomData
            );
          }
          msg.ack();
          break;
        }

        case 'migrate_to_cold': {
          // Move atom from warm (KV) to cold (R2)
          const warmData = payload.atomData || await env.KV_WARM_STORAGE.get(`atom:${payload.atomId}`);
          if (warmData) {
            await env.R2_COLD_STORAGE.put(`atom/${payload.atomId}.json`, warmData);
            await env.KV_WARM_STORAGE.delete(`atom:${payload.atomId}`);
          }
          msg.ack();
          break;
        }

        case 'promote_to_hot': {
          // Retrieve from cold/warm and send to AtomSpace DO
          let atomData = await env.KV_WARM_STORAGE.get(`atom:${payload.atomId}`);
          if (!atomData) {
            const r2Obj = await env.R2_COLD_STORAGE.get(`atom/${payload.atomId}.json`);
            if (r2Obj) atomData = await r2Obj.text();
          }

          if (atomData) {
            const atomSpaceId = env.ATOMSPACE.idFromName('primary');
            const atomSpaceStub = env.ATOMSPACE.get(atomSpaceId);
            await atomSpaceStub.fetch(
              new Request('http://internal/atomspace/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: atomData,
              })
            );
          }
          msg.ack();
          break;
        }

        default:
          msg.ack();
      }
    } catch (error) {
      console.error(`Consolidation queue error: ${error}`);
      msg.retry();
    }
  }
}
