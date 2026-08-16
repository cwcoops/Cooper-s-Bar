import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const OrderDraftContext = createContext(null)

const EMPTY_DRAFT = { category: null, items: [], ice: false, comment: '' }

// Holds the in-progress order (drinks picked on the DrinkList page) while
// the customer moves on to Checkout to add their name + priority.
export function OrderDraftProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const clearDraft = useCallback(() => setDraft(EMPTY_DRAFT), [])

  const value = useMemo(() => ({ draft, setDraft, clearDraft }), [draft, clearDraft])

  return <OrderDraftContext.Provider value={value}>{children}</OrderDraftContext.Provider>
}

export function useOrderDraft() {
  const ctx = useContext(OrderDraftContext)
  if (!ctx) throw new Error('useOrderDraft must be used within OrderDraftProvider')
  return ctx
}
