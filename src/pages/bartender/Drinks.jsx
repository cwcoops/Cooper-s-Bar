import { useState } from 'react'
import { useDrinksRealtime } from '../../hooks/useDrinksRealtime'
import { useCategories } from '../../hooks/useCategories'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../components/Button'
import Modal from '../../components/Modal'

function DrinkForm({ initial, categories, onCancel, onSave, saving }) {
  const [form, setForm] = useState(
    initial ?? {
      name: '',
      category_id: categories[0]?.id ?? '',
      description: '',
      sold_out: false,
      hasOptions: false,
      optionLabel: '',
      optionChoicesText: '',
    }
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-600">Name</span>
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="min-h-[44px] rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-600">Category</span>
        <select
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          className="min-h-[44px] rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-600">Description (optional)</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </label>

      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, hasOptions: !f.hasOptions }))}
        className="tap-highlight-none flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 px-3"
      >
        <span className="text-sm font-semibold text-slate-600">
          Customer picks an option
        </span>
        <span
          className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
            form.hasOptions ? 'justify-end bg-sky-400' : 'justify-start bg-slate-200'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </button>

      {form.hasOptions && (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">What do we call it?</span>
            <input
              type="text"
              value={form.optionLabel}
              onChange={(e) => setForm((f) => ({ ...f, optionLabel: e.target.value }))}
              placeholder="e.g. flavour, size"
              className="min-h-[44px] rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Choices (one per line)</span>
            <textarea
              value={form.optionChoicesText}
              onChange={(e) => setForm((f) => ({ ...f, optionChoicesText: e.target.value }))}
              placeholder={'Strawberry\nOrange\nCola'}
              rows={4}
              className="rounded-xl border border-slate-200 p-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
        </>
      )}

      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, sold_out: !f.sold_out }))}
        className="tap-highlight-none flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 px-3"
      >
        <span className="text-sm font-semibold text-slate-600">Sold out</span>
        <span
          className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
            form.sold_out ? 'justify-end bg-red-400' : 'justify-start bg-slate-200'
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </button>

      <div className="mt-1 flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function CategoryManager({ categories, onClose }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🍹')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('categories')
      .insert({ name: newName.trim(), emoji: newEmoji.trim() || '🍹' })
    setSaving(false)
    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'A category with that name already exists.'
          : "Couldn't add that category — try again."
      )
      return
    }
    setNewName('')
    setNewEmoji('🍹')
    setAdding(false)
  }

  function startEdit(cat) {
    setError(null)
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditEmoji(cat.emoji)
  }

  async function saveEdit() {
    if (!editName.trim()) return
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('categories')
      .update({ name: editName.trim(), emoji: editEmoji.trim() || '🍹' })
      .eq('id', editingId)
    setSaving(false)
    if (updateError) {
      setError(
        updateError.code === '23505'
          ? 'A category with that name already exists.'
          : "Couldn't save changes — try again."
      )
      return
    }
    setEditingId(null)
  }

  async function handleDelete(cat) {
    setError(null)
    const { count, error: countError } = await supabase
      .from('drinks')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', cat.id)
    if (countError) {
      setError("Couldn't check that category — try again.")
      return
    }
    if (count > 0) {
      window.alert(
        `"${cat.name}" still has ${count} drink${count === 1 ? '' : 's'} in it. Move or delete ${
          count === 1 ? 'it' : 'them'
        } first.`
      )
      return
    }
    if (!window.confirm(`Delete the "${cat.name}" category?`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
  }

  return (
    <Modal title="Manage categories" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {categories.map((cat) =>
          editingId === cat.id ? (
            <div key={cat.id} className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
              <div className="flex gap-2">
                <input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-16 rounded-xl border border-slate-200 p-3 text-center text-base"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 p-3 text-base"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={saving || !editName.trim()}
                  onClick={saveEdit}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
            >
              <span className="font-semibold text-slate-700">
                {cat.emoji} {cat.name}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Edit category"
                  onClick={() => startEdit(cat)}
                  className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full text-sky-600 active:bg-sky-50"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  aria-label="Delete category"
                  onClick={() => handleDelete(cat)}
                  className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        )}

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        {adding ? (
          <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
            <div className="flex gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="🍹"
                className="w-16 rounded-xl border border-slate-200 p-3 text-center text-base"
              />
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="flex-1 rounded-xl border border-slate-200 p-3 text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={saving || !newName.trim()}
                onClick={handleAdd}
              >
                {saving ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
            + Add category
          </Button>
        )}
      </div>
    </Modal>
  )
}

export default function Drinks() {
  const { drinks, loading } = useDrinksRealtime()
  const { categories, loading: categoriesLoading } = useCategories()
  const [modal, setModal] = useState(null) // null | 'add' | drink object
  const [managingCategories, setManagingCategories] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(form) {
    setSaving(true)
    const choices = form.hasOptions
      ? form.optionChoicesText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const hasChoices = choices.length > 0

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      description: form.description.trim() || null,
      sold_out: form.sold_out,
      option_label: hasChoices ? form.optionLabel.trim() || 'option' : null,
      option_choices: hasChoices ? choices : null,
    }

    const { error } =
      modal === 'add'
        ? await supabase.from('drinks').insert(payload)
        : await supabase.from('drinks').update(payload).eq('id', modal.id)

    setSaving(false)
    if (!error) setModal(null)
  }

  async function handleDelete(drink) {
    if (!window.confirm(`Delete "${drink.name}"? This can't be undone.`)) return
    await supabase.from('drinks').delete().eq('id', drink.id)
  }

  async function toggleSoldOut(drink) {
    await supabase.from('drinks').update({ sold_out: !drink.sold_out }).eq('id', drink.id)
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-2">
      <div className="flex gap-2">
        <Button onClick={() => setModal('add')} className="flex-1">
          + Add drink
        </Button>
        <Button variant="secondary" onClick={() => setManagingCategories(true)} className="flex-1">
          Manage categories
        </Button>
      </div>

      {(loading || categoriesLoading) && (
        <p className="py-8 text-center text-slate-500">Loading drinks…</p>
      )}

      {categories.map((cat) => {
        const items = drinks.filter((d) => d.category_id === cat.id)
        if (items.length === 0) return null
        return (
          <section key={cat.id}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              {cat.emoji} {cat.name}
            </h2>
            <div className="flex flex-col gap-2">
              {items.map((drink) => (
                <div key={drink.id} className="rounded-2xl bg-white p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`font-semibold ${
                          drink.sold_out ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      >
                        {drink.name}
                      </p>
                      {drink.description && (
                        <p className="mt-0.5 text-sm text-slate-500">{drink.description}</p>
                      )}
                      {drink.option_choices && drink.option_choices.length > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-sky-600">
                          🔽 {drink.option_label || 'option'}: {drink.option_choices.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Edit"
                        onClick={() => setModal(drink)}
                        className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full text-sky-600 active:bg-sky-50"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => handleDelete(drink)}
                        className="tap-highlight-none flex h-11 w-11 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSoldOut(drink)}
                    className={`tap-highlight-none mt-3 flex min-h-[40px] w-full items-center justify-center rounded-xl text-sm font-semibold ${
                      drink.sold_out ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'
                    }`}
                  >
                    {drink.sold_out ? 'Mark back in stock' : 'Mark sold out'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {modal && (
        <Modal title={modal === 'add' ? 'Add drink' : 'Edit drink'} onClose={() => setModal(null)}>
          <DrinkForm
            initial={
              modal === 'add'
                ? undefined
                : {
                    name: modal.name,
                    category_id: modal.category_id,
                    description: modal.description ?? '',
                    sold_out: modal.sold_out,
                    hasOptions: Boolean(modal.option_choices && modal.option_choices.length > 0),
                    optionLabel: modal.option_label ?? '',
                    optionChoicesText: (modal.option_choices ?? []).join('\n'),
                  }
            }
            categories={categories}
            onCancel={() => setModal(null)}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}

      {managingCategories && (
        <CategoryManager categories={categories} onClose={() => setManagingCategories(false)} />
      )}
    </div>
  )
}
