import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'

import { contentForBuild } from './content-for-run'

describe('contentForBuild', () => {
  it('returns the exact immutable package for a run', () => {
    const newer = structuredClone(sampleContentPackage)
    newer.manifest = {
      ...newer.manifest,
      buildId: 'ru-sample-newer.1',
      contentVersion: '1.1.0',
    }

    expect(
      contentForBuild(
        [sampleContentPackage, newer],
        sampleContentPackage.manifest.buildId,
      ),
    ).toBe(sampleContentPackage)
  })

  it('returns undefined instead of falling back to another build', () => {
    expect(contentForBuild([sampleContentPackage], 'missing-build')).toBe(
      undefined,
    )
  })

  it('does not match a build from a different package', () => {
    const otherPack = structuredClone(sampleContentPackage)
    otherPack.manifest = {
      ...otherPack.manifest,
      packId: 'another-pack',
    }
    expect(
      contentForBuild(
        [otherPack],
        sampleContentPackage.manifest.buildId,
        sampleContentPackage.manifest.packId,
      ),
    ).toBeUndefined()
  })
})
