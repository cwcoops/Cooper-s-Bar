export default function QuantityStepper({ value, onChange, disabled = false }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-sky-200 bg-white ${
        disabled ? 'pointer-events-none opacity-30' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-semibold text-sky-600 tap-highlight-none disabled:text-slate-300"
      >
        –
      </button>
      <span className="w-6 text-center text-base font-semibold text-slate-700">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-semibold text-sky-600 tap-highlight-none"
      >
        +
      </button>
    </div>
  )
}
