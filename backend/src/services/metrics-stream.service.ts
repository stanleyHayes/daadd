import { Server as SocketServer } from 'socket.io';
import { Campaign } from '../models';
import { campaignTotals } from './campaign-metrics.service';
import { Types } from 'mongoose';

/**
 * Live campaign metrics over the socket that already carries chat
 * (SPECIFICATION.md §12 Phase 2).
 *
 * A dashboard viewing a campaign joins `campaign:<id>` and receives a metrics
 * payload whenever that campaign records an event. The push is debounced per
 * campaign: an active campaign can log hundreds of impressions a second, and a
 * counter that repaints that often is unreadable and expensive. One update per
 * window is as much as a human can read anyway.
 *
 * Only viewers who passed the socket's JWT handshake and can read the campaign
 * are in the room, so the aggregate never reaches someone who could not already
 * fetch it over REST.
 */

const PUSH_INTERVAL_MS = 3000;

/** Campaigns with events since the last flush. */
const dirty = new Set<string>();
let timer: NodeJS.Timeout | null = null;

export interface LiveMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  spend: number;
  updatedAt: string;
}

async function computeMetrics(campaignId: string): Promise<LiveMetrics | null> {
  if (!Types.ObjectId.isValid(campaignId)) return null;

  // Same aggregation the REST endpoints use, so a live tile and a page refresh
  // can never disagree about the same campaign.
  const [totals, campaign] = await Promise.all([
    campaignTotals(campaignId),
    Campaign.findById(campaignId).select('budget_spent').lean(),
  ]);

  return {
    campaignId,
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: totals.conversions,
    ctr: totals.ctr,
    spend: campaign?.budget_spent ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

async function flush(io: SocketServer) {
  const pending = [...dirty];
  dirty.clear();
  timer = null;

  for (const campaignId of pending) {
    const room = `campaign:${campaignId}`;
    // Skip the aggregation entirely when nobody is watching.
    if (!io.sockets.adapter.rooms.get(room)?.size) continue;

    try {
      const metrics = await computeMetrics(campaignId);
      if (metrics) io.to(room).emit('campaign:metrics', metrics);
    } catch (error) {
      // A metrics push failing must never take down event ingestion.
      console.error(`[metrics-stream] ${campaignId}:`, (error as Error).message);
    }
  }
}

/**
 * Called from the event ingestion path. Cheap and synchronous — it only marks
 * the campaign dirty and makes sure a flush is scheduled.
 */
export function markCampaignDirty(io: SocketServer | undefined, campaignId: string | undefined) {
  if (!io || !campaignId) return;
  dirty.add(String(campaignId));
  if (!timer) timer = setTimeout(() => void flush(io), PUSH_INTERVAL_MS);
}

/** Wires the room join/leave handlers onto a connected socket. */
export function registerMetricsHandlers(io: SocketServer, socket: import('socket.io').Socket) {
  socket.on('campaign:watch', async (campaignId: unknown) => {
    if (typeof campaignId !== 'string' || !Types.ObjectId.isValid(campaignId)) return;

    // Only stream a campaign this socket's user is allowed to read. Without
    // this the room name alone would be enough to watch anyone's numbers.
    const campaign = await Campaign.findById(campaignId).select('owner').lean();
    if (!campaign) return;

    const userId = String(socket.data.userId);
    const isOwner = String(campaign.owner) === userId;
    if (!isOwner && socket.data.role !== 'admin') return;

    socket.join(`campaign:${campaignId}`);
    const metrics = await computeMetrics(campaignId);
    if (metrics) socket.emit('campaign:metrics', metrics);
  });

  socket.on('campaign:unwatch', (campaignId: unknown) => {
    if (typeof campaignId === 'string') socket.leave(`campaign:${campaignId}`);
  });
}
