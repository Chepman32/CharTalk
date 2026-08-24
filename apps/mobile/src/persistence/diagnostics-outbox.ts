import type { DiagnosticEvent } from '@razvilka/analytics-schema'

export const MAX_DIAGNOSTIC_OUTBOX_EVENTS = 500

/**
 * Durable, privacy-bounded diagnostics queue. Implementations persist only the
 * shared allowlisted event shape; callers must provide a stable eventId.
 */
export interface DiagnosticOutbox {
  enqueue(event: DiagnosticEvent & { eventId: string }): Promise<void>
  list(limit?: number): Promise<Array<DiagnosticEvent & { eventId: string }>>
  remove(eventId: string): Promise<void>
  clearOutbox(): Promise<void>
}
