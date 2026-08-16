import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { priorityLabel } from '../../lib/priority'
import { durationMinutes } from '../../lib/duration'
import { useDrinksRealtime } from '../../hooks/useDrinksRealtime'
import { useCategories } from '../../hooks/useCategories'
import Button from '../../components/Button'
import EditOrderModal from '../../components/EditOrderModal'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { drinks } = useDrinksRealtime()
  const { categories } = useCategories()

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
      if (!isMounted) return
      if (!error) setOrders(data ?? [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('order-history-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new.status !== 'completed') return
          setOrders((current) => {
            if (current.some((o) => o.id === payload.new.id)) {
              return current.map((o) => (o.id === payload.new.id ? payload.new : o))
            }
            return [payload.new, ...current]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((current) => current.filter((o) => o.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleDelete(order) {
    if (!window.confirm(`Delete ${order.customer_name}'s order from history? This can't be undone.`))
      return
    setDeletingId(order.id)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) {
      setDeletingId(null)
    }
  }

  const average =
    orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + (durationMinutes(o) ?? 0), 0) / orders.length)
      : null

  return (
    <div className="flex flex-col gap-3 px-4 pt-2">
      <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Average completion time
        </p>
        <p className="mt-1 text-3xl font-extrabold text-sky-600">
          {average === null ? '—' : `${average} min`}
        </p>
      </div>

      {loading && <p className="py-8 text-center text-slate-500">Loading history…</p>}

      {!loading && orders.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-soft">
          No completed orders yet.
        </p>
      )}

      {orders.map((order) => {
        const confirmedAt = order.confirmed_at ?? order.created_at
        const delayedBySiesta =
          Math.abs(new Date(confirmedAt) - new Date(order.created_at)) > 60000
        const tip = Number(order.tip ?? 0)
        const deleting = deletingId === order.id

        return (
          <div key={order.id} className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-800">{order.customer_name}</p>
                <p className="text-sm text-slate-500">{priorityLabel(order.priority)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-sky-600">
                  {durationMinutes(order)} min
                </p>
                {tip > 0 && (
                  <p className="text-xs font-semibold text-amber-600">+€{tip.toFixed(2)} tip</p>
                )}
              </div>
            </div>

            {order.location && (
              <p className="mt-1 text-sm font-medium text-slate-600">📍 {order.location}</p>
            )}

            <ul className="mt-2 flex flex-col gap-1">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-semibold">×{item.quantity}</span>
                </li>
              ))}
            </ul>

            {(order.ice || order.comment) && (
              <p className="mt-2 text-sm text-slate-500">
                {order.ice && <span>🧊 Ice</span>}
                {order.ice && order.comment && <span> · </span>}
                {order.comment && <span>&ldquo;{order.comment}&rdquo;</span>}
              </p>
            )}

            <p className="mt-2 text-xs text-slate-400">
              Ordered {formatTime(order.created_at)} · Confirmed {formatTime(confirmedAt)}
              {delayedBySiesta && ' 😴'} · Completed {formatTime(order.completed_at)}
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={deleting}
                onClick={() => setEditingOrder(order)}
                className="flex-1"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleting}
                onClick={() => handleDelete(order)}
                className="flex-1"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )
      })}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          drinks={drinks}
          categories={categories}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  )
}
