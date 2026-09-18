// Legt Bilder als Raster nebeneinander (Sichtprüfung):  node scripts/montage.mjs <ausgabe.png> <spalten> <bild> …
import { spawnSync } from 'node:child_process'
const [out, colsArg, ...files] = process.argv.slice(2)
const cols = Number(colsArg) || 6
const W = 229, H = 322
const rows = Math.ceil(files.length / cols)
const args = ['-y', '-loglevel', 'error']
for (const f of files) args.push('-i', f)
let fc = ''
for (let i = 0; i < files.length; i++) fc += `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:white[s${i}];`
const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|')
fc += files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:layout=${layout}:fill=white[v]`
args.push('-filter_complex', fc, '-map', '[v]', out)
const r = spawnSync('ffmpeg', args, { encoding: 'utf8' })
if (r.status !== 0) { console.error(r.stderr); process.exit(1) }
console.log(`${out}: ${files.length} Bilder, ${cols} × ${rows}`)
