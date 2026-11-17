// Datensicherheit: Alle Daten liegen nur in der IndexedDB dieses Geräts. Zwei Vorkehrungen (17.11.2026):
// 1. dauerhaften Speicher beim Browser anfordern, damit er die Datenbank bei Platzmangel nicht von sich aus löscht;
// 2. an den Export erinnern, wenn seit der letzten Sicherung Neues dazugekommen ist.

/** Nach so vielen Tagen ohne Export erscheint die Erinnerung auf der Startseite. */
export const BACKUP_REMIND_DAYS = 7

export interface BackupStatus {
  due: boolean // Erinnerung zeigen
  days?: number // volle Tage seit dem letzten Export; undefined = noch nie exportiert
  changed: number // Einträge, die seit dem letzten Export neu oder geändert sind
}

/** Reine Funktion: braucht den Zeitpunkt des letzten Exports, die Zeilen (Trainings, Sätze, Körperwerte) und „jetzt“. */
export function backupStatus(lastExportAt: string | undefined, rows: { updatedAt: string }[], nowIso: string): BackupStatus {
  const changed = rows.filter((r) => !lastExportAt || r.updatedAt > lastExportAt).length
  if (!lastExportAt) return { due: changed > 0, changed }
  const days = Math.floor((new Date(nowIso).getTime() - new Date(lastExportAt).getTime()) / 86400000)
  return { due: changed > 0 && days >= BACKUP_REMIND_DAYS, days, changed }
}

export interface StorageInfo {
  supported: boolean
  persisted: boolean
  usedMb?: number
}

/** Dauerhaften Speicher anfordern (Chrome sagt ihn installierten Apps ohne Rückfrage zu) und den Stand melden. */
export async function ensurePersistentStorage(): Promise<StorageInfo> {
  const st = typeof navigator === 'undefined' ? undefined : navigator.storage
  if (!st?.persist) return { supported: false, persisted: false }
  const persisted = (await st.persisted()) || (await st.persist())
  const est = st.estimate ? await st.estimate() : undefined
  return { supported: true, persisted, usedMb: est?.usage === undefined ? undefined : Math.round(est.usage / 1048576) }
}
