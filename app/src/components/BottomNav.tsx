import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Heute', icon: '●' },
  { to: '/week', label: 'Woche', icon: '▦' },
  { to: '/plan', label: 'Plan', icon: '▤' },
  { to: '/exercises', label: 'Übungen', icon: '≡' },
  { to: '/more', label: 'Mehr', icon: '⋯' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-line pb-[env(safe-area-inset-bottom)] z-20">
      <div className="max-w-xl mx-auto grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) => `flex flex-col items-center py-2 text-xs ${isActive ? 'text-accent' : 'text-muted'}`}
          >
            <span className="text-lg leading-none mb-0.5">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
