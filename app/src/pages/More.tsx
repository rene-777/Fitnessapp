import { Link } from 'react-router-dom'

export default function More() {
  const items = [
    { to: '/body', title: 'Körper und Kalorien', sub: 'Gewicht, Taille, Kalorienbedarf, Proteinziel' },
    { to: '/photos', title: 'Foto-Check', sub: 'Fortschrittsfotos alle 4 Wochen: vorne, links, rechts, hinten' },
    { to: '/log', title: 'Einheit nachtragen', sub: 'Vergangene Plan-Einheit komplett eintragen' },
    { to: '/free', title: 'Freies Training', sub: 'Einzelne Übungen außerhalb des Plans, mit Stoppuhr für Halteübungen' },
    { to: '/settings', title: 'Einstellungen', sub: 'Profil, Startdatum, Audio, Sicherung' },
  ]
  return (
    <div className="space-y-4">
      <h1 className="h1">Mehr</h1>
      {items.map((it) => (
        <Link key={it.to} to={it.to} className="card block">
          <div className="font-semibold">{it.title}</div>
          <div className="text-sm text-muted">{it.sub}</div>
        </Link>
      ))}
      <div className="text-xs text-muted px-1">Transformation 16 · Version {__BUILD__} · Daten bleiben auf diesem Gerät. Sicherung über Einstellungen → Export.</div>
    </div>
  )
}
