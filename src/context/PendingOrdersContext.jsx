import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { priorityRank } from '../lib/priority'
import { notifyNewOrder } from '../lib/sound'

const PendingOrdersContext = createContext(null)

function sortOrders(orders) {
  return [...orders].sort((a, b) => {
    const rankDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (rankDiff !== 0) return rankDiff
    return new Date(a.created_at) - new Date(b.created_at)
  })
}

// Single shared realtime subscription for pending orders, used both by the
// Orders screen (full list) and the bartender nav badge (count), so a new
// order is reflected everywhere within a second or two, no refresh.
export function PendingOrdersProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      if (!isMounted) return
      if (!error) {
        setOrders(sortOrders(data ?? []))
      }
      setLoading(false)
      hasLoadedOnce.current = true
    }
    load()

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((current) => {
            if (payload.eventType === 'INSERT') {
              if (payload.new.status !== 'pending') return current
              if (current.some((o) => o.id === payload.new.id)) return current
              if (hasLoadedOnce.current) notifyNewOrder()
              return sortOrders([...current, payload.new])
            }
            if (payload.eventType === 'UPDATE') {
              if (payload.new.status !== 'pending') {
                return current.filter((o) => o.id !== payload.new.id)
              }
              return sortOrders(current.map((o) => (o.id === payload.new.id ? payload.new : o)))
            }
            if (payload.eventType === 'DELETE') {
              return current.filter((o) => o.id !== payload.old.id)
            }
            return current
          })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const value = useMemo(
    () => ({ orders, loading, count: orders.length }),
    [orders, loading]
  )

  return (
    <PendingOrdersContext.Provider value={value}>{children}</PendingOrdersContext.Provider>
  )
}

export function usePendingOrders() {
  const ctx = useContext(PendingOrdersContext)
  if (!ctx) throw new Error('usePendingOrders must be used within PendingOrdersProvider')
  return ctx
}
