import { ed25519 } from '@noble/curves/ed25519.js'
import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  base64UrlEncode,
  checksumContentPackage,
  unsignedContentBytes,
  validateContentPlaceholders,
  verifySignedContentPackage,
} from './index'

const privateKey = new Uint8Array(32).fill(7)
const publicKey = ed25519.getPublicKey(privateKey)

const signedFixture = () => {
  const unsigned = {
    ...sampleContentPackage,
    manifest: {
      ...sampleContentPackage.manifest,
      checksum: 'sha256:',
      signature: 'ed25519:',
    },
  }
  const bytes = unsignedContentBytes(unsigned)
  return {
    ...unsigned,
    manifest: {
      ...unsigned.manifest,
      checksum: checksumContentPackage(unsigned),
      signature: `ed25519:${base64UrlEncode(ed25519.sign(bytes, privateKey))}`,
    },
  }
}

describe('cross-platform content integrity', () => {
  it('verifies a checksum and Ed25519 signature without Node APIs', () => {
    expect(verifySignedContentPackage(signedFixture(), publicKey)).toBe(true)
  })

  it('rejects changed content, checksum, signature, and malformed key material', () => {
    const signed = signedFixture()
    expect(
      verifySignedContentPackage(
        {
          ...signed,
          stories: [
            { ...signed.stories[0]!, title: 'Подменённая история' },
            ...signed.stories.slice(1),
          ],
        },
        publicKey,
      ),
    ).toBe(false)
    expect(
      verifySignedContentPackage(
        {
          ...signed,
          manifest: { ...signed.manifest, signature: 'ed25519:not-base64!' },
        },
        publicKey,
      ),
    ).toBe(false)
    expect(verifySignedContentPackage(signed, new Uint8Array(3))).toBe(false)
  })

  it('canonicalizes object keys while preserving authored array order', () => {
    const left = unsignedContentBytes({ b: 2, a: [{ z: 1, y: 2 }] })
    const right = unsignedContentBytes({ a: [{ y: 2, z: 1 }], b: 2 })
    expect(left).toEqual(right)
  })

  it('accepts safe name and three-form templates and rejects unknown or malformed ones', () => {
    const valid = structuredClone(sampleContentPackage)
    const validDecision = valid.nodes.find(node => node.type === 'decision')
    if (validDecision?.type !== 'decision') throw new Error('fixture changed')
    validDecision.choiceSlots[0]!.candidates[0]!.text =
      'Слушай, {{name}}, {{form:понял|поняла|теперь понятно}}?'
    expect(validateContentPlaceholders(valid)).toEqual([])

    const invalid = structuredClone(valid)
    const invalidDecision = invalid.nodes.find(node => node.type === 'decision')
    if (invalidDecision?.type !== 'decision') throw new Error('fixture changed')
    invalidDecision.choiceSlots[0]!.candidates[0]!.text =
      '{{nickname}} и {{form:готов||готово}} и {{name}'
    expect(validateContentPlaceholders(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ token: '{{nickname}}' }),
        expect.objectContaining({ token: '{{form:готов||готово}}' }),
        expect.objectContaining({ token: 'malformed' }),
      ]),
    )
  })
})
