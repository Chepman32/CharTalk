import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { signContentPackage } from '@chartalk/content-compiler/signing'
import { sampleContentPackage } from '@chartalk/test-fixtures'

import { parseBootstrapContent } from './bootstrap'

const { privateKey, publicKey } = generateKeyPairSync('ed25519')

describe('parseBootstrapContent', () => {
  it('loads a schema-valid package only after signature verification', () => {
    const signed = signContentPackage(sampleContentPackage, privateKey)

    expect(
      parseBootstrapContent(JSON.stringify(signed), publicKey, {
        requireProductionGate: false,
      }).manifest.buildId,
    ).toBe(signed.manifest.buildId)
  })

  it('rejects tampering and blocks fixtures in production mode', () => {
    const signed = signContentPackage(sampleContentPackage, privateKey)
    const tampered = structuredClone(signed)
    tampered.stories[0]!.title = 'Подменённый заголовок'

    expect(() =>
      parseBootstrapContent(JSON.stringify(tampered), publicKey, {
        requireProductionGate: false,
      }),
    ).toThrow(/signature or checksum/i)
    expect(() =>
      parseBootstrapContent(JSON.stringify(signed), publicKey),
    ).toThrow(/production release gate/i)
  })
})
