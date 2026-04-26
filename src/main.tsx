import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProviders } from '@/contexts/AppProviders'
import App from './App'
import './index.css'

if (import.meta.env.DEV && !window.electronAPI) {
  const { installDevElectronShim } = await import('@/lib/devElectronShim')
  installDevElectronShim()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
