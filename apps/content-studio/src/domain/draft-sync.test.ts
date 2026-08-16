import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  inspectDraftRevision,
  parseDraftEnvelope,
  serializeDraftEnvelope,
  type DraftEnvelope,
} from './draft-sync'

describe('content studio draft synchronization', () => {
  const envelope: DraftEnvelope = {
    schemaVersion: 2,
    revision: 'revision-001',
    content: sampleContentPackage,
    actorId: 'editor.anna',
    auditLog: [],
    lastSavedAt: '2026-08-14T10:00:00.000Z',
  }

  it('round-trips a validated draft envelope without changing the package', () => {
    const serialized = serializeDraftEnvelope(envelope)
    const parsed = parseDraftEnvelope(serialized)

    expect(parsed).toEqual(envelope)
    expect(parsed?.content).not.toBe(sampleContentPackage)
  })

  it('distinguishes missing, same, and conflicting revisions', () => {
    expect(inspectDraftRevision(null, 'revision-001')).toEqual({
      status: 'missing',
    })
    expect(
      inspectDraftRevision(serializeDraftEnvelope(envelope), 'revision-001'),
    ).toEqual({
      status: 'same',
      remoteRevision: 'revision-001',
    })
    expect(
      inspectDraftRevision(serializeDraftEnvelope(envelope), 'revision-002'),
    ).toEqual({
      status: 'conflict',
      remoteRevision: 'revision-001',
    })
  })

  it('treats malformed or schema-incomplete local storage as unsafe to overwrite', () => {
    expect(inspectDraftRevision('{"revision":"remote"}', 'local')).toEqual({
      status: 'invalid',
    })
    expect(inspectDraftRevision('not-json', 'local')).toEqual({
      status: 'invalid',
    })
    expect(parseDraftEnvelope('{"schemaVersion":2,"revision":"x"}')).toBeNull()
  })

  it('rejects a package-shaped object that is not a valid content template', () => {
    const invalid = structuredClone(sampleContentPackage) as Record<
      string,
      unknown
    >
    delete invalid.episodes

    expect(parseDraftEnvelope(JSON.stringify(invalid))).toBeNull()
  })

  it('accepts the pre-revision v2 envelope for a safe migration', () => {
    const legacy = JSON.stringify({
      content: sampleContentPackage,
      actorId: 'editor.legacy',
      auditLog: [],
      lastSavedAt: null,
    })

    expect(parseDraftEnvelope(legacy)).toMatchObject({
      schemaVersion: 2,
      revision: 'legacy-v2',
      actorId: 'editor.legacy',
    })
  })
})
