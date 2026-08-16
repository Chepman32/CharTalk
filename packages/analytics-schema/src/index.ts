export const diagnosticEventNames = [
  'app_opened',
  'content_error',
  'onboarding_started',
  'onboarding_completed',
  'preference_selected',
  'character_viewed',
  'story_started',
  'chapter_download_started',
  'chapter_download_completed',
  'chapter_download_failed',
  'decision_presented',
  'choice_selected',
  'choice_undone',
  'choice_committed',
  'response_rendered',
  'checkpoint_reached',
  'chapter_completed',
  'ending_reached',
  'recap_viewed',
  'branch_created',
  'timeline_switched',
  'scene_skipped',
  'content_problem_reported',
  'notification_prompt_shown',
  'notification_permission_result',
  'notification_opened',
  'paywall_viewed',
  'purchase_completed',
  'purchase_restored',
  'purchase_failed',
  'content_migration_started',
  'content_migration_completed',
  'content_migration_failed',
  'recovery_performed',
] as const

export type DiagnosticEventName = (typeof diagnosticEventNames)[number]

export const diagnosticNodeTypes = [
  'decision',
  'reaction',
  'bridge',
  'checkpoint',
  'ending',
] as const

export type DiagnosticNodeType = (typeof diagnosticNodeTypes)[number]

export const diagnosticDurationBuckets = [
  'under_1s',
  '1_to_3s',
  'over_3s',
] as const

export type DiagnosticDurationBucket =
  (typeof diagnosticDurationBuckets)[number]

export const diagnosticLatencyBuckets = [
  'under_50ms',
  '50_to_100ms',
  'over_100ms',
] as const

export type DiagnosticLatencyBucket = (typeof diagnosticLatencyBuckets)[number]

/**
 * Convert a local duration into the bounded bucket used by diagnostics.
 * Invalid samples fail closed to the slow bucket so a malformed timer never
 * makes reliability dashboards look healthier than the observed data.
 */
export function diagnosticLatencyBucketForMs(
  durationMs: number,
): DiagnosticLatencyBucket {
  if (!Number.isFinite(durationMs) || durationMs >= 100) return 'over_100ms'
  if (durationMs >= 50) return '50_to_100ms'
  return 'under_50ms'
}

export const diagnosticNetworkClasses = [
  'offline',
  'cellular',
  'wifi',
  'unknown',
] as const

export type DiagnosticNetworkClass = (typeof diagnosticNetworkClasses)[number]

export interface DiagnosticEvent {
  /** Client-generated dedupe key; older clients may omit it. */
  eventId?: string
  eventName: DiagnosticEventName
  contentBuildId: string
  occurredAt: string
  nodeType?: DiagnosticNodeType
  durationBucket?: DiagnosticDurationBucket
  latencyBucket?: DiagnosticLatencyBucket
  optionPosition?: 1 | 2 | 3 | 4
  networkClass?: DiagnosticNetworkClass
  /** Stable allowlisted code only; never a free-form error message. */
  errorCode?: string
}

export type DiagnosticContentErrorContext = Pick<
  DiagnosticEvent,
  'contentBuildId' | 'occurredAt'
> &
  Partial<Pick<DiagnosticEvent, 'nodeType' | 'latencyBucket' | 'errorCode'>>

/**
 * Build the shared content-error event without ever accepting raw exception
 * text or other reader-private data.
 */
export function diagnosticContentErrorEvent(
  context: DiagnosticContentErrorContext,
): DiagnosticEvent {
  return { eventName: 'content_error', ...context }
}
