import {
  sign as nodeSign,
  timingSafeEqual,
  verify as nodeVerify,
  type KeyLike,
} from 'node:crypto'

import {
  checksumContentPackage,
  unsignedContentBytes,
} from '@razvilka/content-integrity'
import type { ContentPackage } from '@razvilka/content-schema'

const unsignedPayload = (content: ContentPackage): Buffer =>
  Buffer.from(unsignedContentBytes(content))

export function signContentPackage(
  content: ContentPackage,
  privateKey: KeyLike,
): ContentPackage {
  const payload = unsignedPayload(content)
  const checksum = checksumContentPackage(content)
  const signature = nodeSign(null, payload, privateKey).toString('base64url')
  return {
    ...content,
    manifest: {
      ...content.manifest,
      checksum,
      signature: `ed25519:${signature}`,
    },
  }
}

export function verifyContentPackage(
  content: ContentPackage,
  publicKey: KeyLike,
): boolean {
  const payload = unsignedPayload(content)
  const expectedChecksum = Buffer.from(checksumContentPackage(content))
  const actualChecksum = Buffer.from(content.manifest.checksum)
  if (
    expectedChecksum.byteLength !== actualChecksum.byteLength ||
    !timingSafeEqual(expectedChecksum, actualChecksum)
  ) {
    return false
  }
  const encodedSignature = content.manifest.signature.replace(/^ed25519:/, '')
  if (encodedSignature === content.manifest.signature) return false
  try {
    return nodeVerify(
      null,
      payload,
      publicKey,
      Buffer.from(encodedSignature, 'base64url'),
    )
  } catch {
    return false
  }
}
