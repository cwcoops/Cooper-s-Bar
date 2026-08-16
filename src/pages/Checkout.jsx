import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import SiestaBanner from '../components/SiestaBanner'
import { useOrderDraft } from '../context/OrderDraftContext'
import { supabase } from '../lib/supabaseClient'
import { PRIORITIES, DEFAULT_PRIORITY } from '../lib/priority'

const TIP_PRESETS = [0, 1, 2, 5, 10]

const NAME_OPTIONS = [
  'Barman',
  'Lovely lady',
  'Other Lovely lady',
  'New Lovely lady',
  'Big gorilla',
  'Silly salmon boy',
  'Little hairy man',
  'Little Lady',
  "Noah's good girl",
  'Boldy',
  'Liz',
  'Double A warrior',
  'Nibbles',
  'Other',
]

const LOCATION_OPTIONS = [
  'Pool',
  'Poolside / sun loungers',
  'Downstairs indoors',
  'Dart board / outdoor table',
  'Kitchen downstairs',
  'Kitchen upstairs',
  'Balcony upstairs',
  'Lounge upstairs',
  'Other',
]

export default function Checkout() {
  const navigate = useNavigate()
  const { draft, clearDraft } = useOrderDraft()

  const [name, setName] = useState('')
  const [otherName, setOtherName] = useState('')
  const [location, setLocation] = useState('')
  const [otherLocation, setOtherLocation] = useState('')
  const [priority, setPriority] = useState(DEFAULT_PRIORITY)
  const [tip, setTip] = useState(0)
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [customTip, setCustomTip] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!draft.items || draft.items.length === 0) {
      navigate('/order', { replace: true })
    }
  }, [draft.items, navigate])

  const finalName = name === 'Other' ? otherName.trim() : name
  const finalLocation = location === 'Other' ? otherLocation.trim() : location
  const effectiveTip = showCustomTip ? Math.max(0, parseFloat(customTip) || 0) : tip
  const canSubmit = Boolean(finalName) && Boolean(finalLocation) && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { error: submitError } = await supabase.from('orders').insert({
      customer_name: finalName,
      location: finalLocation,
      priority,
      items: draft.items,
      ice: draft.ice,
      comment: draft.comment || null,
      tip: effectiveTip,
      status: 'pending',
    })

    if (submitError) {
      setError("Couldn't place your order — check your connection and try again.")
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    clearDraft()
    setTimeout(() => navigate('/'), 1600)
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-sky-50 px-6 text-center pb-safe-b pt-safe-t">
        <div className="text-6xl">🍹</div>
        <p className="text-2xl font-bold text-slate-800">Order placed!</p>
        <p className="text-slate-500">The barman&apos;s been notified — thanks!</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-sky-50 pb-safe-b">
      <PageHeader title="Checkout" subtitle="Just a couple of details" />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <SiestaBanner />

        {draft.items && draft.items.length > 0 && (
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Your order
            </p>
            <ul className="flex flex-col gap-1">
              {draft.items.map((item, i) => (
                <li key={i} className="flex justify-between text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-semibold">×{item.quantity}</span>
                </li>
              ))}
            </ul>
            {(draft.ice || draft.comment) && (
              <p className="mt-2 text-sm text-slate-500">
                {draft.ice && <span>🧊 Ice</span>}
                {draft.ice && draft.comment && <span> · </span>}
                {draft.comment && <span>&ldquo;{draft.comment}&rdquo;</span>}
              </p>
            )}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">Who&apos;s this for?</span>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="" disabled>
              Select your name
            </option>
            {NAME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {name === 'Other' && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Your name</span>
            <input
              type="text"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder="Type your name"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">Where are you?</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="" disabled>
              Select location
            </option>
            {LOCATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {location === 'Other' && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Where exactly?</span>
            <input
              type="text"
              value={otherLocation}
              onChange={(e) => setOtherLocation(e.target.value)}
              placeholder="Type your location"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">How urgent?</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">Fancy leaving a tip? 😉</span>
          <p className="text-xs text-slate-400">
            Just for bragging rights on the bartender&apos;s leaderboard — nobody&apos;s actually
            charged anything.
          </p>
          <div className="flex flex-wrap gap-2">
            {TIP_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setTip(amount)
                  setShowCustomTip(false)
                }}
                className={`tap-highlight-none flex min-h-[44px] min-w-[56px] items-center justify-center rounded-xl border px-3 font-semibold tabular-nums ${
                  !showCustomTip && tip === amount
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                €{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomTip(true)}
              className={`tap-highlight-none flex min-h-[44px] items-center justify-center rounded-xl border px-3 font-semibold ${
                showCustomTip
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Other
            </button>
          </div>
          {showCustomTip && (
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Amount in €"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 p-3 text-base text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          )}
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <Button onClick={handleSubmit} disabled={!canSubmit} className="mt-2 w-full text-lg">
          {submitting ? 'Placing order…' : 'Submit order'}
        </Button>
      </div>
    </div>
  )
}
