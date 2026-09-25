// Erzeugt Job-Dateien aus einer Spezifikation:  node scripts/kie-jobs/make.mjs start|end [spec-datei]
// Standard ist spec.mjs; andere Spezifikationen (z. B. spec-mobility.mjs) exportieren TAG, dann heißen die Ordner batch-<TAG>-<phase>.
// start → batch-start/<key>_start.json (Posenreferenz + Stilreferenzen)
// end   → batch-end/<key>_end.json (eigenes Startbild als erste Referenz, URL aus uploads.json)
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const phase = process.argv[2]
if (!['start', 'end'].includes(phase)) {
  console.error('Aufruf: make.mjs start|end')
  process.exit(1)
}
const specFile = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve('scripts/kie-jobs/spec.mjs')
const { MODEL, STYLE, STYLE_REFS, EXERCISES, TAG, REF_FIELD } = await import(pathToFileURL(specFile).href)
const refField = REF_FIELD ?? 'input_urls'
const registry = 'scripts/kie-jobs/uploads.json'
const uploads = fs.existsSync(registry) ? JSON.parse(fs.readFileSync(registry, 'utf8')) : {}
const url = (k) => {
  const u = uploads[k]?.url
  if (!u) { console.error(`Upload fehlt: ${k}, Job übersprungen`); return '' }
  return u
}
const dir = `scripts/kie-jobs/batch-${TAG ? TAG + '-' : ''}${phase}`
fs.mkdirSync(dir, { recursive: true })
let n = 0
for (const e of EXERCISES) {
  if (phase === 'end' && e.single) continue
  if (phase === 'end' && !uploads[`${e.key}_start`]) { console.error(`Upload fehlt: ${e.key}_start, Job übersprungen`); continue }
  const refs = []
  let prompt
  if (phase === 'start') {
    if (e.poseStart) refs.push(url(e.poseStart))
    refs.push(...STYLE_REFS)
    prompt =
      (e.poseStart
        ? 'The FIRST image shows the body position to copy exactly; the other images define the person and the photo style. '
        : 'The reference images define the person and the photo style. ') +
      STYLE + ' POSE: ' + e.start
  } else {
    refs.push(url(`${e.key}_start`))
    if (e.poseEnd) refs.push(url(e.poseEnd))
    refs.push(STYLE_REFS[0])
    prompt =
      'The FIRST image is the start position of this exercise: keep the same man, clothing, equipment, background, lighting, camera position and framing exactly, and change only the body position. ' +
      (e.poseEnd ? 'The SECOND image shows the body position to copy. ' : '') +
      STYLE + ' POSE: ' + e.end
  }
  const job = { model: MODEL, out: `public/img/gen/${e.key}_${phase}`, input: { prompt, [refField]: refs, aspect_ratio: '3:4', resolution: '1K' } }
  fs.writeFileSync(`${dir}/${e.key}_${phase}.json`, JSON.stringify(job, null, 2) + '\n')
  n++
}
console.log(`${n} Jobs in ${dir}`)
