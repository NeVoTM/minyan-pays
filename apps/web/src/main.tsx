import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initI18n } from './i18n'
import { OrgProvider } from './context/OrgContext'
import { PunchHeaderProvider } from './context/PunchHeaderContext'
import App from './App.tsx'

initI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OrgProvider>
      <PunchHeaderProvider>
        <App />
      </PunchHeaderProvider>
    </OrgProvider>
  </StrictMode>,
)
