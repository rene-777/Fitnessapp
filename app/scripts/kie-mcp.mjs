// Startet den Kie.ai-MCP-Server (@felores/kie-ai-mcp-server) und reicht stdio durch.
// Der API-Key kommt aus der Umgebungsvariable KIE_AI_API_KEY. Fehlt sie im Prozess
// (z. B. weil Claude Desktop vor dem Setzen gestartet wurde), liest PowerShell die
// Benutzervariable direkt aus der Windows-Registrierung (HKCU\Environment).
// Der Key steht nie in einer Datei dieses Repos.
import { spawn, spawnSync } from 'node:child_process'

const NAME = 'KIE_AI_API_KEY'
const PACKAGE = '@felores/kie-ai-mcp-server'

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

const env = { ...process.env, [NAME]: key }
const child =
  process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', `npx -y ${PACKAGE}`], { stdio: 'inherit', env })
    : spawn('npx', ['-y', PACKAGE], { stdio: 'inherit', env })
child.on('exit', (code) => process.exit(code ?? 0))
