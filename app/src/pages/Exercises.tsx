import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MuscleChips } from '../components/ExerciseCard'
import { CATEGORY_LABEL, EXERCISES, exerciseImages, type Category } from '../data/exercises'
import { MUSCLES } from '../data/muscles'

const ORDER: Category[] = ['push', 'pull', 'beine', 'core', 'cardio', 'warmup']

export default function Exercises() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = EXERCISES.filter((e) => {
    if (!needle) return true
    const muscles = [...e.primary, ...e.secondary].map((m) => MUSCLES[m].toLowerCase()).join(' ')
    return e.name.toLowerCase().includes(needle) || muscles.includes(needle) || e.equipment.toLowerCase().includes(needle)
  })
  return (
    <div className="space-y-4">
      <h1 className="h1">Übungen</h1>
      <input className="input" placeholder="Suchen: Name, Muskel, Gerät …" value={q} onChange={(e) => setQ(e.target.value)} />
      {ORDER.map((cat) => {
        const items = list.filter((e) => e.category === cat)
        if (items.length === 0) return null
        return (
          <section key={cat} className="space-y-2">
            <div className="label px-1">{CATEGORY_LABEL[cat]}</div>
            {items.map((e) => {
              const img = exerciseImages(e)
              return (
                <Link key={e.id} to={`/exercises/${e.id}`} className="card flex gap-3 items-center">
                  {img.start ? <img src={img.start} alt="" className="h-16 w-12 object-cover rounded-md bg-white shrink-0" loading="lazy" /> : <div className="h-16 w-12 rounded-md bg-card2 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{e.name}</div>
                    <div className="mt-1"><MuscleChips e={e} /></div>
                  </div>
                </Link>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
