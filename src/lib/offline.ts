const OFFLINE_QUEUE_KEY = 'golf_offline_queue'

interface QueuedAction {
  id: string
  type: 'insert_round' | 'update_round' | 'delete_round'
  table: string
  data: Record<string, unknown>
  timestamp: number
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue()
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function getOfflineQueue(): QueuedAction[] {
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
  return raw ? JSON.parse(raw) : []
}

export function clearOfflineQueue() {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]))
}

export function getOfflineRounds(): Record<string, unknown>[] {
  const queue = getOfflineQueue()
  return queue
    .filter((a) => a.type === 'insert_round')
    .map((a) => a.data)
}
