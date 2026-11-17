import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import UpdateBanner from './components/UpdateBanner'
import ErrorBoundary, { ErrorCard, errorText } from './components/ErrorBoundary'
import { ensureDefaults } from './hooks/useProfile'
import { ensurePersistentStorage } from './lib/backup'
import Today from './pages/Today'
import WeekPage from './pages/WeekPage'
import PlanPage from './pages/PlanPage'
import SessionPreview from './pages/SessionPreview'
import Workout from './pages/Workout'
import LogPast from './pages/LogPast'
import FreeTraining from './pages/FreeTraining'
import Exercises from './pages/Exercises'
import ExerciseDetail from './pages/ExerciseDetail'
import Photos from './pages/Photos'
import Mobility from './pages/Mobility'
import SettingsPage from './pages/SettingsPage'
import More from './pages/More'

// Analyse und Körper bringen die Diagramm-Bibliothek (Recharts, gut die Hälfte des Codes) mit: erst beim Öffnen laden.
// Offline bleibt das möglich, der Service Worker hält auch diese Teile vor.
const Stats = lazy(() => import('./pages/Stats'))
const Body = lazy(() => import('./pages/Body'))

function Shell() {
  const loc = useLocation()
  const fullscreen = loc.pathname.startsWith('/workout/')
  return (
    <div className="min-h-full">
      <main className={`max-w-xl mx-auto px-4 pt-4 ${fullscreen ? 'pb-6' : 'pb-24'}`}>
        <Suspense fallback={<div className="text-muted">Lade …</div>}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/week/:n" element={<WeekPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/session/:date/:sessionKey" element={<SessionPreview />} />
          <Route path="/workout/:date/:sessionKey" element={<Workout />} />
          <Route path="/log" element={<LogPast />} />
          <Route path="/log/:date/:sessionKey" element={<LogPast />} />
          <Route path="/free" element={<FreeTraining />} />
          <Route path="/free/:id" element={<FreeTraining />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/body" element={<Body />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/mobility" element={<Mobility />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/more" element={<More />} />
        </Routes>
        </Suspense>
      </main>
      {!fullscreen && <BottomNav />}
      <UpdateBanner hidden={fullscreen} />
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => {
    ensureDefaults().then(() => setReady(true)).catch((e) => setError(errorText(e)))
    // Dauerhaften Speicher anfordern; läuft nebenher und darf den Start nie aufhalten
    void ensurePersistentStorage().catch(() => undefined)
  }, [])
  if (error) return <ErrorCard title="Datenbank lässt sich nicht öffnen" error={error} />
  if (!ready) return <div className="p-6 text-muted">Lade …</div>
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Shell />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
