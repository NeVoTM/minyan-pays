import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AmenitiesPage } from './pages/AmenitiesPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { ProfessionalsPage } from './pages/ProfessionalsPage'
import { ReservePage } from './pages/ReservePage'
import { WhatIsSalonSuitePage } from './pages/WhatIsSalonSuitePage'
import { WhyUsPage } from './pages/WhyUsPage'

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="amenities" element={<AmenitiesPage />} />
          <Route path="why-us" element={<WhyUsPage />} />
          <Route path="what-is-a-salon-suite" element={<WhatIsSalonSuitePage />} />
          <Route path="professionals" element={<ProfessionalsPage />} />
          <Route path="reserve" element={<ReservePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
