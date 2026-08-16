import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import SiestaBanner from '../components/SiestaBanner'
import AnnouncementBanner from '../components/AnnouncementBanner'
import { useAverageWaitTime } from '../hooks/useAverageWaitTime'

export default function Home() {
  const navigate = useNavigate()
  const { average: avgWait } = useAverageWaitTime()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-900">
      <img
        src="/barman.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-sky-950/80" />

      <div className="relative flex flex-1 flex-col justify-between px-6 pb-safe-b pt-safe-t">
        <div className="pt-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
            Quakers Road
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Cooper&apos;s Bar
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <SiestaBanner className="mx-auto w-full max-w-xs" />
          <AnnouncementBanner className="mx-auto w-full max-w-xs" />
        </div>

        <div className="flex flex-col items-center gap-4 pb-10">
          <Button
            onClick={() => navigate('/order')}
            className="w-full max-w-xs text-lg shadow-lg"
          >
            Order Now
          </Button>
          {avgWait !== null && (
            <p className="text-sm text-sky-100/80">
              ⏱️ Average wait right now: ~{avgWait} min
            </p>
          )}
          <p className="text-sm text-sky-100/80">Pick your name, pick your poison 🍹</p>
        </div>
      </div>

      {/* Hidden bartender access — deliberately unstyled so it doesn't read as a button */}
      <button
        type="button"
        aria-label="Bartender access"
        onClick={() => navigate('/bartender')}
        className="tap-highlight-none absolute left-safe-l top-safe-t rounded-full opacity-60 active:opacity-100"
      >
        <img src="/logo.png" alt="" className="h-12 w-12 rounded-full" />
      </button>
    </div>
  )
}
