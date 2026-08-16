import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { PendingOrdersProvider, usePendingOrders } from '../../context/PendingOrdersContext'
import { useBarStatus } from '../../hooks/useBarStatus'
import { supabase } from '../../lib/supabaseClient'
import { unlockAudio } from '../../lib/sound'
import Button from '../../components/Button'

const TABS = [
  { to: 'orders', label: 'Orders' },
  { to: 'drinks', label: 'Drinks' },
  { to: 'tips', label: 'Tips' },
  { to: 'history', label: 'History' },
]

const PASSCODE = '6767'
const UNLOCK_STORAGE_KEY = 'coopers-bar-barman-unlocked'

function PasscodeGate({ onUnlock }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (code === PASSCODE) {
      localStorage.setItem(UNLOCK_STORAGE_KEY, 'true')
      onUnlock()
    } else {
      setError(true)
      setCode('')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-sky-50 px-6 pb-safe-b pt-safe-t text-center">
      <span className="text-5xl">🔒</span>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Barman&apos;s password</h1>
        <p className="mt-1 text-slate-500">If you&apos;re not the barman... go away 👋</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={code}
          onChange={(e) => {
            setError(false)
            setCode(e.target.value)
          }}
          placeholder="Passcode"
          className={`min-h-[44px] w-full rounded-xl border p-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
          }`}
        />
        {error && <p className="text-sm font-medium text-red-500">Wrong passcode.</p>}
        <Button type="submit" disabled={!code} className="w-full">
          Unlock
        </Button>
      </form>

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate('/')}
        className="mt-2 w-full max-w-xs text-lg"
      >
        Back to Home Screen
      </Button>
    </div>
  )
}

function TabBar() {
  const { count } = usePendingOrders()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-sky-100 bg-white/95 pb-safe-b backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `tap-highlight-none relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                isActive ? 'text-sky-600' : 'text-slate-400'
              }`
            }
          >
            <span className="relative">
              {tab.label}
              {tab.to === 'orders' && count > 0 && (
                <span className="absolute -right-4 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SiestaToggle() {
  const { siesta } = useBarStatus()
  const [updating, setUpdating] = useState(false)

  async function toggle() {
    setUpdating(true)
    await supabase
      .from('bar_status')
      .update({ siesta: !siesta, updated_at: new Date().toISOString() })
      .eq('id', 1)
    setUpdating(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={updating}
      className={`tap-highlight-none mx-4 mb-3 flex min-h-[44px] items-center justify-between rounded-2xl border px-4 py-2 shadow-soft disabled:opacity-60 ${
        siesta ? 'border-amber-300 bg-amber-50' : 'border-sky-100 bg-white'
      }`}
    >
      <span className="flex items-center gap-2 font-semibold text-slate-700">
        <span className="text-lg">😴</span> Siesta mode
      </span>
      <span
        className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
          siesta ? 'justify-end bg-amber-400' : 'justify-start bg-slate-200'
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  )
}

function AnnouncementControl() {
  const { announcement } = useBarStatus()
  const [text, setText] = useState(announcement ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(announcement ?? '')
  }, [announcement])

  async function send() {
    if (!text.trim()) return
    setSaving(true)
    await supabase
      .from('bar_status')
      .update({ announcement: text.trim(), updated_at: new Date().toISOString() })
      .eq('id', 1)
    setSaving(false)
  }

  async function remove() {
    setSaving(true)
    await supabase
      .from('bar_status')
      .update({ announcement: null, updated_at: new Date().toISOString() })
      .eq('id', 1)
    setSaving(false)
  }

  return (
    <div className="mx-4 mb-3 flex flex-col gap-2 rounded-2xl border border-sky-100 bg-white p-3 shadow-soft">
      <span className="flex items-center gap-2 font-semibold text-slate-700">
        <span className="text-lg">📣</span> Announcement
      </span>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell everyone something…"
        rows={2}
        className="rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
      <div className="flex gap-2">
        <Button type="button" disabled={saving || !text.trim()} onClick={send} className="flex-1">
          {saving ? 'Sending…' : announcement ? 'Update' : 'Send'}
        </Button>
        {announcement && (
          <Button
            type="button"
            variant="danger"
            disabled={saving}
            onClick={remove}
            className="flex-1"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

function BartenderChrome() {
  const navigate = useNavigate()

  useEffect(() => {
    const unlock = () => unlockAudio()
    document.addEventListener('pointerdown', unlock, { once: true })
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className="min-h-dvh bg-sky-50 pb-24">
      <header className="flex items-center justify-between px-4 pb-2 pt-safe-t">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500">
            Cooper&apos;s Bar – Quakers Road
          </p>
          <h1 className="text-xl font-bold text-slate-800">Bartender</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="tap-highlight-none flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-sky-600 active:bg-sky-100"
        >
          Exit
        </button>
      </header>

      <SiestaToggle />
      <AnnouncementControl />

      <Outlet />
      <TabBar />
    </div>
  )
}

export default function BartenderLayout() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true'
  )

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />
  }

  return (
    <PendingOrdersProvider>
      <BartenderChrome />
    </PendingOrdersProvider>
  )
}
