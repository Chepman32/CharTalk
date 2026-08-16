import type {
  ChoiceEvent,
  ContentWarning,
  ContentPackage,
  NarrativeMessage,
  NarrativeState,
} from '@chartalk/content-schema'
import { initialNarrativeState } from '@chartalk/content-schema'
import {
  applyChoice,
  applyEffects,
  enterDecision,
  resolveDecision,
} from '@chartalk/dialogue-engine'
import {
  syncOutboxEntrySchema,
  syncRunDescriptorSchema,
  toSyncEvent,
  type SyncOutboxEntry,
  type SyncRunDescriptor,
} from '@chartalk/sync-protocol'

export type TextScale = 'standard' | 'large' | 'extraLarge'
export type GrammarProfile = 'masculine' | 'feminine' | 'neutralPhrasing'
export type ThemePreference = 'system' | 'light' | 'dark' | 'solar' | 'mono'
export type MessageSpeed = 'instant' | 'normal' | 'slow'

export interface ReaderSettings {
  theme: ThemePreference
  sound: boolean
  haptics: boolean
  reduceMotion: boolean
  messageSpeed: MessageSpeed
  revealImmediately: boolean
  textScale: TextScale
  showContentWarnings: boolean
  analytics: boolean
  notifications: boolean
  hiddenContentCategories: ContentWarning['category'][]
}

export const defaultSettings: ReaderSettings = {
  theme: 'system',
  sound: true,
  haptics: true,
  reduceMotion: false,
  messageSpeed: 'normal',
  revealImmediately: false,
  textScale: 'standard',
  showContentWarnings: true,
  analytics: false,
  notifications: false,
  hiddenContentCategories: [],
}

export interface LocalProfile {
  displayName: string
  grammarProfile: GrammarProfile
  selectedCharacterId: string
  createdAt: string
}

export interface TranscriptEntry {
  entryId: string
  speakerId: string
  text: string
  readTimeMs?: number
  choiceId?: string
  assetId?: string
  altText?: string
  messageKind?: 'message' | 'narrative' | 'image'
  kind: 'message' | 'choice' | 'notice'
}

export interface StoryRun {
  runId: string
  storyId: string
  episodeId: string
  characterId: string
  /** Immutable package identity used to recover a missing exact build. */
  packId?: string
  contentBuildId: string
  activeNodeId: string
  sequence: number
  state: NarrativeState
  transcript: TranscriptEntry[]
  events: ChoiceEvent[]
  status: 'active' | 'completed' | 'archived'
  startedAt: string
  updatedAt: string
  completedAt?: string
  endingId?: string
  safeRouteWarningId?: string
  parentRunId?: string
  branchFromSequence?: number
  label?: string
}

export interface RunForkPoint {
  sequence: number
  label: string
  nodeId: string
}

export interface ProvisionalChoice {
  runId: string
  nodeId: string
  choiceId: string
  createdAt: string
  expiresAt: string
}

export type ReportCategory =
  | 'typo'
  | 'continuity'
  | 'intent'
  | 'warning'
  | 'safety'
  | 'technical'
  | 'other'

export interface ContentReport {
  reportId: string
  runId: string | null
  nodeId: string | null
  choiceId: string | null
  contentBuildId: string
  appVersion: string
  platform: string
  diagnosticCode: string | null
  category: ReportCategory
  note: string | null
  status: 'queued' | 'sent'
  consentGrantedAt: string
  createdAt: string
}

export interface SubmitContentReportInput extends Omit<
  ContentReport,
  'reportId' | 'status' | 'consentGrantedAt' | 'createdAt'
> {
  uploadConsent: true
}

export interface AppSnapshot {
  schemaVersion: 4
  onboardingComplete: boolean
  profile: LocalProfile | null
  settings: ReaderSettings
  runs: StoryRun[]
  provisional: ProvisionalChoice | null
  downloadedPackIds: string[]
  reports: ContentReport[]
  /** Local-first events waiting for an authenticated sync transport. */
  syncOutbox?: SyncOutboxEntry[]
}

export interface CommitChoiceRequest {
  runId: string
  operationId: string
  expectedSequence: number
  expectedNodeId: string
  choiceId: string
}

export interface CommitChoiceResult {
  event: ChoiceEvent
  run: StoryRun
}

export interface CreateRunOptions {
  safeRouteWarningId?: string
  /** Used internally to preserve an immutable installed build while forking. */
  contentBuildId?: string
  parentRunId?: string
  branchFromSequence?: number
  label?: string
}

export interface AppRepository {
  getSnapshot(): Promise<AppSnapshot>
  getRun(runId: string): Promise<StoryRun | null>
  getTranscriptAnchor(runId: string): Promise<string | null>
  setTranscriptAnchor(runId: string, entryId: string | null): Promise<void>
  completeOnboarding(input: {
    displayName: string
    selectedCharacterId: string
    grammarProfile?: GrammarProfile
  }): Promise<AppSnapshot>
  updateProfile(
    patch: Partial<Pick<LocalProfile, 'displayName' | 'grammarProfile'>>,
  ): Promise<AppSnapshot>
  updateSettings(patch: Partial<ReaderSettings>): Promise<AppSnapshot>
  createRun(storyId: string, options?: CreateRunOptions): Promise<StoryRun>
  forkRun(runId: string, sequence: number, label?: string): Promise<StoryRun>
  renameRun(runId: string, label: string): Promise<void>
  deleteRun(runId: string): Promise<void>
  registerContentPackage(content: ContentPackage): Promise<void>
  commitChoice(request: CommitChoiceRequest): Promise<CommitChoiceResult>
  setProvisional(choice: ProvisionalChoice): Promise<void>
  clearProvisional(runId: string): Promise<void>
  archiveRun(runId: string): Promise<void>
  submitContentReport(input: SubmitContentReportInput): Promise<ContentReport>
  markReportSent(reportId: string): Promise<void>
  listSyncOutbox(limit?: number): Promise<SyncOutboxEntry[]>
  markSyncEventsAcknowledged(eventIds: readonly string[]): Promise<void>
  markSyncEventAttempt(
    eventId: string,
    errorCode?: string,
    attemptedAt?: string,
  ): Promise<void>
  deleteAllLocalData(): Promise<void>
}

export type ContentLibrary = ContentPackage | readonly ContentPackage[]

export type AppCoreErrorCode =
  | 'RUN_NOT_FOUND'
  | 'STORY_NOT_FOUND'
  | 'EPISODE_NOT_FOUND'
  | 'NODE_NOT_FOUND'
  | 'NODE_NOT_DECISION'
  | 'SEQUENCE_CONFLICT'
  | 'NODE_CONFLICT'
  | 'RUN_LIMIT'
  | 'SAFE_ROUTE_NOT_FOUND'
  | 'CONTENT_BUILD_NOT_FOUND'
  | 'REPORT_CONSENT_REQUIRED'
  | 'PROFILE_NOT_FOUND'
  | 'TEMPLATE_RENDER_FAILED'
  | 'INVALID_BRANCH_POINT'

export class AppCoreError extends Error {
  constructor(
    public readonly code: AppCoreErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AppCoreError'
  }
}

export interface RepositoryOptions {
  now?: () => string
  createId?: () => string
  initialSnapshot?: AppSnapshot
}

const emptySnapshot = (): AppSnapshot => ({
  schemaVersion: 4,
  onboardingComplete: false,
  profile: null,
  settings: { ...defaultSettings },
  runs: [],
  provisional: null,
  downloadedPackIds: [],
  reports: [],
  syncOutbox: [],
})

export const createEmptySnapshot = (): AppSnapshot => clone(emptySnapshot())

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const upgradeSnapshot = (
  snapshot: AppSnapshot,
  contentBuildId: string,
): AppSnapshot => {
  const raw = clone(snapshot) as Omit<
    AppSnapshot,
    'profile' | 'reports' | 'schemaVersion' | 'settings'
  > & {
    schemaVersion?: number
    settings?: Partial<Omit<ReaderSettings, 'textScale'>> & {
      textScale?: TextScale | 'small'
    }
    profile?:
      | (Omit<LocalProfile, 'grammarProfile'> & {
          grammarProfile?: GrammarProfile | 'neutral'
        })
      | null
    reports?: Array<
      Partial<ContentReport> & Pick<ContentReport, 'reportId' | 'category'>
    >
    syncOutbox?: unknown
  }
  const rawTextScale = raw.settings?.textScale
  const textScale: TextScale =
    rawTextScale === 'large' || rawTextScale === 'extraLarge'
      ? rawTextScale
      : 'standard'
  return {
    ...raw,
    schemaVersion: 4,
    profile: raw.profile
      ? {
          ...raw.profile,
          grammarProfile:
            raw.profile.grammarProfile === 'neutral'
              ? 'neutralPhrasing'
              : (raw.profile.grammarProfile ?? 'neutralPhrasing'),
        }
      : null,
    settings: { ...defaultSettings, ...(raw.settings ?? {}), textScale },
    reports: (raw.reports ?? []).map(report => ({
      reportId: report.reportId,
      runId: report.runId ?? null,
      nodeId: report.nodeId ?? null,
      choiceId: report.choiceId ?? null,
      contentBuildId: report.contentBuildId ?? contentBuildId,
      appVersion: report.appVersion ?? 'unknown',
      platform: report.platform ?? 'unknown',
      diagnosticCode: report.diagnosticCode ?? null,
      category: report.category,
      note: report.note ?? null,
      status: report.status ?? 'queued',
      // An older report did not contain explicit upload consent, so it stays local.
      consentGrantedAt: report.consentGrantedAt ?? '',
      createdAt: report.createdAt ?? '',
    })),
    syncOutbox: Array.isArray(raw.syncOutbox)
      ? raw.syncOutbox.flatMap(entry => {
          const parsed = syncOutboxEntrySchema.safeParse(entry)
          return parsed.success ? [parsed.data] : []
        })
      : [],
  }
}

const syncRunDescriptor = (
  run: StoryRun,
  event: ChoiceEvent,
  packId: string,
): SyncRunDescriptor =>
  syncRunDescriptorSchema.parse({
    runId: run.runId,
    storyId: run.storyId,
    episodeId: run.episodeId,
    characterId: run.characterId,
    packId,
    contentBuildId: run.contentBuildId,
    sequence: run.sequence,
    activeNodeId: run.activeNodeId,
    stateHash: event.afterStateHash,
    status: run.status,
    ...(run.parentRunId ? { parentRunId: run.parentRunId } : {}),
    ...(run.branchFromSequence !== undefined
      ? { branchFromSequence: run.branchFromSequence }
      : {}),
    ...(run.label ? { label: run.label } : {}),
  })

const ensureSyncOutbox = (snapshot: AppSnapshot): SyncOutboxEntry[] => {
  snapshot.syncOutbox ??= []
  return snapshot.syncOutbox
}

export const renderAuthoredText = (
  text: string,
  profile: LocalProfile | null,
): string => {
  const selectedForm =
    profile?.grammarProfile === 'masculine'
      ? 0
      : profile?.grammarProfile === 'feminine'
        ? 1
        : 2
  const rendered = text
    .replaceAll('{{name}}', profile?.displayName ?? 'Читатель')
    .replace(
      /\{\{form:([^|{}]*)\|([^|{}]*)\|([^|{}]*)\}\}/g,
      (_token, masculine: string, feminine: string, neutral: string) =>
        [masculine, feminine, neutral][selectedForm] ?? neutral,
    )
  if (/\{\{[^{}]+\}\}/.test(rendered)) {
    throw new AppCoreError(
      'TEMPLATE_RENDER_FAILED',
      'В реплике остался неизвестный placeholder.',
    )
  }
  return rendered
}

const toTranscript = (
  messages: NarrativeMessage[],
  profile: LocalProfile | null,
): TranscriptEntry[] =>
  messages.map(item => ({
    entryId: item.messageId,
    speakerId: item.speakerId,
    text: renderAuthoredText(item.text, profile),
    readTimeMs: item.delayMs,
    ...(item.assetId ? { assetId: item.assetId } : {}),
    ...(item.altText ? { altText: item.altText } : {}),
    messageKind: item.kind,
    kind: 'message',
  }))

const visibleMessages = (
  node: ContentPackage['nodes'][number],
  state: NarrativeState,
): NarrativeMessage[] => {
  if (node.type === 'decision') {
    return resolveDecision(node, state).messages
  }
  if (node.type === 'checkpoint') {
    return []
  }
  return node.messages
}

export const getRunForkPoints = (
  run: StoryRun,
  content: ContentPackage,
): RunForkPoint[] => {
  const nodes = new Map(content.nodes.map(node => [node.nodeId, node]))
  const points = new Map<number, RunForkPoint>([
    [
      0,
      {
        sequence: 0,
        label: 'Начало истории',
        nodeId:
          content.episodes.find(episode => episode.episodeId === run.episodeId)
            ?.entryNodeId ?? run.activeNodeId,
      },
    ],
  ])

  for (const event of run.events) {
    const decision = nodes.get(event.nodeId)
    if (decision?.type !== 'decision') continue
    if (decision.checkpointPolicy === 'before') {
      points.set(event.sequence - 1, {
        sequence: event.sequence - 1,
        label: `Перед выбором ${event.sequence}`,
        nodeId: decision.nodeId,
      })
    }
    if (decision.checkpointPolicy === 'after') {
      points.set(event.sequence, {
        sequence: event.sequence,
        label: `После выбора ${event.sequence}`,
        nodeId: decision.nodeId,
      })
    }

    const candidate = decision.choiceSlots
      .flatMap(slot => slot.candidates)
      .find(choice => choice.choiceId === event.choiceId)
    let nextNodeId = candidate?.nextNodeId
    const visited = new Set<string>()
    while (nextNodeId && !visited.has(nextNodeId)) {
      visited.add(nextNodeId)
      const next = nodes.get(nextNodeId)
      if (!next || next.type === 'decision' || next.type === 'ending') break
      if (next.type === 'checkpoint') {
        points.set(event.sequence, {
          sequence: event.sequence,
          label: next.label,
          nodeId: next.nodeId,
        })
      }
      nextNodeId = next.nextNodeId
    }
  }
  return [...points.values()].sort((left, right) =>
    left.sequence === right.sequence
      ? left.label.localeCompare(right.label, 'ru-RU')
      : left.sequence - right.sequence,
  )
}

const frozenTranscriptPrefix = (
  run: StoryRun,
  sequence: number,
): TranscriptEntry[] => {
  let choicesSeen = 0
  let end = run.transcript.length
  for (const [index, entry] of run.transcript.entries()) {
    if (!entry.choiceId) continue
    if (choicesSeen === sequence) {
      end = index
      break
    }
    choicesSeen += 1
  }
  return run.transcript.slice(0, end)
}

const defaultCreateId = (): string => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  throw new Error('A cryptographically strong UUID provider is required')
}

export class MemoryAppRepository implements AppRepository {
  private snapshot: AppSnapshot
  private readonly transcriptAnchors = new Map<string, string>()
  private readonly contentByBuild: Map<string, ContentPackage>
  private readonly activeContentByStory: Map<string, ContentPackage>
  private readonly nodesByBuild: Map<
    string,
    Map<string, ContentPackage['nodes'][number]>
  >
  private readonly now: () => string
  private readonly createId: () => string

  constructor(contentLibrary: ContentLibrary, options: RepositoryOptions = {}) {
    const contents: ContentPackage[] = Array.isArray(contentLibrary)
      ? Array.from(contentLibrary as readonly ContentPackage[])
      : [contentLibrary as ContentPackage]
    const currentContent = contents.at(-1)
    if (!currentContent) {
      throw new Error('At least one content package is required')
    }
    this.snapshot = upgradeSnapshot(
      options.initialSnapshot ?? emptySnapshot(),
      currentContent.manifest.buildId,
    )
    this.contentByBuild = new Map(
      contents.map(content => [content.manifest.buildId, content]),
    )
    this.nodesByBuild = new Map(
      contents.map(content => [
        content.manifest.buildId,
        new Map(content.nodes.map(node => [node.nodeId, node])),
      ]),
    )
    this.activeContentByStory = new Map()
    for (const content of contents) {
      for (const story of content.stories) {
        this.activeContentByStory.set(story.storyId, content)
      }
    }
    this.now = options.now ?? (() => new Date().toISOString())
    this.createId = options.createId ?? defaultCreateId
  }

  async getSnapshot(): Promise<AppSnapshot> {
    return clone(this.snapshot)
  }

  async getRun(runId: string): Promise<StoryRun | null> {
    const run = this.snapshot.runs.find(item => item.runId === runId)
    return run ? clone(run) : null
  }

  async getTranscriptAnchor(runId: string): Promise<string | null> {
    return this.transcriptAnchors.get(runId) ?? null
  }

  async setTranscriptAnchor(
    runId: string,
    entryId: string | null,
  ): Promise<void> {
    if (entryId) this.transcriptAnchors.set(runId, entryId)
    else this.transcriptAnchors.delete(runId)
  }

  async completeOnboarding(input: {
    displayName: string
    selectedCharacterId: string
    grammarProfile?: GrammarProfile
  }): Promise<AppSnapshot> {
    const displayName = input.displayName.trim().slice(0, 40)
    this.snapshot.profile = {
      displayName: displayName || 'Читатель',
      grammarProfile: input.grammarProfile ?? 'neutralPhrasing',
      selectedCharacterId: input.selectedCharacterId,
      createdAt: this.snapshot.profile?.createdAt ?? this.now(),
    }
    this.snapshot.onboardingComplete = true
    return this.getSnapshot()
  }

  async updateProfile(
    patch: Partial<Pick<LocalProfile, 'displayName' | 'grammarProfile'>>,
  ): Promise<AppSnapshot> {
    if (!this.snapshot.profile) {
      throw new AppCoreError(
        'PROFILE_NOT_FOUND',
        'Локальный профиль не найден.',
      )
    }
    const displayName = patch.displayName?.trim().slice(0, 40)
    this.snapshot.profile = {
      ...this.snapshot.profile,
      ...(patch.grammarProfile ? { grammarProfile: patch.grammarProfile } : {}),
      ...(displayName !== undefined
        ? { displayName: displayName || 'Читатель' }
        : {}),
    }
    return this.getSnapshot()
  }

  async updateSettings(patch: Partial<ReaderSettings>): Promise<AppSnapshot> {
    this.snapshot.settings = { ...this.snapshot.settings, ...patch }
    return this.getSnapshot()
  }

  async registerContentPackage(content: ContentPackage): Promise<void> {
    this.contentByBuild.set(content.manifest.buildId, content)
    this.nodesByBuild.set(
      content.manifest.buildId,
      new Map(content.nodes.map(node => [node.nodeId, node])),
    )
    for (const story of content.stories) {
      this.activeContentByStory.set(story.storyId, content)
    }
  }

  async createRun(
    storyId: string,
    options: CreateRunOptions = {},
  ): Promise<StoryRun> {
    if (
      this.snapshot.runs.filter(
        run => run.status === 'active' && run.storyId === storyId,
      ).length >= 10
    ) {
      throw new AppCoreError(
        'RUN_LIMIT',
        'Для одной истории можно вести не больше 10 активных веток.',
      )
    }

    const content = options.contentBuildId
      ? this.contentByBuild.get(options.contentBuildId)
      : this.activeContentByStory.get(storyId)
    if (!content) {
      throw new AppCoreError(
        options.contentBuildId ? 'CONTENT_BUILD_NOT_FOUND' : 'STORY_NOT_FOUND',
        options.contentBuildId
          ? 'Версия истории для этой ветви не установлена.'
          : 'История не найдена.',
      )
    }
    const story = content.stories.find(item => item.storyId === storyId)
    if (!story) {
      throw new AppCoreError('STORY_NOT_FOUND', 'История не найдена.')
    }
    const episode = content.episodes.find(
      item => item.episodeId === story.episodeIds[0],
    )
    if (!episode) {
      throw new AppCoreError('EPISODE_NOT_FOUND', 'Эпизод не найден.')
    }
    const nodes = this.nodesByBuild.get(content.manifest.buildId)
    const entryNode = nodes?.get(episode.entryNodeId)
    if (!entryNode) {
      throw new AppCoreError('NODE_NOT_FOUND', 'Начальная сцена не найдена.')
    }

    const timestamp = this.now()
    let activeNodeId = entryNode.nodeId
    let state =
      entryNode.type === 'decision'
        ? enterDecision(entryNode, initialNarrativeState())
        : initialNarrativeState()
    let transcript = toTranscript(
      visibleMessages(entryNode, state),
      this.snapshot.profile,
    )
    let status: StoryRun['status'] =
      entryNode.type === 'ending' ? 'completed' : 'active'
    let endingId = entryNode.type === 'ending' ? entryNode.endingId : undefined

    if (options.safeRouteWarningId) {
      const warning = content.warnings.find(
        item =>
          item.warningId === options.safeRouteWarningId &&
          story.warningIds.includes(item.warningId),
      )
      if (!warning?.safeRoute) {
        throw new AppCoreError(
          'SAFE_ROUTE_NOT_FOUND',
          'Безопасный маршрут для этой сцены не задан.',
        )
      }
      const destination = nodes?.get(warning.safeRoute.nextNodeId)
      if (!destination) {
        throw new AppCoreError(
          'NODE_NOT_FOUND',
          'Безопасный маршрут повреждён.',
        )
      }
      activeNodeId = destination.nodeId
      state = applyEffects(state, warning.safeRoute.effects)
      if (destination.type === 'decision')
        state = enterDecision(destination, state)
      transcript = [
        {
          entryId: `${warning.warningId}:safe-route`,
          speakerId: 'system',
          text: renderAuthoredText(
            warning.safeRoute.summary,
            this.snapshot.profile,
          ),
          kind: 'notice',
        },
        ...toTranscript(
          visibleMessages(destination, state),
          this.snapshot.profile,
        ),
      ]
      status = destination.type === 'ending' ? 'completed' : 'active'
      endingId =
        destination.type === 'ending' ? destination.endingId : undefined
    }

    const run: StoryRun = {
      runId: this.createId(),
      storyId,
      episodeId: episode.episodeId,
      characterId: story.characterId,
      packId: content.manifest.packId,
      contentBuildId: content.manifest.buildId,
      activeNodeId,
      sequence: 0,
      state,
      transcript,
      events: [],
      status,
      startedAt: timestamp,
      updatedAt: timestamp,
      ...(status === 'completed' ? { completedAt: timestamp } : {}),
      ...(endingId ? { endingId } : {}),
      ...(options.safeRouteWarningId
        ? { safeRouteWarningId: options.safeRouteWarningId }
        : {}),
      ...(options.parentRunId ? { parentRunId: options.parentRunId } : {}),
      ...(options.branchFromSequence !== undefined
        ? { branchFromSequence: options.branchFromSequence }
        : {}),
      ...(options.label?.trim()
        ? { label: options.label.trim().slice(0, 60) }
        : {}),
    }
    this.snapshot.runs.push(run)
    return clone(run)
  }

  async forkRun(
    runId: string,
    sequence: number,
    label?: string,
  ): Promise<StoryRun> {
    const source = this.snapshot.runs.find(run => run.runId === runId)
    if (!source) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }
    if (
      !Number.isInteger(sequence) ||
      sequence < 0 ||
      sequence > source.events.length
    ) {
      throw new AppCoreError(
        'INVALID_BRANCH_POINT',
        'Точка возврата для этой ветви недоступна.',
      )
    }
    const content = this.contentByBuild.get(source.contentBuildId)
    if (!content) {
      throw new AppCoreError(
        'CONTENT_BUILD_NOT_FOUND',
        'Версия истории для этой ветви не установлена.',
      )
    }
    const allowed = getRunForkPoints(source, content).some(
      point => point.sequence === sequence,
    )
    if (!allowed) {
      throw new AppCoreError(
        'INVALID_BRANCH_POINT',
        'Возврат возможен только к сохранённой точке.',
      )
    }

    const created = await this.createRun(source.storyId, {
      contentBuildId: source.contentBuildId,
      ...(source.safeRouteWarningId
        ? { safeRouteWarningId: source.safeRouteWarningId }
        : {}),
      parentRunId: source.runId,
      branchFromSequence: sequence,
      label: label ?? `Ветка от выбора ${sequence + 1}`,
    })
    try {
      for (const event of source.events.slice(0, sequence)) {
        const current = this.snapshot.runs.find(
          run => run.runId === created.runId,
        )
        if (!current) {
          throw new AppCoreError('RUN_NOT_FOUND', 'Новая ветвь не найдена.')
        }
        await this.commitChoice({
          runId: current.runId,
          operationId: `fork:${created.runId}:${event.operationId}`,
          expectedSequence: current.sequence,
          expectedNodeId: current.activeNodeId,
          choiceId: event.choiceId,
        })
      }
      const stored = this.snapshot.runs.find(run => run.runId === created.runId)
      if (!stored) {
        throw new AppCoreError('RUN_NOT_FOUND', 'Новая ветвь не найдена.')
      }
      stored.transcript = frozenTranscriptPrefix(source, sequence).map(
        (entry, index) => ({
          ...clone(entry),
          entryId: `${stored.runId}:frozen:${index}:${entry.entryId}`,
        }),
      )
      stored.updatedAt = this.now()
      return clone(stored)
    } catch (error) {
      this.snapshot.runs = this.snapshot.runs.filter(
        run => run.runId !== created.runId,
      )
      throw error
    }
  }

  async renameRun(runId: string, label: string): Promise<void> {
    const run = this.snapshot.runs.find(item => item.runId === runId)
    if (!run) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }
    const next = label.trim().slice(0, 60)
    if (next) run.label = next
    else delete run.label
    run.updatedAt = this.now()
  }

  async deleteRun(runId: string): Promise<void> {
    const run = this.snapshot.runs.find(item => item.runId === runId)
    if (!run) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }
    for (const child of this.snapshot.runs) {
      if (child.parentRunId !== runId) continue
      if (run.parentRunId) child.parentRunId = run.parentRunId
      else delete child.parentRunId
    }
    this.snapshot.runs = this.snapshot.runs.filter(item => item.runId !== runId)
    this.snapshot.syncOutbox = ensureSyncOutbox(this.snapshot).filter(
      entry => entry.run.runId !== runId,
    )
    if (this.snapshot.provisional?.runId === runId) {
      this.snapshot.provisional = null
    }
  }

  async commitChoice(
    request: CommitChoiceRequest,
  ): Promise<CommitChoiceResult> {
    const run = this.snapshot.runs.find(item => item.runId === request.runId)
    if (!run) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }

    const duplicate = run.events.find(
      item => item.operationId === request.operationId,
    )
    if (duplicate) {
      return { event: clone(duplicate), run: clone(run) }
    }
    if (run.sequence !== request.expectedSequence) {
      throw new AppCoreError(
        'SEQUENCE_CONFLICT',
        'История уже продвинулась на другом экране.',
      )
    }
    if (run.activeNodeId !== request.expectedNodeId) {
      throw new AppCoreError('NODE_CONFLICT', 'Активная сцена изменилась.')
    }

    const content = this.contentByBuild.get(run.contentBuildId)
    const nodes = this.nodesByBuild.get(run.contentBuildId)
    if (!content || !nodes) {
      throw new AppCoreError(
        'CONTENT_BUILD_NOT_FOUND',
        'Версия истории для этого прохождения не установлена.',
      )
    }
    const node = nodes.get(run.activeNodeId)
    if (!node) {
      throw new AppCoreError('NODE_NOT_FOUND', 'Активная сцена не найдена.')
    }
    if (node.type !== 'decision') {
      throw new AppCoreError(
        'NODE_NOT_DECISION',
        'Эта сцена не принимает выбор.',
      )
    }

    const result = applyChoice({
      runId: run.runId,
      operationId: request.operationId,
      expectedSequence: request.expectedSequence,
      expectedNodeId: request.expectedNodeId,
      choiceId: request.choiceId,
      contentBuildId: run.contentBuildId,
      state: run.state,
      node,
      nodes,
      committedAt: this.now(),
    })
    const destination = nodes.get(result.nextNodeId)
    if (!destination) {
      throw new AppCoreError('NODE_NOT_FOUND', 'Следующая сцена не найдена.')
    }

    run.sequence = result.newSequence
    run.state = result.state
    run.activeNodeId = result.nextNodeId
    run.updatedAt = result.event.committedAt
    run.events.push(result.event)
    ensureSyncOutbox(this.snapshot).push({
      entryId: result.event.eventId,
      event: toSyncEvent(result.event),
      run: syncRunDescriptor(
        run,
        result.event,
        run.packId ?? content.manifest.packId,
      ),
      enqueuedAt: result.event.committedAt,
      attempts: 0,
    })
    run.transcript.push(
      {
        ...result.outgoing,
        text: renderAuthoredText(result.outgoing.text, this.snapshot.profile),
        kind: 'choice',
      },
      ...toTranscript(result.reaction, this.snapshot.profile),
      ...toTranscript(
        visibleMessages(destination, result.state),
        this.snapshot.profile,
      ),
    )

    if (destination.type === 'ending') {
      run.status = 'completed'
      run.completedAt = result.event.committedAt
      run.endingId = destination.endingId
    }
    if (this.snapshot.provisional?.runId === run.runId) {
      this.snapshot.provisional = null
    }
    return { event: clone(result.event), run: clone(run) }
  }

  async setProvisional(choice: ProvisionalChoice): Promise<void> {
    const run = this.snapshot.runs.find(item => item.runId === choice.runId)
    if (!run) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }
    if (run.activeNodeId !== choice.nodeId) {
      throw new AppCoreError('NODE_CONFLICT', 'Активная сцена изменилась.')
    }
    this.snapshot.provisional = clone(choice)
  }

  async clearProvisional(runId: string): Promise<void> {
    if (this.snapshot.provisional?.runId === runId) {
      this.snapshot.provisional = null
    }
  }

  async archiveRun(runId: string): Promise<void> {
    const run = this.snapshot.runs.find(item => item.runId === runId)
    if (!run) {
      throw new AppCoreError('RUN_NOT_FOUND', 'Прохождение не найдено.')
    }
    run.status = 'archived'
    run.updatedAt = this.now()
  }

  async submitContentReport(
    input: SubmitContentReportInput,
  ): Promise<ContentReport> {
    if (input.uploadConsent !== true) {
      throw new AppCoreError(
        'REPORT_CONSENT_REQUIRED',
        'Подтвердите отправку перечисленных технических данных.',
      )
    }
    const timestamp = this.now()
    const report: ContentReport = {
      reportId: this.createId(),
      runId: input.runId,
      nodeId: input.nodeId,
      choiceId: input.choiceId,
      contentBuildId: input.contentBuildId,
      appVersion: input.appVersion,
      platform: input.platform,
      diagnosticCode: input.diagnosticCode,
      category: input.category,
      note: input.note?.trim().slice(0, 500) || null,
      status: 'queued',
      consentGrantedAt: timestamp,
      createdAt: timestamp,
    }
    this.snapshot.reports.push(report)
    return clone(report)
  }

  async markReportSent(reportId: string): Promise<void> {
    const report = this.snapshot.reports.find(
      item => item.reportId === reportId,
    )
    if (report) report.status = 'sent'
  }

  async listSyncOutbox(limit = 100): Promise<SyncOutboxEntry[]> {
    const boundedLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(100, Math.floor(limit)))
      : 100
    return ensureSyncOutbox(this.snapshot)
      .slice()
      .sort(
        (left, right) =>
          left.enqueuedAt.localeCompare(right.enqueuedAt) ||
          left.entryId.localeCompare(right.entryId),
      )
      .slice(0, boundedLimit)
      .map(entry => clone(entry))
  }

  async markSyncEventsAcknowledged(eventIds: readonly string[]): Promise<void> {
    const acknowledged = new Set(eventIds)
    if (acknowledged.size === 0) return
    this.snapshot.syncOutbox = ensureSyncOutbox(this.snapshot).filter(
      entry => !acknowledged.has(entry.event.eventId),
    )
  }

  async markSyncEventAttempt(
    eventId: string,
    errorCode?: string,
    attemptedAt = this.now(),
  ): Promise<void> {
    const entry = ensureSyncOutbox(this.snapshot).find(
      item => item.event.eventId === eventId,
    )
    if (!entry) return
    entry.attempts += 1
    entry.lastAttemptAt = attemptedAt
    if (errorCode?.trim()) entry.lastErrorCode = errorCode.trim().slice(0, 200)
    else delete entry.lastErrorCode
  }

  async deleteAllLocalData(): Promise<void> {
    this.snapshot = emptySnapshot()
  }

  /** Used by durable adapters after a successful transaction. */
  exportSnapshot(): AppSnapshot {
    return clone(this.snapshot)
  }
}

export interface SnapshotMutation<T> {
  snapshot: AppSnapshot
  value: T
}

/**
 * The store owns serialization/transactions. Native uses an exclusive SQLite
 * transaction; web uses a process-local queue around localStorage.
 */
export interface SnapshotStore {
  read(): Promise<AppSnapshot | null>
  transact<T>(
    mutation: (current: AppSnapshot | null) => Promise<SnapshotMutation<T>>,
  ): Promise<T>
  clear(): Promise<void>
  readTranscriptAnchor?(runId: string): Promise<string | null>
  writeTranscriptAnchor?(runId: string, entryId: string | null): Promise<void>
}

export class DurableAppRepository implements AppRepository {
  private readonly contents: ContentPackage[]
  private readonly transcriptAnchorFallback = new Map<string, string>()

  constructor(
    content: ContentLibrary,
    private readonly store: SnapshotStore,
    private readonly options: Omit<RepositoryOptions, 'initialSnapshot'> = {},
  ) {
    this.contents = Array.isArray(content)
      ? Array.from(content as readonly ContentPackage[])
      : [content as ContentPackage]
  }

  private memory(snapshot: AppSnapshot | null): MemoryAppRepository {
    return new MemoryAppRepository(this.contents, {
      ...this.options,
      initialSnapshot: snapshot ?? createEmptySnapshot(),
    })
  }

  private async mutate<T>(
    operation: (repository: MemoryAppRepository) => Promise<T>,
  ): Promise<T> {
    return this.store.transact(async current => {
      const repository = this.memory(current)
      const value = await operation(repository)
      return { snapshot: repository.exportSnapshot(), value }
    })
  }

  async getSnapshot(): Promise<AppSnapshot> {
    return this.memory(await this.store.read()).getSnapshot()
  }

  async getRun(runId: string): Promise<StoryRun | null> {
    return this.memory(await this.store.read()).getRun(runId)
  }

  async getTranscriptAnchor(runId: string): Promise<string | null> {
    if (this.store.readTranscriptAnchor) {
      return this.store.readTranscriptAnchor(runId)
    }
    return this.transcriptAnchorFallback.get(runId) ?? null
  }

  async setTranscriptAnchor(
    runId: string,
    entryId: string | null,
  ): Promise<void> {
    if (this.store.writeTranscriptAnchor) {
      await this.store.writeTranscriptAnchor(runId, entryId)
      return
    }
    if (entryId) this.transcriptAnchorFallback.set(runId, entryId)
    else this.transcriptAnchorFallback.delete(runId)
  }

  async completeOnboarding(input: {
    displayName: string
    selectedCharacterId: string
    grammarProfile?: GrammarProfile
  }): Promise<AppSnapshot> {
    return this.mutate(repository => repository.completeOnboarding(input))
  }

  async updateProfile(
    patch: Partial<Pick<LocalProfile, 'displayName' | 'grammarProfile'>>,
  ): Promise<AppSnapshot> {
    return this.mutate(repository => repository.updateProfile(patch))
  }

  async updateSettings(patch: Partial<ReaderSettings>): Promise<AppSnapshot> {
    return this.mutate(repository => repository.updateSettings(patch))
  }

  async createRun(
    storyId: string,
    options?: CreateRunOptions,
  ): Promise<StoryRun> {
    return this.mutate(repository => repository.createRun(storyId, options))
  }

  async forkRun(
    runId: string,
    sequence: number,
    label?: string,
  ): Promise<StoryRun> {
    return this.mutate(repository => repository.forkRun(runId, sequence, label))
  }

  async renameRun(runId: string, label: string): Promise<void> {
    return this.mutate(repository => repository.renameRun(runId, label))
  }

  async deleteRun(runId: string): Promise<void> {
    await this.mutate(repository => repository.deleteRun(runId))
    await this.setTranscriptAnchor(runId, null)
  }

  async registerContentPackage(content: ContentPackage): Promise<void> {
    const existing = this.contents.findIndex(
      item => item.manifest.buildId === content.manifest.buildId,
    )
    if (existing >= 0) this.contents.splice(existing, 1)
    this.contents.push(content)
  }

  async commitChoice(
    request: CommitChoiceRequest,
  ): Promise<CommitChoiceResult> {
    return this.mutate(repository => repository.commitChoice(request))
  }

  async setProvisional(choice: ProvisionalChoice): Promise<void> {
    return this.mutate(repository => repository.setProvisional(choice))
  }

  async clearProvisional(runId: string): Promise<void> {
    return this.mutate(repository => repository.clearProvisional(runId))
  }

  async archiveRun(runId: string): Promise<void> {
    return this.mutate(repository => repository.archiveRun(runId))
  }

  async submitContentReport(
    input: SubmitContentReportInput,
  ): Promise<ContentReport> {
    return this.mutate(repository => repository.submitContentReport(input))
  }

  async markReportSent(reportId: string): Promise<void> {
    return this.mutate(repository => repository.markReportSent(reportId))
  }

  async listSyncOutbox(limit?: number): Promise<SyncOutboxEntry[]> {
    return this.memory(await this.store.read()).listSyncOutbox(limit)
  }

  async markSyncEventsAcknowledged(eventIds: readonly string[]): Promise<void> {
    return this.mutate(repository =>
      repository.markSyncEventsAcknowledged(eventIds),
    )
  }

  async markSyncEventAttempt(
    eventId: string,
    errorCode?: string,
    attemptedAt?: string,
  ): Promise<void> {
    return this.mutate(repository =>
      repository.markSyncEventAttempt(eventId, errorCode, attemptedAt),
    )
  }

  async deleteAllLocalData(): Promise<void> {
    await this.store.clear()
    this.transcriptAnchorFallback.clear()
  }
}
