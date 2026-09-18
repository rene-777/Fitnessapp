// Bildgenerierung über die Kie.ai-API (createTask + Polling), ohne MCP-Server.
// Der API-Key kommt aus KIE_AI_API_KEY (Umgebung oder Windows-Benutzervariable),
// steht nie in einer Datei dieses Repos.
//
// Aufruf (im Ordner app):
//   node scripts/kie-gen.mjs --job scripts/kie-jobs/pushup.json
//
// Job-Datei (JSON):
//   {
//     "model": "google/nano-banana-pro",
//     "out": "public/img/gen/pushup_start",   // Zielpfad ohne Endung
//     "input": { "prompt": "...", "image_input": ["https://..."], "aspect_ratio": "3:4", ... }
//   }
// Das Rohbild landet als <out>.<ext>, dazu <out>.webp in 457 × 644 px (wie die Herstellerfotos),
// falls ffmpeg im PATH ist.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const NAME = 'KIE_AI_API_KEY'
const API = 'https://api.kie.ai/api/v1'
const WIDTH = 457
const HEIGHT = 644

function fromUserEnvironment() {
  if (process.platform !== 'win32') return ''
  const cmd = `[Environment]::GetEnvironmentVariable('${NAME}','User')`
  const r = spawnSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' })
  return r.status === 0 ? (r.stdout || '').trim() : ''
}

const key = process.env[NAME] || fromUserEnvironment()
if (!key) {
  console.error(`${NAME} weder in der Umgebung noch als Benutzervariable gefunden.`)
  process.exit(1)
}
const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

const args = process.argv.slice(2)
const jobArg = args[args.indexOf('--job') + 1]
if (!args.includes('--job') || !jobArg) {
  console.error('Aufruf: node scripts/kie-gen.mjs --job <job.json>')
  process.exit(1)
}
const job = JSON.parse(fs.readFileSync(jobArg, 'utf8'))
if (!job.model || !job.out || !job.input) {
  console.error('Job braucht model, out und input.')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function createTask() {
  const res = await fetch(`${API}/jobs/createTask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: job.model, input: job.input }),
  })
  const body = await res.json()
  if (body.code !== 200 || !body.data?.taskId) {
    throw new Error(`createTask: ${res.status} ${JSON.stringify(body)}`)
  }
  return body.data.taskId
}

async function waitFor(taskId) {
  const started = Date.now()
  for (;;) {
    const res = await fetch(`${API}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers })
    const body = await res.json()
    const d = body.data ?? {}
    const state = d.state
    if (state === 'success') return d
    if (state === 'fail') throw new Error(`Task fehlgeschlagen: ${d.failCode ?? ''} ${d.failMsg ?? JSON.stringify(body)}`)
    if (Date.now() - started > 10 * 60 * 1000) throw new Error('Zeitüberschreitung (10 min)')
    process.stdout.write(`  ${state ?? '?'} … ${Math.round((Date.now() - started) / 1000)} s\r`)
    await sleep(5000)
  }
}

function resultUrls(d) {
  try {
    const r = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson
    return r?.resultUrls ?? r?.result_urls ?? []
  } catch {
    return []
  }
}

async function download(url, base) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download ${url}: ${res.status}`)
  const type = res.headers.get('content-type') ?? ''
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const file = `${base}.${ext}`
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return file
}

function toWebp(src, base) {
  const out = `${base}.webp`
  if (src === out) return out
  const filter = `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}`
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', filter, '-c:v', 'libwebp', '-quality', '82', out], { encoding: 'utf8' })
  if (r.status !== 0) {
    console.error('ffmpeg nicht verfügbar oder fehlgeschlagen, WebP übersprungen:', r.stderr || r.error?.message)
    return ''
  }
  return out
}

const taskId = await createTask()
console.log(`Task ${taskId} (${job.model})`)
const data = await waitFor(taskId)
console.log('')
const urls = resultUrls(data)
if (!urls.length) throw new Error(`Kein Ergebnis: ${JSON.stringify(data)}`)
const raw = await download(urls[0], job.out)
console.log(`Roh: ${raw}`)
const webp = toWebp(raw, job.out)
if (webp) console.log(`WebP: ${webp}`)
if (data.costTime) console.log(`Dauer ${data.costTime} ms`)
