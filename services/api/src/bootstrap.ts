import type { KeyLike } from 'node:crypto'

import { evaluateProductionRelease } from '@razvilka/content-compiler'
import { verifyContentPackage } from '@razvilka/content-compiler/signing'
import {
  contentPackageSchema,
  type ContentPackage,
} from '@razvilka/content-schema'

export function parseBootstrapContent(
  source: string,
  publicKey: KeyLike,
  options: { requireProductionGate?: boolean } = {},
): ContentPackage {
  let raw: unknown
  try {
    raw = JSON.parse(source) as unknown
  } catch {
    throw new Error('Bootstrap content is not valid JSON')
  }

  const parsed = contentPackageSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `Bootstrap content schema is invalid: ${parsed.error.issues[0]?.message}`,
    )
  }
  if (!verifyContentPackage(parsed.data, publicKey)) {
    throw new Error('Bootstrap content signature or checksum is invalid')
  }

  if (options.requireProductionGate !== false) {
    const { gate } = evaluateProductionRelease(parsed.data)
    if (!gate.eligible) {
      throw new Error(
        `Bootstrap content failed the production release gate: ${JSON.stringify(gate)}`,
      )
    }
  }
  return parsed.data
}
