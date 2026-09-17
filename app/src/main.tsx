import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hochformat erzwingen (wirkt nur in der installierten App; im Browser-Tab wird der Aufruf abgelehnt)
const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
const lockPortrait = () => { orientation?.lock?.('portrait-primary').catch(() => {}) }
lockPortrait()
document.addEventListener('visibilitychange', () => { if (!document.hidden) lockPortrait() })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
