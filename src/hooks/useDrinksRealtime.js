import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Shared by the customer drink list and the bartender admin screen so both
// see drink edits / sold-out toggles / deletes live, no refresh needed.
export function useDrinksRealtime() {
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('created_at', { ascending: true })
      if (!isMounted) return
      if (error) {
        setError(error)
      } else {
        setDrinks(data ?? [])
      }
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('drinks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drinks' },
        (payload) => {
          setDrinks((current) => {
            if (payload.eventType === 'INSERT') {
              if (current.some((d) => d.id === payload.new.id)) return current
              return [...current, payload.new]
            }
            if (payload.eventType === 'UPDATE') {
              return current.map((d) => (d.id === payload.new.id ? payload.new : d))
            }
            if (payload.eventType === 'DELETE') {
              return current.filter((d) => d.id !== payload.old.id)
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

  return { drinks, loading, error }
}
