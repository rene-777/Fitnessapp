import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db, now } from '../db/db'
import type { Profile, Settings } from '../db/types'
import { DEFAULT_START } from '../data/plan'
import { configureAudio } from '../lib/audio'

const SETTINGS_ID = 'app'

export async function ensureDefaults() {
  const s = await db.settings.get(SETTINGS_ID)
  if (s) return
  const profileCount = await db.profiles.count()
  let profileId: string
  if (profileCount === 0) {
    const p: Profile = { id: uuid(), name: 'René', birthYear: 1970, heightCm: 172, sex: 'm', planStartDate: DEFAULT_START, hrMax: 169, createdAt: now(), updatedAt: now() }
    await db.profiles.put(p)
    profileId = p.id
  } else {
    profileId = (await db.profiles.toCollection().first())!.id
  }
  await db.settings.put({ id: SETTINGS_ID, activeProfileId: profileId, audio: true, voice: false })
}

export function useSettings(): Settings | undefined {
  const s = useLiveQuery(() => db.settings.get(SETTINGS_ID))
  useEffect(() => {
    if (s) configureAudio(s.audio, s.voice)
  }, [s])
  return s
}

export function useProfile(): Profile | undefined {
  const s = useSettings()
  return useLiveQuery(() => (s ? db.profiles.get(s.activeProfileId) : undefined), [s?.activeProfileId])
}

export async function updateSettings(patch: Partial<Settings>) {
  const s = await db.settings.get(SETTINGS_ID)
  if (s) await db.settings.put({ ...s, ...patch })
}

export async function saveProfile(p: Profile) {
  await db.profiles.put({ ...p, updatedAt: now() })
}
