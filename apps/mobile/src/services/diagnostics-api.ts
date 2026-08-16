import type { DiagnosticEvent } from '@chartalk/analytics-schema'

import { secureServiceBaseUrl } from './secure-endpoint'

export type { DiagnosticEvent } from '@chartalk/analytics-schema'

const createDiagnosticEventId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const withDiagnosticEventId = (
  event: DiagnosticEvent,
): DiagnosticEvent & { eventId: string } => ({
  ...event,
  eventId: event.eventId ?? createDiagnosticEventId(),
})

export const diagnosticPayload = (event: DiagnosticEvent) => {
  const identified = withDiagnosticEventId(event)
  return {
    eventId: identified.eventId,
    eventName: identified.eventName,
    contentBuildId: identified.contentBuildId,
    occurredAt: identified.occurredAt,
    ...(identified.nodeType ? { nodeType: identified.nodeType } : {}),
    ...(identified.durationBucket
      ? { durationBucket: identified.durationBucket }
      : {}),
    ...(identified.latencyBucket
      ? { latencyBucket: identified.latencyBucket }
      : {}),
    ...(identified.optionPosition
      ? { optionPosition: identified.optionPosition }
      : {}),
    ...(identified.networkClass
      ? { networkClass: identified.networkClass }
      : {}),
    ...(identified.errorCode ? { errorCode: identified.errorCode } : {}),
  }
}

interface SendOptions {
  baseUrl?: string | undefined
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
}

export async function sendDiagnostic(
  event: DiagnosticEvent,
  consent: boolean,
  options: SendOptions = {},
): Promise<boolean> {
  const baseUrl = secureServiceBaseUrl(
    options.baseUrl ?? process.env.EXPO_PUBLIC_CHARTALK_API_URL,
  )
  if (!consent || !baseUrl) return false

  try {
    const response = await (options.fetchImpl ?? fetch)(
      `${baseUrl}/v1/diagnostics/events`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(diagnosticPayload(event)),
      },
    )
    return response.ok
  } catch {
    return false
  }
}
