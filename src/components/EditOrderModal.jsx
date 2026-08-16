import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import QuantityStepper from './QuantityStepper'
import { supabase } from '../lib/supabaseClient'

export default function EditOrderModal({ order, drinks, categories, onClose }) {
  const [items, setItems] = useState(
    order.items.map((item, i) => ({ ...item, _key: `existing-${i}` }))
  )
  const [comment, setComment] = useState(order.comment ?? '')
  const [addDrinkId, setAddDrinkId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function updateQty(key, qty) {
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, quantity: qty } : it)))
  }

  function updateName(key, name) {
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, name } : it)))
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it._key !== key))
  }

  function addItem() {
    const drink = drinks.find((d) => d.id === addDrinkId)
    if (!drink) return
    const category = categories.find((c) => c.id === drink.category_id)

    setItems((prev) => {
      const existing = prev.find((it) => it.name === drink.name)
      if (existing) {
        return prev.map((it) =>
          it._key === existing._key ? { ...it, quantity: it.quantity + 1 } : it
        )
      }
      return [
        ...prev,
        {
          _key: `new-${drink.id}-${Date.now()}`,
          name: drink.name,
          category: category?.name ?? 'Other',
          quantity: 1,
        },
      ]
    })
    setAddDrinkId('')
  }

  async function handleSave() {
    if (items.length === 0) {
      setError('An order needs at least one drink — use Delete instead if the whole order should go.')
      return
    }
    setSaving(true)
    setError(null)

    const cleanItems = items.map(({ _key, ...rest }) => rest)
    const { error: saveError } = await supabase
      .from('orders')
      .update({ items: cleanItems, comment: comment.trim() || null })
      .eq('id', order.id)

    setSaving(false)
    if (saveError) {
      setError("Couldn't save changes — try again.")
      return
    }
    onClose()
  }

  return (
    <Modal title="Edit order" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item._key} className="flex items-center gap-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateName(item._key, e.target.value)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-200 p-2 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <QuantityStepper value={item.quantity} onChange={(q) => updateQty(item._key, q)} />
              <button
                type="button"
                aria-label="Remove item"
                onClick={() => removeItem(item._key)}
                className="tap-highlight-none flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-red-500 active:bg-red-50"
              >
                🗑️
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400">No drinks left on this order.</p>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={addDrinkId}
            onChange={(e) => setAddDrinkId(e.target.value)}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white p-2 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="">Add a drink…</option>
            {categories.map((cat) => {
              const catDrinks = drinks.filter((d) => d.category_id === cat.id)
              if (catDrinks.length === 0) return null
              return (
                <optgroup key={cat.id} label={`${cat.emoji} ${cat.name}`}>
                  {catDrinks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.sold_out ? ' (sold out)' : ''}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
          <Button type="button" variant="secondary" disabled={!addDrinkId} onClick={addItem}>
            Add
          </Button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">Comment</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <div className="mt-1 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={handleSave} className="flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
