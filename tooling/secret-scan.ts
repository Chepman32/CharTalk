import {
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
  type Dirent,
} from 'node:fs'
import { basename, extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface SecretFinding {
  file: string
  line: number
  rule: string
}

interface SecretRule {
  name: string
  pattern: RegExp
}

const secretRules: SecretRule[] = [
  {
    name: 'private key material',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: 'AWS access key ID',
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    name: 'GitHub access token',
    pattern:
      /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{40,255})\b/g,
  },
  {
    name: 'Slack access token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    name: 'Stripe live secret key',
    pattern: /\bsk_live_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: 'OpenAI API key',
    pattern: /\bsk-(?:proj-[A-Za-z0-9_-]{20,}|[A-Za-z0-9]{32,})\b/g,
  },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    name: 'npm access token',
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
  },
]

const credentialAssignment =
  /\b(?:api[_-]?key|client[_-]?secret|password|passwd|token|secret)\b\s*(?:=|:)\s*["'`]([^"'`\s]{20,})["'`]/gi

const nonSecretMarkers = [
  'change-me',
  'development',
  'dummy',
  'example',
  'fixture',
  'not-a-real',
  'placeholder',
  'replace-with',
  'test-',
]

const lineAt = (source: string, index: number): number => {
  let line = 1
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1
  }
  return line
}

const entropy = (value: string): number => {
  const frequencies = new Map<string, number>()
  for (const character of value) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1)
  }
  let result = 0
  for (const count of frequencies.values()) {
    const probability = count / value.length
    result -= probability * Math.log2(probability)
  }
  return result
}

export const scanText = (source: string, file: string): SecretFinding[] => {
  const findings: SecretFinding[] = []

  for (const rule of secretRules) {
    for (const match of source.matchAll(rule.pattern)) {
      findings.push({
        file,
        line: lineAt(source, match.index),
        rule: rule.name,
      })
    }
  }

  for (const match of source.matchAll(credentialAssignment)) {
    const value = match[1] ?? ''
    const normalized = value.toLowerCase()
    if (
      nonSecretMarkers.some(marker => normalized.includes(marker)) ||
      entropy(value) < 3.5
    ) {
      continue
    }
    findings.push({
      file,
      line: lineAt(source, match.index),
      rule: 'embedded credential assignment',
    })
  }

  return findings.sort(
    (left, right) =>
      left.line - right.line || left.rule.localeCompare(right.rule),
  )
}

const ignoredDirectories = new Set([
  '.expo',
  '.git',
  'artifacts',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
])

const textExtensions = new Set([
  '.bash',
  '.cjs',
  '.css',
  '.env',
  '.gradle',
  '.graphql',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.plist',
  '.properties',
  '.scss',
  '.sh',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
  '.zsh',
])

const isTextCandidate = (path: string): boolean => {
  const name = basename(path)
  return (
    textExtensions.has(extname(name).toLowerCase()) ||
    name === 'Dockerfile' ||
    name.startsWith('.env')
  )
}

const collectFiles = (directory: string): string[] => {
  const files: string[] = []
  const entries: Dirent[] = readdirSync(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...collectFiles(path))
      continue
    }
    if (entry.isFile() && isTextCandidate(path)) files.push(path)
  }
  return files
}

export const scanWorkspace = (
  root: string,
): { filesScanned: number; findings: SecretFinding[] } => {
  const absoluteRoot = resolve(root)
  const findings: SecretFinding[] = []
  let filesScanned = 0

  for (const path of collectFiles(absoluteRoot)) {
    const info = lstatSync(path)
    if (info.isSymbolicLink() || statSync(path).size > 2_000_000) continue
    const source = readFileSync(path, 'utf8')
    if (source.includes('\0')) continue
    const file = relative(absoluteRoot, path).split(sep).join('/')
    filesScanned += 1
    findings.push(...scanText(source, file))
  }

  return { filesScanned, findings }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = scanWorkspace(process.cwd())
  if (result.findings.length > 0) {
    for (const finding of result.findings) {
      console.error(
        `${finding.file}:${finding.line} [${finding.rule}] potential secret detected`,
      )
    }
    console.error(
      `Secret scan failed with ${result.findings.length} finding(s).`,
    )
    process.exitCode = 1
  } else {
    console.info(`Secret scan passed (${result.filesScanned} text files).`)
  }
}
