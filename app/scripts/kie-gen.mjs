// Bildgenerierung über die Kie.ai-API (createTask + Polling), ohne MCP-Server.
// Der API-Key kommt aus KIE_AI_API_KEY (Umgebung oder Windows-Benutzervariable),
// steht nie in einer Datei dieses Repos.
//
// Aufruf (im Ordner app), ein oder mehrere Jobs, bis zu 4 laufen gleichzeitig:
//   node scripts/kie-gen.mjs --job scripts/kie-jobs/pushup.json [--job weitere.json …]
//   node scripts/kie-gen.mjs --jobs scripts/kie-jobs/batch1     (alle *.json im Ordner)
//
// Job-Datei (JSON):
//   {
//     "model": "nano-banana-pro",          // oder gpt-image-2-image-to-image (Feld input_urls)
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
const jobFiles = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--job' && args[i + 1]) jobFiles.push(args[++i])
  else if (args[i] === '--jobs' && args[i + 1]) {
    const dir = args[++i]
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) jobFiles.push(path.join(dir, f))
  }
}
if (!jobFiles.length) {
  console.error('Aufruf: node scripts/kie-gen.mjs --job <job.json> [--job …] | --jobs <ordner>')
  process.exit(1)
}
const jobs = jobFiles.map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(f, 'utf8')) }))
for (const job of jobs) {
  if (!job.model || !job.out || !job.input) {
    console.error(`${job.file}: Job braucht model, out und input.`)
    process.exit(1)
  }
}
const CONCURRENCY = 4

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function createTask(job) {
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

async function waitFor(taskId, label) {
  const started = Date.now()
  for (;;) {
    const res = await fetch(`${API}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers })
    const body = await res.json()
    const d = body.data ?? {}
    const state = d.state
    if (state === 'success') return d
    if (state === 'fail') throw new Error(`Task fehlgeschlagen: ${d.failCode ?? ''} ${d.failMsg ?? JSON.stringify(body)}`)
    if (Date.now() - started > 10 * 60 * 1000) throw new Error('Zeitüberschreitung (10 min)')
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

async function runJob(job) {
  const label = path.basename(job.out)
  const started = Date.now()
  const taskId = await createTask(job)
  console.log(`${label}: Task ${taskId} (${job.model})`)
  const data = await waitFor(taskId, label)
  const urls = resultUrls(data)
  if (!urls.length) throw new Error(`Kein Ergebnis: ${JSON.stringify(data)}`)
  const raw = await download(urls[0], job.out)
  const webp = toWebp(raw, job.out)
  console.log(`${label}: fertig nach ${Math.round((Date.now() - started) / 1000)} s → ${webp || raw}`)
}

const queue = [...jobs]
const failures = []
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) {
    const job = queue.shift()
    try {
      await runJob(job)
    } catch (e) {
      failures.push(job.file)
      console.error(`${path.basename(job.out)}: FEHLER ${e.message}`)
    }
  }
}))
if (failures.length) {
  console.error(`Fehlgeschlagen: ${failures.join(', ')}`)
  process.exit(1)
}
