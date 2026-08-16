import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { DurableAppRepository } from '@chartalk/app-core'
import {
  base64UrlEncode,
  checksumContentPackage,
  unsignedContentBytes,
} from '@chartalk/content-integrity'
import type { ContentPackage } from '@chartalk/content-schema'
import { resolveDecision } from '@chartalk/dialogue-engine'
import { sampleContentPackage } from '@chartalk/test-fixtures'

import type { ContentPackageStore } from '@/persistence/content-store'
import type { ContentMediaStore } from '@/persistence/media-store'
import { WebSnapshotStore } from '../persistence/web-store'

import {
  ContentInstallError,
  installContentPackage,
  selectTrustedContentKey,
} from './content-package-api'

describe('selectTrustedContentKey', () => {
  it('selects the manifest key from an explicit rotation-safe trust map', () => {
    const keys = JSON.stringify({
      'prod-2026-q2': 'old-public-key',
      'prod-2026-q3': 'new-public-key',
    })

    expect(selectTrustedContentKey('prod-2026-q3', 'legacy-key', keys)).toBe(
      'new-public-key',
    )
  })

  it('refuses an unknown key ID instead of falling back to a different key', () => {
    expect(
      selectTrustedContentKey(
        'attacker-key',
        'legacy-key',
        JSON.stringify({ 'prod-2026-q3': 'trusted-key' }),
      ),
    ).toBeNull()
  })

  it('keeps the legacy single key only for manifests without a key ID', () => {
    expect(selectTrustedContentKey(undefined, 'legacy-key', undefined)).toBe(
      'legacy-key',
    )
    expect(
      selectTrustedContentKey('prod', 'legacy-key', '{bad json'),
    ).toBeNull()
    expect(selectTrustedContentKey(undefined, undefined, undefined)).toBeNull()
    expect(selectTrustedContentKey('prod', undefined, '[]')).toBeNull()
    expect(selectTrustedContentKey('prod', undefined, 'null')).toBeNull()
    expect(
      selectTrustedContentKey('prod', undefined, JSON.stringify({ prod: 42 })),
    ).toBeNull()
    expect(
      selectTrustedContentKey(
        'prod',
        undefined,
        JSON.stringify({ prod: '   ' }),
      ),
    ).toBeNull()
  })
})

describe('installContentPackage', () => {
  const keyId = 'prod-2026-q3'
  let publicKey = ''
  let publicKeys = ''
  let signed: ContentPackage

  let contentStore: ContentPackageStore
  let registerContent: Parameters<
    typeof installContentPackage
  >[0]['registerContent']
  const response = (
    body: string | ContentPackage,
    init?: ResponseInit,
  ): Response =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
      ...init,
    })

  beforeAll(async () => {
    const pair = await globalThis.crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify'],
    )
    publicKey = base64UrlEncode(
      new Uint8Array(
        await globalThis.crypto.subtle.exportKey('raw', pair.publicKey),
      ),
    )
    publicKeys = JSON.stringify({ [keyId]: publicKey })
    const candidate: ContentPackage = {
      ...sampleContentPackage,
      manifest: {
        ...sampleContentPackage.manifest,
        buildId: 'ru-sample-downloaded-2026.08.13.2',
        contentVersion: '1.1.0',
        signingKeyId: keyId,
      },
    }
    const signature = new Uint8Array(
      await globalThis.crypto.subtle.sign(
        { name: 'Ed25519' },
        pair.privateKey,
        Uint8Array.from(unsignedContentBytes(candidate)).buffer,
      ),
    )
    signed = {
      ...candidate,
      manifest: {
        ...candidate.manifest,
        checksum: checksumContentPackage(candidate),
        signature: `ed25519:${base64UrlEncode(signature)}`,
      },
    }
  })

  beforeEach(() => {
    contentStore = {
      readContentPackages: vi.fn(async () => []),
      listContentPackages: vi.fn(async () => []),
      activateContentPackage: vi.fn(async () => {}),
      removeContentPackage: vi.fn(async () => {}),
      resetDownloadedContent: vi.fn(async () => {}),
      availableDiskBytes: vi.fn(async () => null),
    }
    registerContent = vi
      .fn<(content: ContentPackage) => Promise<void>>()
      .mockResolvedValue(undefined)
  })

  const install = (
    overrides: Partial<Parameters<typeof installContentPackage>[0]> = {},
  ) =>
    installContentPackage({
      packId: signed.manifest.packId,
      baseUrl: 'https://content.chartalk.test',
      publicKey: undefined,
      publicKeys,
      contentStore,
      registerContent,
      fetchImpl: vi.fn(async () => response(signed)),
      ...overrides,
    })

  const expectCode = async (
    promise: Promise<ContentPackage>,
    code: ContentInstallError['code'],
  ) => {
    const error = await promise.catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ContentInstallError)
    expect((error as ContentInstallError).code).toBe(code)
  }

  it('downloads, verifies, atomically activates, and registers a signed package', async () => {
    const registerAssetSources = vi.fn()
    const installed = await install({ registerAssetSources })

    expect(installed.manifest.buildId).toBe(signed.manifest.buildId)
    const activation = vi.mocked(contentStore.activateContentPackage).mock
      .calls[0]
    expect(activation?.[0].manifest.signingKeyId).toBe(keyId)
    expect(activation?.[1]).toBeGreaterThan(0)
    expect(registerAssetSources).toHaveBeenCalledWith({})
    expect(registerContent).toHaveBeenCalledOnce()
  })

  it('requests an exact immutable build when a pinned run needs recovery', async () => {
    const fetchImpl = vi.fn(async () => response(signed))
    await install({ buildId: signed.manifest.buildId, fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://content.chartalk.test/v1/content/packages/${encodeURIComponent(
        signed.manifest.packId,
      )}/builds/${encodeURIComponent(signed.manifest.buildId)}`,
      { headers: { accept: 'application/json' } },
    )
  })

  it('completes a verified downloaded episode without another network request', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const fetchImpl = vi.fn(async () => response(signed))
    await install({
      contentStore: store,
      fetchImpl,
      registerContent: async () => {},
    })

    const repository = new DurableAppRepository(
      await store.readContentPackages(),
      store,
    )
    let run = await repository.createRun('story.ira.after-deadline')
    expect(run.contentBuildId).toBe(signed.manifest.buildId)

    for (let turn = 0; run.status === 'active' && turn < 10; turn += 1) {
      const node = signed.nodes.find(item => item.nodeId === run.activeNodeId)
      if (node?.type !== 'decision') {
        throw new Error(`Unexpected active node ${run.activeNodeId}`)
      }
      const choice = resolveDecision(node, run.state).choices[0]
      if (!choice) throw new Error('Downloaded decision has no choice')
      run = (
        await repository.commitChoice({
          runId: run.runId,
          operationId: `offline-turn-${turn}`,
          expectedSequence: run.sequence,
          expectedNodeId: run.activeNodeId,
          choiceId: choice.choiceId,
        })
      ).run
    }

    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(run.status).toBe('completed')
    expect(run.events.length).toBeGreaterThan(0)
    expect(run.transcript.some(entry => entry.speakerId === 'player')).toBe(
      true,
    )
  })

  it('commits verified media and includes its size in the installation record', async () => {
    const commit = vi.fn(async () => ({ 'attachment.one': 'file:///one.webp' }))
    const discard = vi.fn(async () => {})
    const mediaStore: ContentMediaStore = {
      prepareContentMedia: vi.fn(async () => ({
        byteCount: 512,
        commit,
        discard,
      })),
      resolveAssetUris: vi.fn(async () => ({})),
      removeContentMedia: vi.fn(async () => {}),
      clearDownloadedMedia: vi.fn(async () => {}),
    }
    const registerAssetSources = vi.fn()

    await install({ mediaStore, registerAssetSources })

    expect(mediaStore.prepareContentMedia).toHaveBeenCalledWith(
      expect.anything(),
      'https://content.chartalk.test',
    )
    expect(commit).toHaveBeenCalledOnce()
    expect(registerAssetSources).toHaveBeenCalledWith({
      'attachment.one': 'file:///one.webp',
    })
    const activation = vi.mocked(contentStore.activateContentPackage).mock
      .calls[0]
    expect(activation?.[1]).toBeGreaterThan(512)
    expect(discard).not.toHaveBeenCalled()
  })

  it.each([
    [{ baseUrl: undefined, publicKeys: undefined }, 'NOT_CONFIGURED'],
    [{ baseUrl: '', publicKeys: undefined }, 'NOT_CONFIGURED'],
  ] as const)(
    'fails closed when update trust is not configured',
    async (overrides, code) => {
      await expectCode(install(overrides), code)
    },
  )

  it('maps network and HTTP failures without touching the installed package', async () => {
    await expectCode(
      install({
        fetchImpl: vi.fn(async () => Promise.reject(new Error('offline'))),
      }),
      'DOWNLOAD_FAILED',
    )
    await expectCode(
      install({
        fetchImpl: vi.fn(async () => response('{}', { status: 503 })),
      }),
      'DOWNLOAD_FAILED',
    )
    expect(contentStore.activateContentPackage).not.toHaveBeenCalled()
  })

  it('rejects wrong MIME, oversized declarations, and insufficient disk reserve', async () => {
    await expectCode(
      install({
        fetchImpl: vi.fn(
          async () =>
            new Response('{}', {
              headers: { 'content-type': 'text/html' },
            }),
        ),
      }),
      'INVALID_PACKAGE',
    )
    await expectCode(
      install({
        fetchImpl: vi.fn(async () =>
          response('{}', {
            headers: {
              'content-type': 'application/json',
              'content-length': String(51 * 1024 * 1024),
            },
          }),
        ),
      }),
      'PACKAGE_TOO_LARGE',
    )
    vi.mocked(contentStore.availableDiskBytes).mockResolvedValue(1)
    await expectCode(install(), 'INSUFFICIENT_STORAGE')
  })

  it('rejects malformed JSON, schema errors, and a mismatched package ID', async () => {
    await expectCode(
      install({ fetchImpl: vi.fn(async () => response('{')) }),
      'INVALID_PACKAGE',
    )
    await expectCode(
      install({ fetchImpl: vi.fn(async () => response('{}')) }),
      'INVALID_PACKAGE',
    )
    await expectCode(install({ packId: 'pack.other' }), 'INVALID_PACKAGE')
  })

  it('rejects placeholders and engine-incompatible packages before signature work', async () => {
    const placeholder = structuredClone(signed)
    const decision = placeholder.nodes.find(node => node.type === 'decision')
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[0]!.candidates[0]!.text = '{{unknown}}'
    await expectCode(
      install({ fetchImpl: vi.fn(async () => response(placeholder)) }),
      'INVALID_PACKAGE',
    )

    const incompatible = structuredClone(signed)
    incompatible.manifest.minEngineVersion = '2.0.0'
    incompatible.manifest.maxEngineVersion = '2.x'
    await expectCode(
      install({ fetchImpl: vi.fn(async () => response(incompatible)) }),
      'INCOMPATIBLE_ENGINE',
    )
  })

  it('rejects invalid, unknown, and cryptographically incorrect trusted keys', async () => {
    await expectCode(
      install({ publicKeys: JSON.stringify({ [keyId]: '%' }) }),
      'NOT_CONFIGURED',
    )
    await expectCode(
      install({
        publicKeys: JSON.stringify({ 'different-key': publicKey }),
      }),
      'INTEGRITY_FAILED',
    )
    const tampered = structuredClone(signed)
    tampered.stories[0]!.title = 'Подменённый пакет'
    await expectCode(
      install({ fetchImpl: vi.fn(async () => response(tampered)) }),
      'INTEGRITY_FAILED',
    )
  })

  it('surfaces media verification failures and discards staged media on activation failure', async () => {
    const failingMedia: ContentMediaStore = {
      prepareContentMedia: vi.fn(async () => {
        throw new Error('media hash mismatch')
      }),
      resolveAssetUris: vi.fn(async () => ({})),
      removeContentMedia: vi.fn(async () => {}),
      clearDownloadedMedia: vi.fn(async () => {}),
    }
    await expectCode(install({ mediaStore: failingMedia }), 'MEDIA_FAILED')

    const discard = vi.fn(async () => {})
    const stagedMedia: ContentMediaStore = {
      prepareContentMedia: vi.fn(async () => ({
        byteCount: 1,
        commit: async () => ({}),
        discard,
      })),
      resolveAssetUris: vi.fn(async () => ({})),
      removeContentMedia: vi.fn(async () => {}),
      clearDownloadedMedia: vi.fn(async () => {}),
    }
    vi.mocked(contentStore.activateContentPackage).mockRejectedValue(
      new Error('database full'),
    )
    await expect(install({ mediaStore: stagedMedia })).rejects.toThrow(
      'database full',
    )
    expect(discard).toHaveBeenCalledOnce()
  })
})
