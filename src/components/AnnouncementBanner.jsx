import { useBarStatus } from '../hooks/useBarStatus'

export default function AnnouncementBanner({ className = '' }) {
  const { announcement } = useBarStatus()

  if (!announcement) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-sky-300 bg-white p-4 shadow-soft ${className}`}
    >
      <span className="text-2xl">📣</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">
          Announcement
        </p>
        <p className="mt-0.5 font-medium text-slate-700">{announcement}</p>
      </div>
    </div>
  )
}
