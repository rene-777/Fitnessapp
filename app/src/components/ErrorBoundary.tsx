import { Component, type ReactNode } from 'react'

/** Fehlertext für die Anzeige, damit Probleme am Handy ohne Entwicklerwerkzeuge gemeldet werden können. */
export function errorText(e: unknown) {
  if (e instanceof Error) return `${e.name}: ${e.message}`
  return String(e)
}

export function ErrorCard({ title, error, onRetry }: { title: string; error: string; onRetry?: () => void }) {
  return (
    <div className="p-4 space-y-3">
      <div className="card space-y-2">
        <div className="h2">{title}</div>
        <div className="text-sm text-muted">Bitte diese Meldung weitergeben:</div>
        <pre className="text-xs whitespace-pre-wrap break-words bg-card2 rounded-lg p-2">{error}</pre>
        <div className="text-xs text-muted">Version {__BUILD__}</div>
      </div>
      {onRetry && <button className="btn-primary w-full" onClick={onRetry}>Erneut versuchen</button>}
      <button className="btn-ghost w-full" onClick={() => window.location.reload()}>App neu laden</button>
    </div>
  )
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error?: string }> {
  state: { error?: string } = {}
  static getDerivedStateFromError(e: unknown) {
    return { error: errorText(e) }
  }
  render() {
    if (this.state.error) return <ErrorCard title="Unerwarteter Fehler" error={this.state.error} />
    return this.props.children
  }
}
