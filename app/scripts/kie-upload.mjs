// Lädt lokale Bilder zu Kie.ai hoch (Base64-Upload) und gibt die temporären URLs aus
// (Dateien werden nach 1–3 Tagen gelöscht). Dient als Referenzbild für kie-gen.mjs.
// Aufruf im Ordner app:  node scripts/kie-upload.mjs <datei> [<datei> …]
// Ausgabe: eine Zeile je Datei "<datei>\t<url>", zusätzlich als JSON in scripts/kie-jobs/uploads.json (zusammengeführt).
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const NAME = 'KIE_AI_API_KEY'
function fromUserEnvironment() {
  if (process.platform !== 'win32') return ''
  const r = spawnSync('powershell', ['-NoProfile', '-Command', `[Environment]::GetEnvironmentVariable('${NAME}','User')`], { encoding: 'utf8' })
  return r.status === 0 ? (r.stdout || '').trim() : ''
}
const key = process.env[NAME] || fromUserEnvironment()
if (!key) { console.error(`${NAME} nicht gefunden.`); process.exit(1) }

const files = process.argv.slice(2)
if (!files.length) { console.error('Aufruf: node scripts/kie-upload.mjs <datei> …'); process.exit(1) }
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
const registry = 'scripts/kie-jobs/uploads.json'
const known = fs.existsSync(registry) ? JSON.parse(fs.readFileSync(registry, 'utf8')) : {}

for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const mime = MIME[ext]
  if (!mime) { console.error(`${file}: unbekannter Typ`); continue }
  const b64 = fs.readFileSync(file).toString('base64')
  const res = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data: `data:${mime};base64,${b64}`, uploadPath: 'fitnessapp', fileName: path.basename(file) }),
  })
  const body = await res.json()
  const url = body?.data?.downloadUrl || body?.data?.fileUrl
  if (!url) { console.error(`${file}: Upload fehlgeschlagen ${JSON.stringify(body)}`); process.exitCode = 1; continue }
  known[path.basename(file, ext)] = { url, uploadedAt: new Date().toISOString() }
  console.log(`${file}\t${url}`)
}
fs.writeFileSync(registry, JSON.stringify(known, null, 2) + '\n')
