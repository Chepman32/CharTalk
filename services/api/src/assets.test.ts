import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'

import { loadContentAssetFile, verifyContentAssetFiles } from './assets'

const roots: string[] = []

afterEach(async () => {
  const { rm } = await import('node:fs/promises')
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true })))
})

describe('content asset files', () => {
  it('serves only a verified file scoped to the immutable build', async () => {
    const { mkdtemp } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const root = await mkdtemp(join(tmpdir(), 'razvilka-assets-'))
    roots.push(root)
    const content = structuredClone(sampleContentPackage)
    const asset = content.assets[0]!
    const bytes = new Uint8Array([137, 80, 78, 71])
    asset.path = 'portraits/ira.png'
    asset.provenance = 'original'
    asset.checksum = `sha256:${createHash('sha256').update(bytes).digest('hex')}`
    content.assets = [asset]
    const directory = join(
      root,
      encodeURIComponent(content.manifest.packId),
      encodeURIComponent(content.manifest.buildId),
      'portraits',
    )
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'ira.png'), bytes)

    await expect(
      verifyContentAssetFiles(root, content),
    ).resolves.toBeUndefined()
    const loaded = await loadContentAssetFile(root, content, asset)

    expect(loaded).toMatchObject({
      byteCount: 4,
      contentType: 'image/png',
    })
  })

  it('rejects a digest mismatch', async () => {
    const { mkdtemp } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const root = await mkdtemp(join(tmpdir(), 'razvilka-assets-'))
    roots.push(root)
    const content = structuredClone(sampleContentPackage)
    const asset = content.assets[0]!
    asset.path = 'portrait.png'
    asset.provenance = 'original'
    asset.checksum = `sha256:${'0'.repeat(64)}`
    content.assets = [asset]
    const directory = join(
      root,
      encodeURIComponent(content.manifest.packId),
      encodeURIComponent(content.manifest.buildId),
    )
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'portrait.png'), 'not the signed bytes')

    await expect(verifyContentAssetFiles(root, content)).rejects.toThrow(
      'does not match',
    )
  })
})
