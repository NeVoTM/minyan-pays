/**
 * Dev-only Postgres when Docker is unavailable (Windows-friendly).
 * DATABASE_URL: postgresql://minyan:minyan@127.0.0.1:5433/minyan_pays
 */
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const port = Number(process.env.EMBEDDED_PG_PORT || 5433)
const dataDir = path.join(root, '.embedded-pg')

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'minyan',
  password: 'minyan',
  port,
  persistent: true,
})

// `initialise()` runs initdb — fails if `.embedded-pg` already has a cluster (non-empty).
const clusterReady = fs.existsSync(path.join(dataDir, 'PG_VERSION'))
if (!clusterReady) {
  await pg.initialise()
}
await pg.start()
try {
  await pg.createDatabase('minyan_pays')
} catch {
  /* already exists */
}

console.log(
  `Embedded Postgres listening on 127.0.0.1:${port} (user minyan, db minyan_pays). Ctrl+C to stop.`
)

async function shutdown() {
  try {
    await pg.stop()
  } finally {
    process.exit(0)
  }
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
setInterval(() => {}, 1 << 30)
