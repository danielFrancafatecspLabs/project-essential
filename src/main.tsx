import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

const launchSplash = document.getElementById('launch-splash')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Falha ao registrar service worker:', error)
    })
  })
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (launchSplash) {
  window.requestAnimationFrame(() => {
    launchSplash.classList.add('hidden')
    window.setTimeout(() => launchSplash.remove(), 260)
  })
}
