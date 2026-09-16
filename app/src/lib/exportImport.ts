import { db } from '../db/db'

interface Dump {
  app: string
  version: number
  exportedAt: string
  profiles: unknown[]
  settings: unknown[]
  workouts: unknown[]
  sets: unknown[]
  body: unknown[]
  benchmarks: unknown[]
}

export async function exportAll(): Promise<string> {
  const dump: Dump = {
    app: 'transformation16',
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: await db.profiles.toArray(),
    settings: await db.settings.toArray(),
    workouts: await db.workouts.toArray(),
    sets: await db.sets.toArray(),
    body: await db.body.toArray(),
    benchmarks: await db.benchmarks.toArray(),
  }
  return JSON.stringify(dump, null, 1)
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Zusammenführen: neuere updatedAt gewinnt, unbekannte IDs werden ergänzt. */
export async function importDump(text: string): Promise<{ added: number; updated: number }> {
  const dump = JSON.parse(text) as Dump
  if (dump.app !== 'transformation16') throw new Error('Keine gültige Sicherungsdatei.')
  let added = 0
  let updated = 0
  type Row = { id: string; updatedAt?: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merge = async (table: any, rows: unknown[]) => {
    for (const raw of rows as Row[]) {
      const existing = (await table.get(raw.id)) as Row | undefined
      if (!existing) { await table.put(raw); added++ }
      else if ((raw.updatedAt ?? '') > (existing.updatedAt ?? '')) { await table.put(raw); updated++ }
    }
  }
  await db.transaction('rw', [db.profiles, db.workouts, db.sets, db.body, db.benchmarks], async () => {
    await merge(db.profiles, dump.profiles)
    await merge(db.workouts, dump.workouts)
    await merge(db.sets, dump.sets)
    await merge(db.body, dump.body)
    await merge(db.benchmarks, dump.benchmarks)
  })
  return { added, updated }
}
