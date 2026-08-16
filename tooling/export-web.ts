import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'

const execFileAsync = promisify(execFile)
const mobileRoot = process.cwd().endsWith('/apps/mobile')
  ? process.cwd()
  : resolve(process.cwd(), 'apps/mobile')
const sourceRoot = resolve(mobileRoot, 'src')
const outputRoot = resolve(mobileRoot, 'dist')
const contentRoot = resolve(outputRoot, 'content')
const shardNames = [1, 2, 3, 4, 5].map(
  index => `bundled-content.bulk.shard.${String(index).padStart(3, '0')}.json`,
)

const exportResult = await execFileAsync(
  'npm',
  ['exec', 'expo', '--', 'export', '--platform', 'web'],
  {
    cwd: mobileRoot,
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
    maxBuffer: 10 * 1024 * 1024,
  },
)
process.stdout.write(exportResult.stdout)
process.stderr.write(exportResult.stderr)

await mkdir(contentRoot, { recursive: true })
await Promise.all(
  shardNames.map(name =>
    copyFile(resolve(sourceRoot, name), resolve(contentRoot, name)),
  ),
)
await writeFile(
  resolve(contentRoot, 'manifest.json'),
  `${JSON.stringify({ files: shardNames, version: '2026.08.15' }, null, 2)}\n`,
  'utf8',
)

console.log(
  `Web export ready: ${shardNames.length} local offline shards copied to ${contentRoot}`,
)
