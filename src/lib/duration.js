// Wait time is measured from confirmed_at (when an order actually enters
// the queue) rather than created_at, so time spent queued during a siesta
// never counts. confirmed_at falls back to created_at for orders placed
// before this column existed, or for any normal (non-siesta) order.
export function durationMinutes(order) {
  if (!order.completed_at) return null
  const start = new Date(order.confirmed_at ?? order.created_at)
  const end = new Date(order.completed_at)
  return Math.max(0, Math.round((end - start) / 60000))
}
