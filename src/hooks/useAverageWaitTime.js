import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { durationMinutes } from '../lib/duration'

const RECENT_SAMPLE_SIZE = 20

// A quick "typical wait right now" figure for the Home screen, based on the
// most recent completed orders rather than the full all-time history.
export function useAverageWaitTime() {
  const [average, setAverage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, confirmed_at, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(RECENT_SAMPLE_SIZE)
      if (!isMounted) return
      if (!error && data && data.length > 0) {
        const total = data.reduce((sum, o) => sum + (durationMinutes(o) ?? 0), 0)
        setAverage(Math.round(total / data.length))
      }
      setLoading(false)
    }
    load()

    return () => {
      isMounted = false
    }
  }, [])

  return { average, loading }
}
