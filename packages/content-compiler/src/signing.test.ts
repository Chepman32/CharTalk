import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'

import { signContentPackage, verifyContentPackage } from './signing'

describe('content package signing', () => {
  it('signs and verifies a canonical package payload with Ed25519', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const signed = signContentPackage(sampleContentPackage, privateKey)

    expect(signed.manifest.signature).toMatch(/^ed25519:/)
    expect(signed.manifest.checksum).toMatch(/^sha256:/)
    expect(verifyContentPackage(signed, publicKey)).toBe(true)
  })

  it('rejects a package changed after signing', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const signed = signContentPackage(sampleContentPackage, privateKey)
    const tampered = {
      ...signed,
      stories: signed.stories.map((story, index) =>
        index === 0 ? { ...story, title: `${story.title} (изменено)` } : story,
      ),
    }

    expect(verifyContentPackage(tampered, publicKey)).toBe(false)
  })

  it('binds the signing key ID into the signed manifest', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const signed = signContentPackage(
      {
        ...sampleContentPackage,
        manifest: {
          ...sampleContentPackage.manifest,
          signingKeyId: 'prod-2026-q3',
        },
      },
      privateKey,
    )

    expect(verifyContentPackage(signed, publicKey)).toBe(true)
    expect(
      verifyContentPackage(
        {
          ...signed,
          manifest: { ...signed.manifest, signingKeyId: 'attacker-key' },
        },
        publicKey,
      ),
    ).toBe(false)
  })
})
