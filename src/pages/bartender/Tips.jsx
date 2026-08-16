import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Tips() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase.from('orders').select('customer_name, tip')
      if (!isMounted) return
      if (!error) setRows(data ?? [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('tips-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setRows((current) => [
            ...current,
            { customer_name: payload.new.customer_name, tip: payload.new.tip },
          ])
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const total = rows.reduce((sum, r) => sum + Number(r.tip ?? 0), 0)

  const byPerson = Object.values(
    rows.reduce((acc, r) => {
      const name = r.customer_name
      const amount = Number(r.tip ?? 0)
      if (!acc[name]) acc[name] = { name, total: 0 }
      acc[name].total += amount
      return acc
    }, {})
  )
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)

  return (
    <div className="flex flex-col gap-3 px-4 pt-2">
      <div className="rounded-2xl bg-white p-4 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Total tips
        </p>
        <p className="mt-1 text-3xl font-extrabold text-sky-600">€{total.toFixed(2)}</p>
        <p className="mt-1 text-xs text-slate-400">
          Just for fun — nobody&apos;s actually being charged 😉
        </p>
      </div>

      {loading && <p className="py-8 text-center text-slate-500">Loading tips…</p>}

      {!loading && byPerson.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-soft">
          No tips yet.
        </p>
      )}

      {byPerson.length > 0 && (
        <div className="flex flex-col gap-2">
          {byPerson.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft"
            >
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-xl">🥇</span>}
                <span className="font-semibold text-slate-800">{p.name}</span>
              </div>
              <span className="font-bold text-sky-600">€{p.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
