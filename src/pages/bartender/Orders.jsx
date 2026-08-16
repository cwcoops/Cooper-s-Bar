import { useState } from 'react'
import { usePendingOrders } from '../../context/PendingOrdersContext'
import { useDrinksRealtime } from '../../hooks/useDrinksRealtime'
import { useCategories } from '../../hooks/useCategories'
import { supabase } from '../../lib/supabaseClient'
import { priorityLabel } from '../../lib/priority'
import Button from '../../components/Button'
import EditOrderModal from '../../components/EditOrderModal'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function OrderCard({ order, onEdit }) {
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isImmediate = order.priority === 'immediate'

  async function handleComplete() {
    setCompleting(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', order.id)
    if (error) {
      setCompleting(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${order.customer_name}'s order? This can't be undone.`)) return
    setDeleting(true)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) {
      setDeleting(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
        isImmediate ? 'border-red-300 bg-red-50' : 'border-transparent bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-800">{order.customer_name}</p>
          <p
            className={`text-sm font-semibold ${
              isImmediate ? 'text-red-600' : 'text-sky-600'
            }`}
          >
            {isImmediate && '🔥 '}
            {priorityLabel(order.priority)}
          </p>
        </div>
        <p className="shrink-0 text-sm text-slate-400">{formatTime(order.created_at)}</p>
      </div>

      {order.location && (
        <p className="mt-1 text-sm font-medium text-slate-600">📍 {order.location}</p>
      )}

      {!order.confirmed_at && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
          😴 Queued — barman&apos;s on siesta
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-1">
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

      <Button
        onClick={handleComplete}
        disabled={completing || deleting}
        variant="secondary"
        className="mt-3 w-full"
      >
        {completing ? 'Completing…' : 'Complete'}
      </Button>

      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={deleting}
          onClick={() => onEdit(order)}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={deleting}
          onClick={handleDelete}
          className="flex-1"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </div>
  )
}

export default function Orders() {
  const { orders, loading } = usePendingOrders()
  const { drinks } = useDrinksRealtime()
  const { categories } = useCategories()
  const [editingOrder, setEditingOrder] = useState(null)

  return (
    <div className="flex flex-col gap-3 px-4 pt-2">
      {loading && <p className="py-8 text-center text-slate-500">Loading orders…</p>}

      {!loading && orders.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-soft">
          No pending orders — all caught up 🎉
        </p>
      )}

      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onEdit={setEditingOrder} />
      ))}

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
