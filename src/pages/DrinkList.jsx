import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import QuantityStepper from '../components/QuantityStepper'
import { useDrinksRealtime } from '../hooks/useDrinksRealtime'
import { useCategories } from '../hooks/useCategories'
import { useOrderDraft } from '../context/OrderDraftContext'

function DrinkRow({ drink, checked, quantity, option, onToggle, onQtyChange, onOptionChange }) {
  const soldOut = drink.sold_out
  const choices = drink.option_choices
  const hasChoices = Array.isArray(choices) && choices.length > 0
  const optionLabel = drink.option_label || 'option'
  const needsOption = checked && hasChoices && !option

  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-soft ${soldOut ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={drink.name}
          disabled={soldOut}
          onClick={onToggle}
          className={`tap-highlight-none flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
            checked ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
          } ${soldOut ? 'cursor-not-allowed' : ''}`}
        >
          {checked && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>

        <button
          type="button"
          disabled={soldOut}
          onClick={onToggle}
          className="min-w-0 flex-1 py-1 text-left tap-highlight-none"
        >
          <p className="font-semibold text-slate-800">
            {drink.name}
            {soldOut && <span className="ml-2 text-xs font-medium text-red-500">Sold out</span>}
          </p>
          {drink.description && (
            <p className="mt-0.5 text-sm text-slate-500">{drink.description}</p>
          )}
        </button>

        <QuantityStepper
          value={quantity || 1}
          onChange={onQtyChange}
          disabled={soldOut || !checked}
        />
      </div>

      {checked && hasChoices && (
        <select
          value={option || ''}
          onChange={(e) => onOptionChange(e.target.value)}
          className={`mt-3 min-h-[44px] w-full rounded-xl border bg-white p-3 text-base text-slate-700 focus:outline-none focus:ring-2 ${
            needsOption
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
          }`}
        >
          <option value="" disabled>
            Select your {optionLabel}
          </option>
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function DrinkList() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { drinks, loading } = useDrinksRealtime()
  const { categories } = useCategories()
  const { setDraft } = useOrderDraft()

  const [selected, setSelected] = useState({})
  const [ice, setIce] = useState(false)
  const [comment, setComment] = useState('')

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  )

  const categoryDrinks = useMemo(
    () => drinks.filter((d) => d.category_id === categoryId),
    [drinks, categoryId]
  )

  const selectedCount = Object.keys(selected).length

  const hasIncompleteOptions = Object.entries(selected).some(([id, sel]) => {
    const drink = drinks.find((d) => d.id === id)
    const hasChoices = Array.isArray(drink?.option_choices) && drink.option_choices.length > 0
    return hasChoices && !sel.option
  })

  function toggle(drink) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[drink.id]) {
        delete next[drink.id]
      } else {
        next[drink.id] = { quantity: 1, option: '' }
      }
      return next
    })
  }

  function setQty(drinkId, qty) {
    setSelected((prev) => ({ ...prev, [drinkId]: { ...prev[drinkId], quantity: qty } }))
  }

  function setOption(drinkId, option) {
    setSelected((prev) => ({ ...prev, [drinkId]: { ...prev[drinkId], option } }))
  }

  function handleProceed() {
    const categoryName = currentCategory?.name ?? 'Other'
    const items = Object.entries(selected).map(([id, sel]) => {
      const drink = drinks.find((d) => d.id === id)
      const name = sel.option ? `${drink.name} — ${sel.option}` : drink.name
      return { name, category: categoryName, quantity: sel.quantity }
    })
    setDraft({ category: categoryId, items, ice, comment: comment.trim() })
    navigate('/checkout')
  }

  return (
    <div className="min-h-dvh bg-sky-50">
      <PageHeader title={currentCategory?.name ?? ''} onBack={() => navigate('/order')} />

      <div className="flex flex-col gap-3 px-4 pt-2">
        {loading && <p className="py-8 text-center text-slate-500">Loading drinks…</p>}

        {!loading && categoryDrinks.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-soft">
            Nothing here yet — check back soon.
          </p>
        )}

        {categoryDrinks.map((drink) => (
          <DrinkRow
            key={drink.id}
            drink={drink}
            checked={Boolean(selected[drink.id])}
            quantity={selected[drink.id]?.quantity}
            option={selected[drink.id]?.option}
            onToggle={() => toggle(drink)}
            onQtyChange={(qty) => setQty(drink.id, qty)}
            onOptionChange={(option) => setOption(drink.id, option)}
          />
        ))}

        {categoryDrinks.length > 0 && (
          <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-soft">
            <button
              type="button"
              onClick={() => setIce((v) => !v)}
              className="tap-highlight-none flex min-h-[44px] items-center gap-3 text-left"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                  ice ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
                }`}
              >
                {ice && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="font-semibold text-slate-700">🧊 Ice</span>
            </button>

            <label className="flex flex-col gap-2">
              <span className="font-semibold text-slate-700">
                Comments for the bartender
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything extra or special requests? (Optional)"
                rows={2}
                className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>
          </div>
        )}

        {hasIncompleteOptions && (
          <p className="text-center text-sm font-medium text-red-500">
            Pick an option for the highlighted drink(s) above before continuing.
          </p>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 border-t border-sky-100 bg-sky-50/95 px-4 pt-4 pb-safe-b backdrop-blur">
        <Button
          onClick={handleProceed}
          disabled={selectedCount === 0 || hasIncompleteOptions}
          className="w-full text-lg"
        >
          Proceed to checkout{selectedCount > 0 ? ` (${selectedCount})` : ''}
        </Button>
      </div>
    </div>
  )
}
