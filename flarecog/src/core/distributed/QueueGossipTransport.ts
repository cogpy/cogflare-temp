/**
 * QueueGossipTransport.ts
 * 
 * Replaces direct DO-to-DO gossip with Cloudflare Queues for resilient
 * message delivery. This ensures gossip messages are not lost when a
 * peer DO is unavailable, and enables automatic retry with backoff.
 * 
 * Architecture:
 * - COORDINATION_QUEUE: carries gossip deltas between CRDT peers
 * - Dead letter queue (flarecog-dlq): captures permanently failed messages
 * - Each message is tagged with source/target peer IDs and vector clock
 * 
 * This implements Priority 2 from the FlareCog roadmap.
 */

import { CRDTOperation, VectorClock } from './CRDTAtomSpace';

/**
 * Gossip message envelope for Queue transport
 */
export interface GossipEnvelope {
  type: 'gossip_delta' | 'sync_request' | 'sync_response' | 'heartbeat' | 'peer_discovery';
  sourcePeerId: string;
  targetPeerId: string;
  vectorClock: VectorClock;
  timestamp: number;
  messageId: string;
  payload: GossipPayload;
}

export type GossipPayload =
  | GossipDeltaPayload
  | SyncRequestPayload
  | SyncResponsePayload
  | HeartbeatPayload
  | PeerDiscoveryPayload;

export interface GossipDeltaPayload {
  kind: 'delta';
  operations: CRDTOperation[];
  causalDependencies: VectorClock;
}

export interface SyncRequestPayload {
  kind: 'sync_request';
  requestId: string;
  sinceVectorClock: VectorClock;
  maxOperations: number;
}

export interface SyncResponsePayload {
  kind: 'sync_response';
  requestId: string;
  operations: CRDTOperation[];
  hasMore: boolean;
  continuationToken?: string;
}

export interface HeartbeatPayload {
  kind: 'heartbeat';
  atomCount: number;
  memoryUsage: number;
  health: 'healthy' | 'degraded' | 'overloaded';
}

export interface PeerDiscoveryPayload {
  kind: 'peer_discovery';
  knownPeers: string[];
  capabilities: string[];
}

/**
 * Queue binding interface
 */
interface QueueBinding {
  send(message: unknown, options?: { contentType?: string; delaySeconds?: number }): Promise<void>;
  sendBatch(messages: Array<{ body: unknown; contentType?: string; delaySeconds?: number }>): Promise<void>;
}

/**
 * Configuration for the Queue Gossip Transport
 */
export interface QueueGossipConfig {
  /** Maximum operations per gossip message to stay within Queue size limits */
  maxOpsPerMessage: number;
  /** Delay in seconds before delivering gossip (allows batching) */
  gossipDelaySeconds: number;
  /** Maximum retry attempts before sending to DLQ */
  maxRetries: number;
  /** Heartbeat interval in seconds */
  heartbeatIntervalSeconds: number;
  /** Maximum age of a gossip message before it's considered stale (ms) */
  staleThresholdMs: number;
}

const DEFAULT_CONFIG: QueueGossipConfig = {
  maxOpsPerMessage: 50,
  gossipDelaySeconds: 1,
  maxRetries: 3,
  heartbeatIntervalSeconds: 30,
  staleThresholdMs: 60000,
};

/**
 * QueueGossipTransport
 * 
 * Provides resilient gossip messaging between CRDT AtomSpace peers
 * using Cloudflare Queues. Messages are delivered at-least-once with
 * automatic retry, and CRDT operations are inherently idempotent.
 */
export class QueueGossipTransport {
  private peerId: string;
  private queue: QueueBinding;
  private config: QueueGossipConfig;
  private messageCounter: number = 0;
  private pendingSyncRequests: Map<string, {
    resolve: (ops: CRDTOperation[]) => void;
    reject: (err: Error) => void;
    timeout: number;
  }> = new Map();

  constructor(peerId: string, queue: QueueBinding, config?: Partial<QueueGossipConfig>) {
    this.peerId = peerId;
    this.queue = queue;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a unique message ID for deduplication
   */
  private generateMessageId(): string {
    this.messageCounter++;
    return `${this.peerId}-${Date.now()}-${this.messageCounter}`;
  }

  /**
   * Send a gossip delta to a specific peer via Queue
   * Operations are chunked if they exceed maxOpsPerMessage
   */
  async sendDelta(
    targetPeerId: string,
    operations: CRDTOperation[],
    vectorClock: VectorClock
  ): Promise<void> {
    // Chunk operations to stay within Queue message size limits
    const chunks = this.chunkOperations(operations);

    if (chunks.length === 1) {
      // Single message - send directly
      const envelope: GossipEnvelope = {
        type: 'gossip_delta',
        sourcePeerId: this.peerId,
        targetPeerId,
        vectorClock,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
        payload: {
          kind: 'delta',
          operations: chunks[0],
          causalDependencies: vectorClock,
        },
      };
      await this.queue.send(envelope, { delaySeconds: this.config.gossipDelaySeconds });
    } else {
      // Multiple chunks - send as batch
      const messages = chunks.map((chunk) => ({
        body: {
          type: 'gossip_delta' as const,
          sourcePeerId: this.peerId,
          targetPeerId,
          vectorClock,
          timestamp: Date.now(),
          messageId: this.generateMessageId(),
          payload: {
            kind: 'delta' as const,
            operations: chunk,
            causalDependencies: vectorClock,
          },
        },
        delaySeconds: this.config.gossipDelaySeconds,
      }));
      await this.queue.sendBatch(messages);
    }
  }

  /**
   * Broadcast a gossip delta to all known peers
   */
  async broadcastDelta(
    peerIds: string[],
    operations: CRDTOperation[],
    vectorClock: VectorClock
  ): Promise<void> {
    const messages = peerIds
      .filter(id => id !== this.peerId) // Don't send to self
      .flatMap(targetPeerId => {
        const chunks = this.chunkOperations(operations);
        return chunks.map(chunk => ({
          body: {
            type: 'gossip_delta' as const,
            sourcePeerId: this.peerId,
            targetPeerId,
            vectorClock,
            timestamp: Date.now(),
            messageId: this.generateMessageId(),
            payload: {
              kind: 'delta' as const,
              operations: chunk,
              causalDependencies: vectorClock,
            },
          } as GossipEnvelope,
          delaySeconds: this.config.gossipDelaySeconds,
        }));
      });

    // Cloudflare Queues supports batch of up to 100 messages
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      await this.queue.sendBatch(batch);
    }
  }

  /**
   * Send a sync request to a peer (request missing operations)
   */
  async requestSync(
    targetPeerId: string,
    sinceVectorClock: VectorClock,
    maxOperations: number = 100
  ): Promise<string> {
    const requestId = this.generateMessageId();
    const envelope: GossipEnvelope = {
      type: 'sync_request',
      sourcePeerId: this.peerId,
      targetPeerId,
      vectorClock: sinceVectorClock,
      timestamp: Date.now(),
      messageId: requestId,
      payload: {
        kind: 'sync_request',
        requestId,
        sinceVectorClock,
        maxOperations,
      },
    };
    await this.queue.send(envelope);
    return requestId;
  }

  /**
   * Send a sync response back to a requesting peer
   */
  async respondToSync(
    targetPeerId: string,
    requestId: string,
    operations: CRDTOperation[],
    vectorClock: VectorClock,
    hasMore: boolean,
    continuationToken?: string
  ): Promise<void> {
    const envelope: GossipEnvelope = {
      type: 'sync_response',
      sourcePeerId: this.peerId,
      targetPeerId,
      vectorClock,
      timestamp: Date.now(),
      messageId: this.generateMessageId(),
      payload: {
        kind: 'sync_response',
        requestId,
        operations,
        hasMore,
        continuationToken,
      },
    };
    await this.queue.send(envelope);
  }

  /**
   * Send a heartbeat to all peers
   */
  async sendHeartbeat(
    peerIds: string[],
    atomCount: number,
    memoryUsage: number,
    health: 'healthy' | 'degraded' | 'overloaded'
  ): Promise<void> {
    const messages = peerIds
      .filter(id => id !== this.peerId)
      .map(targetPeerId => ({
        body: {
          type: 'heartbeat' as const,
          sourcePeerId: this.peerId,
          targetPeerId,
          vectorClock: {} as VectorClock,
          timestamp: Date.now(),
          messageId: this.generateMessageId(),
          payload: {
            kind: 'heartbeat' as const,
            atomCount,
            memoryUsage,
            health,
          },
        } as GossipEnvelope,
        delaySeconds: 0,
      }));

    if (messages.length > 0) {
      for (let i = 0; i < messages.length; i += 100) {
        await this.queue.sendBatch(messages.slice(i, i + 100));
      }
    }
  }

  /**
   * Announce this peer to the network for discovery
   */
  async announcePeer(
    peerIds: string[],
    knownPeers: string[],
    capabilities: string[]
  ): Promise<void> {
    const messages = peerIds
      .filter(id => id !== this.peerId)
      .map(targetPeerId => ({
        body: {
          type: 'peer_discovery' as const,
          sourcePeerId: this.peerId,
          targetPeerId,
          vectorClock: {} as VectorClock,
          timestamp: Date.now(),
          messageId: this.generateMessageId(),
          payload: {
            kind: 'peer_discovery' as const,
            knownPeers,
            capabilities,
          },
        } as GossipEnvelope,
        delaySeconds: 0,
      }));

    if (messages.length > 0) {
      await this.queue.sendBatch(messages);
    }
  }

  /**
   * Process an incoming gossip envelope (called from Queue consumer)
   * Returns true if the message was for this peer, false if it should be re-routed
   */
  isForThisPeer(envelope: GossipEnvelope): boolean {
    return envelope.targetPeerId === this.peerId;
  }

  /**
   * Check if a message is stale (too old to process)
   */
  isStale(envelope: GossipEnvelope): boolean {
    return (Date.now() - envelope.timestamp) > this.config.staleThresholdMs;
  }

  /**
   * Chunk operations into groups that fit within Queue message size limits
   * Each message should be < 128KB (Cloudflare Queue limit)
   */
  private chunkOperations(operations: CRDTOperation[]): CRDTOperation[][] {
    if (operations.length <= this.config.maxOpsPerMessage) {
      return [operations];
    }

    const chunks: CRDTOperation[][] = [];
    for (let i = 0; i < operations.length; i += this.config.maxOpsPerMessage) {
      chunks.push(operations.slice(i, i + this.config.maxOpsPerMessage));
    }
    return chunks;
  }

  /**
   * Get transport statistics
   */
  getStats(): { messagesSent: number; peerId: string; config: QueueGossipConfig } {
    return {
      messagesSent: this.messageCounter,
      peerId: this.peerId,
      config: this.config,
    };
  }
}

/**
 * Queue Consumer Handler for Gossip Messages
 * 
 * This function processes incoming gossip messages from the COORDINATION_QUEUE.
 * It should be called from the Worker's queue() handler.
 */
export async function processGossipBatch(
  batch: Array<{ body: GossipEnvelope; ack: () => void; retry: () => void }>,
  coordinatorDO: DurableObjectNamespace,
  config?: Partial<QueueGossipConfig>
): Promise<{ processed: number; retried: number; discarded: number }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let processed = 0;
  let retried = 0;
  let discarded = 0;

  for (const message of batch) {
    const envelope = message.body;

    // Discard stale messages
    if ((Date.now() - envelope.timestamp) > fullConfig.staleThresholdMs) {
      message.ack(); // Don't retry stale messages
      discarded++;
      continue;
    }

    try {
      // Route message to the target peer's Durable Object
      const targetId = coordinatorDO.idFromName(envelope.targetPeerId);
      const targetStub = coordinatorDO.get(targetId);

      // Forward the gossip message to the target DO
      const response = await targetStub.fetch(
        new Request('http://internal/gossip/receive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
        })
      );

      if (response.ok) {
        message.ack();
        processed++;
      } else if (response.status >= 500) {
        // Server error - retry
        message.retry();
        retried++;
      } else {
        // Client error - don't retry
        message.ack();
        discarded++;
      }
    } catch (error) {
      // Network error or DO unavailable - retry
      message.retry();
      retried++;
    }
  }

  return { processed, retried, discarded };
}
