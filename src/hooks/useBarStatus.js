import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Reads the single bar_status row (siesta on/off, current announcement) and
// stays live via realtime, so Home/Checkout and the bartender header always
// agree, no refresh needed.
export function useBarStatus() {
  const [status, setStatus] = useState({ siesta: false, announcement: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase
        .from('bar_status')
        .select('siesta, announcement')
        .eq('id', 1)
        .single()
      if (!isMounted) return
      if (!error && data) {
        setStatus({ siesta: data.siesta, announcement: data.announcement })
      }
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('bar-status-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bar_status' },
        (payload) => {
          setStatus({ siesta: payload.new.siesta, announcement: payload.new.announcement })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { siesta: status.siesta, announcement: status.announcement, loading }
}
