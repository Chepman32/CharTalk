import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'

import type { ContentPackage } from '@chartalk/content-schema'

const encoder = new TextEncoder()

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
    )
    return Object.fromEntries(
      entries.map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

export const canonicalBytes = (value: unknown): Uint8Array =>
  encoder.encode(JSON.stringify(canonicalize(value)))

export const unsignedContentBytes = (content: unknown): Uint8Array => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return canonicalBytes(content)
  }
  const record = content as Record<string, unknown>
  const manifest =
    record.manifest &&
    typeof record.manifest === 'object' &&
    !Array.isArray(record.manifest)
      ? (record.manifest as Record<string, unknown>)
      : {}
  return canonicalBytes({
    ...record,
    manifest: { ...manifest, checksum: '', signature: '' },
  })
}

const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')

export const checksumContentPackage = (content: unknown): string =>
  `sha256:${hex(sha256(unsignedContentBytes(content)))}`

const base64Alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = bytes[index + 1] ?? 0
    const third = bytes[index + 2] ?? 0
    const value = (first << 16) | (second << 8) | third
    output += base64Alphabet[(value >>> 18) & 63]
    output += base64Alphabet[(value >>> 12) & 63]
    if (index + 1 < bytes.length) output += base64Alphabet[(value >>> 6) & 63]
    if (index + 2 < bytes.length) output += base64Alphabet[value & 63]
  }
  return output
}

export const base64UrlDecode = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) {
    throw new Error('Invalid base64url value')
  }
  const output: number[] = []
  let buffer = 0
  let bits = 0
  for (const character of value) {
    const digit = base64Alphabet.indexOf(character)
    if (digit < 0) throw new Error('Invalid base64url value')
    buffer = (buffer << 6) | digit
    bits += 6
    if (bits >= 8) {
      bits -= 8
      output.push((buffer >>> bits) & 0xff)
      buffer &= (1 << bits) - 1
    }
  }
  return Uint8Array.from(output)
}

export const verifySignedContentPackage = (
  content: ContentPackage,
  publicKey: Uint8Array,
): boolean => {
  if (checksumContentPackage(content) !== content.manifest.checksum)
    return false
  if (!content.manifest.signature.startsWith('ed25519:')) return false
  try {
    const signature = base64UrlDecode(
      content.manifest.signature.slice('ed25519:'.length),
    )
    return ed25519.verify(signature, unsignedContentBytes(content), publicKey)
  } catch {
    return false
  }
}

export interface AuthoredPlaceholderIssue {
  path: string
  token: string
  message: string
}

const validateAuthoredText = (
  text: string,
  path: string,
): AuthoredPlaceholderIssue[] => {
  const issues: AuthoredPlaceholderIssue[] = []
  const tokens = text.match(/\{\{.*?\}\}/g) ?? []
  for (const token of tokens) {
    const expression = token.slice(2, -2)
    if (expression === 'name') continue
    if (expression.startsWith('form:')) {
      const forms = expression.slice('form:'.length).split('|')
      if (forms.length === 3 && forms.every(form => form.trim().length > 0)) {
        continue
      }
    }
    issues.push({
      path,
      token,
      message: `Unsupported authored placeholder ${token}`,
    })
  }

  const remainder = text.replace(/\{\{.*?\}\}/g, '')
  if (remainder.includes('{{') || remainder.includes('}}')) {
    issues.push({
      path,
      token: 'malformed',
      message: 'Malformed authored placeholder delimiters',
    })
  }
  return issues
}

const authoredTextEntries = (
  content: ContentPackage,
): Array<{ path: string; text: string }> => {
  const entries: Array<{ path: string; text: string }> = []
  for (const [nodeIndex, node] of content.nodes.entries()) {
    const nodePath = `nodes.${nodeIndex}`
    if (node.type === 'decision') {
      for (const [variantIndex, variant] of node.messageVariants.entries()) {
        for (const [messageIndex, message] of variant.messages.entries()) {
          entries.push({
            path: `${nodePath}.messageVariants.${variantIndex}.messages.${messageIndex}.text`,
            text: message.text,
          })
        }
      }
      for (const [slotIndex, slot] of node.choiceSlots.entries()) {
        for (const [candidateIndex, candidate] of slot.candidates.entries()) {
          entries.push({
            path: `${nodePath}.choiceSlots.${slotIndex}.candidates.${candidateIndex}.text`,
            text: candidate.text,
          })
        }
      }
      continue
    }
    if (
      node.type === 'reaction' ||
      node.type === 'bridge' ||
      node.type === 'ending'
    ) {
      for (const [messageIndex, message] of node.messages.entries()) {
        entries.push({
          path: `${nodePath}.messages.${messageIndex}.text`,
          text: message.text,
        })
      }
    }
    if (node.type === 'ending') {
      entries.push({ path: `${nodePath}.title`, text: node.title })
      for (const [factIndex, fact] of node.epilogueFacts.entries()) {
        entries.push({
          path: `${nodePath}.epilogueFacts.${factIndex}`,
          text: fact,
        })
      }
    }
    if (node.type === 'checkpoint') {
      entries.push({ path: `${nodePath}.label`, text: node.label })
      for (const [factIndex, fact] of node.recapFacts.entries()) {
        entries.push({
          path: `${nodePath}.recapFacts.${factIndex}`,
          text: fact,
        })
      }
    }
  }
  for (const [warningIndex, warning] of content.warnings.entries()) {
    entries.push(
      { path: `warnings.${warningIndex}.summary`, text: warning.summary },
      { path: `warnings.${warningIndex}.detail`, text: warning.detail },
      {
        path: `warnings.${warningIndex}.safeRoute.summary`,
        text: warning.safeRoute.summary,
      },
    )
  }
  return entries
}

export const validateContentPlaceholders = (
  content: ContentPackage,
): AuthoredPlaceholderIssue[] =>
  authoredTextEntries(content).flatMap(({ path, text }) =>
    validateAuthoredText(text, path),
  )

export * from './russian-quality'
