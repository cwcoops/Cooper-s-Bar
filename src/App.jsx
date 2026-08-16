import { Navigate, Route, Routes } from 'react-router-dom'
import { OrderDraftProvider } from './context/OrderDraftContext'
import Home from './pages/Home'
import Categories from './pages/Categories'
import DrinkList from './pages/DrinkList'
import Checkout from './pages/Checkout'
import BartenderLayout from './pages/bartender/BartenderLayout'
import Orders from './pages/bartender/Orders'
import Drinks from './pages/bartender/Drinks'
import Tips from './pages/bartender/Tips'
import OrderHistory from './pages/bartender/OrderHistory'

export default function App() {
  return (
    <OrderDraftProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Categories />} />
        <Route path="/order/:categoryId" element={<DrinkList />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route path="/bartender" element={<BartenderLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="drinks" element={<Drinks />} />
          <Route path="tips" element={<Tips />} />
          <Route path="history" element={<OrderHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OrderDraftProvider>
  )
}
