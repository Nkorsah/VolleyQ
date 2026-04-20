import {
  joinQueue as joinQueueRequest,
  //leaveQueue as leaveQueueRequest,
  fetchQueue,
  rotateQueue as rotateQueueRequest,
} from './api';
import type { QueueEntry, CreateQueueEntryRequest} from './api';



export async function rotateQueue(courtId: string): Promise<QueueEntry[]> {
  if (!courtId) throw new Error('courtId is required');

  return rotateQueueRequest(courtId);
}

export function getNextMatch(queue: QueueEntry[]): [QueueEntry, QueueEntry] | null {
  if (queue.length < 2) return null;
  return [queue[0], queue[1]];
}

export function isInQueue(queue: QueueEntry[], teamId: string): boolean {
  return queue.some(e => e.teamId === teamId);
}

export function getQueuePosition(queue: QueueEntry[], teamId: string): number {
  return queue.findIndex(e => e.teamId === teamId) + 1;
}