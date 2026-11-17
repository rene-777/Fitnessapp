import { useEffect, useState } from 'react'
import NoteField from '../NoteField'
import { db } from '../../db/db'
import type { Workout as WorkoutRow } from '../../db/types'
import { saveSetNote, saveWorkoutNote } from '../../lib/workouts'

/** Bemerkung zum gerade gespeicherten Satz, in der Pause: dort ist Zeit zum Tippen oder Diktieren. Jede Änderung wird sofort gespeichert. */
export function SetNote({ setId }: { setId: string }) {
  const [text, setText] = useState<string>()
  useEffect(() => {
    let cancelled = false
    void db.sets.get(setId).then((s) => { if (!cancelled) setText(s?.note ?? '') })
    return () => { cancelled = true }
  }, [setId])
  if (text === undefined) return null
  return <div className="card"><NoteField label="Bemerkung zum letzten Satz" value={text} onChange={(v) => { setText(v); void saveSetNote(setId, v) }} /></div>
}

/** Bemerkung zur ganzen Einheit, auf dem Abschluss-Bildschirm. */
export function WorkoutNote({ workout }: { workout: WorkoutRow }) {
  const [text, setText] = useState(workout.notes ?? '')
  return <div className="card"><NoteField open label="Bemerkung zur Einheit" placeholder="Wie lief es? Schmerzen, Tagesform, Abweichungen vom Plan …" value={text} onChange={(v) => { setText(v); void saveWorkoutNote(workout.id, v) }} /></div>
}
