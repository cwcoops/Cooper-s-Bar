const VARIANTS = {
  primary:
    'bg-sky-500 text-white shadow-soft hover:bg-sky-600 active:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400',
  secondary:
    'bg-white text-sky-700 border border-sky-200 shadow-soft hover:bg-sky-50 active:bg-sky-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
  ghost: 'bg-transparent text-sky-700 hover:bg-sky-50 active:bg-sky-100',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold tap-highlight-none transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
