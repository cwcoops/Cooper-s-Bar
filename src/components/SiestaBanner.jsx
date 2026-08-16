import { useBarStatus } from '../hooks/useBarStatus'

export default function SiestaBanner({ className = '' }) {
  const { siesta } = useBarStatus()

  if (!siesta) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-soft ${className}`}
    >
      <span className="text-2xl">😴</span>
      <div>
        <p className="font-bold text-amber-900">Barman on a rare Siesta</p>
        <p className="text-sm text-amber-700">Orders will come when he&apos;s done.</p>
      </div>
    </div>
  )
}
