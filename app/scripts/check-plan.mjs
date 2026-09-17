// Prüft plan.ts: keine gemischten Sitz-Zustände im Supersatz, Umbauten je Einheit, Hinweis vor jedem Umbau
import fs from 'fs'
const ex = fs.readFileSync('src/data/exercises.ts', 'utf8')
const seat = {}
for (const m of ex.matchAll(/id: '([^']+)', name: '[^']+'[\s\S]*?loadType: '(\w+)',( seat: '(\w+)',)?/g)) seat[m[1]] = m[4]
const lines = fs.readFileSync('src/data/plan.ts', 'utf8').split('\n')
let cur, changes = 0, bad = 0, state, noted = false
for (const [i, l] of lines.entries()) {
  const key = l.match(/key: [`']([^`']+)/)
  if (key) { if (cur) console.log(cur, '-> Umbauten:', changes); cur = key[1]; changes = 0; state = undefined; noted = false }
  if (/^\s+SEAT_(ON|OFF),/.test(l)) { noted = true; continue }
  const ids = [...l.matchAll(/(?:reps|p)\('([^']+)',/g)].map((m) => m[1]).filter((id) => seat[id])
  if (/superset\(/.test(l) && new Set(ids.map((id) => seat[id])).size > 1) { bad++; console.log('KONFLIKT L' + (i + 1), ids.map((id) => id + ':' + seat[id]).join(' ')) }
  for (const id of ids) {
    if (state && state !== seat[id]) { changes++; if (!noted) { bad++; console.log('  Umbau ohne Hinweis, L' + (i + 1), cur, id) } }
    state = seat[id]; noted = false
  }
}
console.log(cur, '-> Umbauten:', changes)
console.log("Probleme:", bad)
process.exit(bad ? 1 : 0)
