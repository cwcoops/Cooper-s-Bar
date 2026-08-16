import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useCategories } from '../hooks/useCategories'

export default function Categories() {
  const navigate = useNavigate()
  const { categories, loading } = useCategories()

  return (
    <div className="min-h-dvh bg-sky-50 pb-safe-b">
      <PageHeader title="What are you after?" onBack={() => navigate('/')} />

      {loading && <p className="py-8 text-center text-slate-500">Loading menu…</p>}

      <div className="grid grid-cols-2 gap-4 px-4 pt-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => navigate(`/order/${cat.id}`)}
            className="tap-highlight-none flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 text-center shadow-soft active:bg-sky-100"
          >
            <span className="text-4xl">{cat.emoji}</span>
            <span className="text-base font-semibold text-slate-700">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
