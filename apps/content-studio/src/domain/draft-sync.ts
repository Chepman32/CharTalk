import {
  contentPackageSchema,
  type ContentPackage,
} from '@razvilka/content-schema'

import type {
  StudioAuditAction,
  StudioAuditEntry,
  StudioAuditField,
} from './studio'

export interface DraftEnvelope {
  schemaVersion: 2
  revision: string
  content: ContentPackage
  actorId: string
  auditLog: StudioAuditEntry[]
  lastSavedAt: string | null
}

export type DraftRevisionInspection =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'same'; remoteRevision: string }
  | { status: 'conflict'; remoteRevision: string }

const clone = <T>(value: T): T => structuredClone(value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

export const parseContentPackage = (value: unknown): ContentPackage | null => {
  const parsed = contentPackageSchema.safeParse(value)
  return parsed.success ? clone(parsed.data) : null
}

const auditActions = new Set<StudioAuditAction>([
  'edit-message',
  'edit-choice',
  'annotation-change',
  'status-change',
  'replace-content',
])
const auditFields = new Set<StudioAuditField>([
  'message',
  'choice',
  'annotation',
  'status',
  'content',
])

const isAuditEntry = (value: unknown): value is StudioAuditEntry => {
  if (!isRecord(value)) return false
  return Boolean(
    typeof value.auditId === 'string' &&
    typeof value.actorId === 'string' &&
    typeof value.action === 'string' &&
    auditActions.has(value.action as StudioAuditAction) &&
    typeof value.field === 'string' &&
    auditFields.has(value.field as StudioAuditField) &&
    (typeof value.nodeId === 'string' || value.nodeId === null) &&
    (value.choiceId === undefined || typeof value.choiceId === 'string') &&
    typeof value.before === 'string' &&
    typeof value.after === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.at === 'string',
  )
}

export function parseDraftEnvelope(raw: string | null): DraftEnvelope | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    const directContent = parseContentPackage(parsed)
    if (directContent) {
      return {
        schemaVersion: 2,
        revision: 'legacy-v1',
        content: directContent,
        actorId: 'local-editor',
        auditLog: [],
        lastSavedAt: null,
      }
    }
    if (!isRecord(parsed)) return null
    const envelopeContent = parseContentPackage(parsed.content)
    if (!envelopeContent) return null
    if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 2)
      return null
    return {
      schemaVersion: 2,
      revision:
        typeof parsed.revision === 'string' && parsed.revision.trim()
          ? parsed.revision
          : 'legacy-v2',
      content: envelopeContent,
      actorId:
        typeof parsed.actorId === 'string' && parsed.actorId.trim()
          ? parsed.actorId
          : 'local-editor',
      auditLog: Array.isArray(parsed.auditLog)
        ? parsed.auditLog.filter(isAuditEntry).map(clone)
        : [],
      lastSavedAt:
        typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : null,
    }
  } catch {
    return null
  }
}

export function serializeDraftEnvelope(envelope: DraftEnvelope): string {
  return JSON.stringify(envelope)
}

export function inspectDraftRevision(
  raw: string | null,
  expectedRevision: string,
): DraftRevisionInspection {
  if (raw === null) return { status: 'missing' }
  const remote = parseDraftEnvelope(raw)
  if (!remote) return { status: 'invalid' }
  return remote.revision === expectedRevision
    ? { status: 'same', remoteRevision: remote.revision }
    : { status: 'conflict', remoteRevision: remote.revision }
}
