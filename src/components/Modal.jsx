export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe-b shadow-soft sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
