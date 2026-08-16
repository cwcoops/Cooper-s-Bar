import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, subtitle, onBack }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 px-4 pb-2 pt-safe-t">
      <button
        type="button"
        aria-label="Go back"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 shadow-soft tap-highlight-none active:bg-sky-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}
