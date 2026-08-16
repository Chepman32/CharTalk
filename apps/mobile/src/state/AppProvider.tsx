import type {
  AppSnapshot,
  CommitChoiceRequest,
  ContentReport,
  CreateRunOptions,
  GrammarProfile,
  LocalProfile,
  ProvisionalChoice,
  ReaderSettings,
  StoryRun,
  SubmitContentReportInput,
} from '@chartalk/app-core'
import {
  diagnosticContentErrorEvent,
  diagnosticLatencyBucketForMs,
  type DiagnosticEvent,
} from '@chartalk/analytics-schema'
import type { ContentPackage } from '@chartalk/content-schema'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { sampleContentPackage, setDownloadedAssetSources } from '@/content'
import {
  mergeDiscoveryCatalog,
  type CachedCatalog,
  type DiscoveryCatalog,
} from '@/catalog'
import { mergeContentPackages } from '@/content-library'
import type { InstalledPackageRecord } from '@/persistence/content-store'
import { createAppRuntime } from '@/persistence/repository'
import type { AppRuntime } from '@/persistence/runtime'
import { installContentPackage } from '@/services/content-package-api'
import { fetchCatalog, type CatalogFetchStatus } from '@/services/catalog-api'
import {
  sendDiagnostic,
  withDiagnosticEventId,
} from '@/services/diagnostics-api'
import { uploadContentReport } from '@/services/report-api'

interface AppContextValue {
  snapshot: AppSnapshot | null
  contentPackages: ContentPackage[]
  catalogPackages: ContentPackage[]
  contentCatalog: ContentPackage
  discoveryCatalog: DiscoveryCatalog
  catalogCache: CachedCatalog | null
  catalogStatus: CatalogFetchStatus | 'loading'
  catalogUpdatedAt: string | null
  installedPackages: InstalledPackageRecord[]
  loading: boolean
  error: string | null
  reportDiagnostic(event: DiagnosticEvent): Promise<void>
  reload(): Promise<void>
  refreshCatalog(): Promise<void>
  clearError(): void
  completeOnboarding(input: {
    displayName: string
    selectedCharacterId: string
    grammarProfile?: GrammarProfile
  }): Promise<void>
  updateProfile(
    patch: Partial<Pick<LocalProfile, 'displayName' | 'grammarProfile'>>,
  ): Promise<void>
  updateSettings(patch: Partial<ReaderSettings>): Promise<void>
  startStory(storyId: string, options?: CreateRunOptions): Promise<StoryRun>
  ensureContentForBuild(
    packId: string | null | undefined,
    buildId: string,
  ): Promise<ContentPackage | null>
  forkRun(runId: string, sequence: number, label?: string): Promise<StoryRun>
  renameRun(runId: string, label: string): Promise<void>
  deleteRun(runId: string): Promise<void>
  getTranscriptAnchor(runId: string): Promise<string | null>
  setTranscriptAnchor(runId: string, entryId: string | null): Promise<void>
  commitChoice(request: CommitChoiceRequest): Promise<StoryRun>
  setProvisional(choice: ProvisionalChoice): Promise<void>
  clearProvisional(runId: string): Promise<void>
  archiveRun(runId: string): Promise<void>
  installContentUpdate(
    packId: string,
    buildId?: string,
  ): Promise<ContentPackage>
  removeContentBuild(packId: string, buildId: string): Promise<void>
  submitContentReport(input: SubmitContentReportInput): Promise<ContentReport>
  deleteAllLocalData(): Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

type DiagnosticFailureMetadata = Partial<
  Pick<
    DiagnosticEvent,
    'contentBuildId' | 'nodeType' | 'latencyBucket' | 'errorCode'
  >
>

const friendlyError = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Не удалось выполнить действие. Попробуйте ещё раз.'

export function AppProvider({ children }: React.PropsWithChildren) {
  const [runtime, setRuntime] = useState<AppRuntime | null>(null)
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [contentPackages, setContentPackages] = useState<ContentPackage[]>([
    sampleContentPackage,
  ])
  const [catalogPackages, setCatalogPackages] = useState<ContentPackage[]>([
    sampleContentPackage,
  ])
  const [installedPackages, setInstalledPackages] = useState<
    InstalledPackageRecord[]
  >([])
  const contentCatalog = useMemo(
    () => mergeContentPackages(catalogPackages),
    [catalogPackages],
  )
  const [catalogCache, setCatalogCache] = useState<CachedCatalog | null>(null)
  const [catalogStatus, setCatalogStatus] = useState<
    CatalogFetchStatus | 'loading'
  >('loading')
  const discoveryCatalog = useMemo(
    () => mergeDiscoveryCatalog(contentCatalog, catalogCache),
    [catalogCache, contentCatalog],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flushingReports = useRef(false)
  const flushingDiagnostics = useRef(false)
  const analyticsEnabled = useRef(false)
  const appOpenedSent = useRef(false)
  const onboardingStartedSent = useRef(false)

  const refreshContent = useCallback(async (activeRuntime: AppRuntime) => {
    const packages = await activeRuntime.contentStore.readContentPackages()
    setDownloadedAssetSources(
      await activeRuntime.mediaStore.resolveAssetUris(packages),
    )
    setContentPackages(packages)
    const installed = new Map(
      activeRuntime.bundledPackageRecords.map(item => [
        `${item.packId}:${item.buildId}`,
        item,
      ]),
    )
    for (const item of await activeRuntime.contentStore.listContentPackages()) {
      installed.set(`${item.packId}:${item.buildId}`, item)
    }
    setInstalledPackages([...installed.values()])
    const catalog = new Map(
      activeRuntime.bundledCatalogPackages.map(item => [
        `${item.manifest.packId}:${item.manifest.buildId}`,
        item,
      ]),
    )
    for (const item of packages) {
      catalog.set(`${item.manifest.packId}:${item.manifest.buildId}`, item)
    }
    setCatalogPackages([...catalog.values()])
  }, [])

  const ensureContentForBuild = useCallback(
    async (
      packId: string | null | undefined,
      buildId: string,
    ): Promise<ContentPackage | null> => {
      if (!runtime) throw new Error('Локальное хранилище ещё запускается.')
      const loaded = contentPackages.find(
        content =>
          content.manifest.buildId === buildId &&
          (!packId || content.manifest.packId === packId) &&
          content.nodes.length > 0,
      )
      if (loaded) return loaded

      const bundled = packId
        ? await runtime.loadBundledContentPackage(packId, buildId)
        : null
      const persisted = bundled
        ? null
        : (await runtime.contentStore.readContentPackages()).find(
            content =>
              content.manifest.buildId === buildId &&
              (!packId || content.manifest.packId === packId),
          )
      const content = bundled ?? persisted
      if (!content) return null

      await runtime.repository.registerContentPackage(content)
      setContentPackages(current => {
        const next = current.filter(
          item => item.manifest.buildId !== content.manifest.buildId,
        )
        return [...next, content]
      })
      setDownloadedAssetSources(
        await runtime.mediaStore.resolveAssetUris([
          ...contentPackages.filter(item => item.nodes.length > 0),
          content,
        ]),
      )
      return content
    },
    [contentPackages, runtime],
  )

  const refreshCatalog = useCallback(async (activeRuntime: AppRuntime) => {
    setCatalogStatus('loading')
    let cached: CachedCatalog | null = null
    try {
      cached = await activeRuntime.catalogStore.readCatalog()
      if (cached) {
        setCatalogCache(cached)
        setCatalogStatus('cached')
      }
    } catch {
      setCatalogStatus('error')
    }

    const result = await fetchCatalog({ cached })
    if (result.cache) {
      try {
        await activeRuntime.catalogStore.writeCatalog(result.cache)
        setCatalogCache(result.cache)
      } catch {
        setCatalogStatus('error')
        return
      }
    }
    if (result.status === 'not-modified') setCatalogStatus('cached')
    else if (result.status === 'fresh') setCatalogStatus('fresh')
    else if (result.status === 'unconfigured') setCatalogStatus('unconfigured')
    else if (result.status === 'unavailable')
      setCatalogStatus(cached ? 'cached' : 'unavailable')
    else setCatalogStatus('invalid')
  }, [])

  const reload = useCallback(async () => {
    if (!runtime) return
    try {
      setSnapshot(await runtime.repository.getSnapshot())
      await refreshContent(runtime)
      void refreshCatalog(runtime)
      setError(null)
    } catch (cause) {
      setError(friendlyError(cause))
    } finally {
      setLoading(false)
    }
  }, [refreshCatalog, refreshContent, runtime])

  const flushDiagnosticOutbox = useCallback(async () => {
    if (!runtime || flushingDiagnostics.current) return

    flushingDiagnostics.current = true
    try {
      if (!analyticsEnabled.current) {
        await runtime.diagnostics.clearOutbox()
        return
      }
      for (const event of await runtime.diagnostics.list()) {
        if (!(await sendDiagnostic(event, true))) break
        await runtime.diagnostics.remove(event.eventId)
      }
    } catch {
      // Diagnostics are best-effort and must never interrupt reading or saves.
    } finally {
      flushingDiagnostics.current = false
    }
  }, [runtime])

  const reportDiagnostic = useCallback(
    async (event: DiagnosticEvent): Promise<void> => {
      if (!runtime || !analyticsEnabled.current) return
      try {
        await runtime.diagnostics.enqueue(withDiagnosticEventId(event))
        await flushDiagnosticOutbox()
      } catch {
        // A diagnostics storage failure must not affect the reader flow.
      }
    },
    [flushDiagnosticOutbox, runtime],
  )

  useEffect(() => {
    let active = true
    void createAppRuntime()
      .then(created => {
        if (!active) return
        setRuntime(created)
      })
      .catch(cause => {
        if (!active) return
        setError(friendlyError(cause))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (runtime) void reload()
  }, [reload, runtime])

  useEffect(() => {
    analyticsEnabled.current = snapshot?.settings.analytics ?? false
    if (runtime && snapshot) void flushDiagnosticOutbox()
    if (analyticsEnabled.current && !appOpenedSent.current) {
      appOpenedSent.current = true
      void reportDiagnostic({
        eventName: 'app_opened',
        contentBuildId: sampleContentPackage.manifest.buildId,
        occurredAt: new Date().toISOString(),
      })
    }
  }, [
    flushDiagnosticOutbox,
    reportDiagnostic,
    runtime,
    snapshot?.settings.analytics,
  ])

  useEffect(() => {
    if (
      !snapshot ||
      snapshot.onboardingComplete ||
      !snapshot.settings.analytics ||
      onboardingStartedSent.current
    ) {
      return
    }
    onboardingStartedSent.current = true
    void reportDiagnostic({
      eventName: 'onboarding_started',
      contentBuildId: sampleContentPackage.manifest.buildId,
      occurredAt: new Date().toISOString(),
    })
  }, [
    reportDiagnostic,
    snapshot?.onboardingComplete,
    snapshot?.settings.analytics,
  ])

  useEffect(() => {
    const queued = snapshot?.reports.filter(
      report => report.status === 'queued' && Boolean(report.consentGrantedAt),
    )
    if (!runtime || !queued?.length || flushingReports.current) return

    flushingReports.current = true
    void (async () => {
      let changed = false
      for (const report of queued) {
        if (await uploadContentReport(report)) {
          await runtime.repository.markReportSent(report.reportId)
          changed = true
        }
      }
      if (changed) setSnapshot(await runtime.repository.getSnapshot())
    })().finally(() => {
      flushingReports.current = false
    })
  }, [runtime, snapshot?.reports])

  const perform = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      getFailureMetadata?: () => DiagnosticFailureMetadata,
    ): Promise<T> => {
      if (!runtime) {
        throw new Error('Локальное хранилище ещё запускается.')
      }
      try {
        const result = await operation()
        setSnapshot(await runtime.repository.getSnapshot())
        setError(null)
        return result
      } catch (cause) {
        const message = friendlyError(cause)
        setError(message)
        const metadata = getFailureMetadata?.() ?? {}
        void reportDiagnostic(
          diagnosticContentErrorEvent({
            contentBuildId:
              metadata.contentBuildId ?? sampleContentPackage.manifest.buildId,
            occurredAt: new Date().toISOString(),
            ...(metadata.nodeType ? { nodeType: metadata.nodeType } : {}),
            ...(metadata.latencyBucket
              ? { latencyBucket: metadata.latencyBucket }
              : {}),
            ...(metadata.errorCode ? { errorCode: metadata.errorCode } : {}),
          }),
        )
        throw cause
      }
    },
    [reportDiagnostic, runtime],
  )

  const getTranscriptAnchor = useCallback(
    (runId: string) =>
      runtime?.repository.getTranscriptAnchor(runId) ?? Promise.resolve(null),
    [runtime],
  )

  const setTranscriptAnchor = useCallback(
    (runId: string, entryId: string | null) =>
      runtime?.repository.setTranscriptAnchor(runId, entryId) ??
      Promise.resolve(),
    [runtime],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      snapshot,
      contentPackages,
      catalogPackages,
      contentCatalog,
      discoveryCatalog,
      catalogCache,
      catalogStatus,
      catalogUpdatedAt: catalogCache?.fetchedAt ?? null,
      installedPackages,
      loading,
      error,
      reportDiagnostic,
      reload,
      refreshCatalog: async () => {
        if (!runtime) return
        await refreshCatalog(runtime)
      },
      clearError: () => setError(null),
      completeOnboarding: async input => {
        await perform(() => runtime!.repository.completeOnboarding(input))
        void reportDiagnostic({
          eventName: 'onboarding_completed',
          contentBuildId: sampleContentPackage.manifest.buildId,
          occurredAt: new Date().toISOString(),
        })
      },
      updateProfile: patch =>
        perform(() => runtime!.repository.updateProfile(patch)).then(() => {}),
      updateSettings: async patch => {
        const shouldReportPreference =
          analyticsEnabled.current &&
          patch.analytics !== false &&
          Object.keys(patch).some(key => key !== 'analytics')
        await perform(() => runtime!.repository.updateSettings(patch))
        if (shouldReportPreference) {
          void reportDiagnostic({
            eventName: 'preference_selected',
            contentBuildId: sampleContentPackage.manifest.buildId,
            occurredAt: new Date().toISOString(),
          })
        }
      },
      ensureContentForBuild,
      startStory: async (storyId, options) => {
        const storyPackage = catalogPackages.find(item =>
          item.stories.some(story => story.storyId === storyId),
        )
        const targetBuildId =
          options?.contentBuildId ?? storyPackage?.manifest.buildId
        if (targetBuildId) {
          await ensureContentForBuild(
            storyPackage?.manifest.packId,
            targetBuildId,
          )
        }
        const run = await perform(() =>
          runtime!.repository.createRun(storyId, options),
        )
        void reportDiagnostic({
          eventName: 'story_started',
          contentBuildId: run.contentBuildId,
          occurredAt: run.startedAt,
        })
        if (options?.safeRouteWarningId) {
          void reportDiagnostic({
            eventName: 'scene_skipped',
            contentBuildId: run.contentBuildId,
            occurredAt: run.startedAt,
          })
        }
        if (run.status === 'completed') {
          void reportDiagnostic({
            eventName: 'ending_reached',
            contentBuildId: run.contentBuildId,
            occurredAt: run.completedAt ?? run.startedAt,
            nodeType: 'ending',
          })
          void reportDiagnostic({
            eventName: 'chapter_completed',
            contentBuildId: run.contentBuildId,
            occurredAt: run.completedAt ?? run.startedAt,
          })
        }
        return run
      },
      forkRun: async (runId, sequence, label) => {
        const source = snapshot?.runs.find(item => item.runId === runId)
        if (source) {
          await ensureContentForBuild(source.packId, source.contentBuildId)
        }
        const run = await perform(() =>
          runtime!.repository.forkRun(runId, sequence, label),
        )
        void reportDiagnostic({
          eventName: 'branch_created',
          contentBuildId: run.contentBuildId,
          occurredAt: run.startedAt,
        })
        return run
      },
      renameRun: (runId, label) =>
        perform(() => runtime!.repository.renameRun(runId, label)),
      deleteRun: runId => perform(() => runtime!.repository.deleteRun(runId)),
      getTranscriptAnchor,
      setTranscriptAnchor,
      commitChoice: async request => {
        const commitStartedAt = Date.now()
        const source = snapshot?.runs.find(run => run.runId === request.runId)
        if (source) {
          await ensureContentForBuild(source.packId, source.contentBuildId)
        }
        const result = await perform(
          () => runtime!.repository.commitChoice(request),
          () => ({
            contentBuildId:
              snapshot?.runs.find(run => run.runId === request.runId)
                ?.contentBuildId ?? sampleContentPackage.manifest.buildId,
            nodeType: 'decision',
            latencyBucket: diagnosticLatencyBucketForMs(
              Math.max(0, Date.now() - commitStartedAt),
            ),
            errorCode: 'CHOICE_COMMIT_FAILED',
          }),
        )
        const latencyBucket = diagnosticLatencyBucketForMs(
          Math.max(0, Date.now() - commitStartedAt),
        )
        void reportDiagnostic({
          eventName: 'choice_committed',
          contentBuildId: result.run.contentBuildId,
          occurredAt: result.event.committedAt,
          nodeType: 'decision',
          latencyBucket,
        })
        const destinationType = contentPackages
          .find(item => item.manifest.buildId === result.run.contentBuildId)
          ?.nodes.find(item => item.nodeId === result.run.activeNodeId)?.type
        const renderedEvent: DiagnosticEvent = {
          eventName: 'response_rendered',
          contentBuildId: result.run.contentBuildId,
          occurredAt: result.event.committedAt,
          latencyBucket,
          ...(destinationType ? { nodeType: destinationType } : {}),
        }
        void reportDiagnostic(renderedEvent)
        if (destinationType === 'checkpoint') {
          void reportDiagnostic({
            eventName: 'checkpoint_reached',
            contentBuildId: result.run.contentBuildId,
            occurredAt: result.event.committedAt,
            nodeType: 'checkpoint',
          })
        }
        if (result.run.status === 'completed') {
          void reportDiagnostic({
            eventName: 'ending_reached',
            contentBuildId: result.run.contentBuildId,
            occurredAt: result.event.committedAt,
            nodeType: 'ending',
          })
          void reportDiagnostic({
            eventName: 'chapter_completed',
            contentBuildId: result.run.contentBuildId,
            occurredAt: result.event.committedAt,
          })
        }
        return result.run
      },
      setProvisional: choice =>
        perform(() => runtime!.repository.setProvisional(choice)),
      clearProvisional: runId =>
        perform(() => runtime!.repository.clearProvisional(runId)),
      archiveRun: runId => perform(() => runtime!.repository.archiveRun(runId)),
      installContentUpdate: async (packId, buildId) => {
        if (!runtime) throw new Error('Локальное хранилище ещё запускается.')
        const requestedBuildId =
          buildId ??
          contentPackages.find(item => item.manifest.packId === packId)
            ?.manifest.buildId ??
          sampleContentPackage.manifest.buildId
        void reportDiagnostic({
          eventName: 'chapter_download_started',
          contentBuildId: requestedBuildId,
          occurredAt: new Date().toISOString(),
        })
        try {
          const content = await installContentPackage({
            packId,
            buildId,
            baseUrl: process.env.EXPO_PUBLIC_CHARTALK_API_URL,
            publicKey: process.env.EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEY,
            publicKeys: process.env.EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEYS,
            contentStore: runtime.contentStore,
            mediaStore: runtime.mediaStore,
            registerContent: value =>
              runtime.repository.registerContentPackage(value),
          })
          await refreshContent(runtime)
          void reportDiagnostic({
            eventName: 'chapter_download_completed',
            contentBuildId: content.manifest.buildId,
            occurredAt: new Date().toISOString(),
          })
          return content
        } catch (cause) {
          void reportDiagnostic({
            eventName: 'chapter_download_failed',
            contentBuildId: requestedBuildId,
            occurredAt: new Date().toISOString(),
            errorCode: 'DOWNLOAD_FAILED',
          })
          throw cause
        }
      },
      removeContentBuild: async (packId, buildId) => {
        if (!runtime) throw new Error('Локальное хранилище ещё запускается.')
        const protectedBuildIds =
          snapshot?.runs
            .filter(run => !run.packId || run.packId === packId)
            .map(run => run.contentBuildId) ?? []
        await runtime.contentStore.removeContentPackage(
          packId,
          buildId,
          protectedBuildIds,
        )
        await runtime.mediaStore.removeContentMedia(packId, buildId)
        await refreshContent(runtime)
      },
      submitContentReport: async input => {
        const report = await perform(() =>
          runtime!.repository.submitContentReport(input),
        )
        if (await uploadContentReport(report)) {
          await perform(() =>
            runtime!.repository.markReportSent(report.reportId),
          )
          void reportDiagnostic({
            eventName: 'content_problem_reported',
            contentBuildId: report.contentBuildId,
            occurredAt: report.createdAt,
          })
          return { ...report, status: 'sent' }
        }
        void reportDiagnostic({
          eventName: 'content_problem_reported',
          contentBuildId: report.contentBuildId,
          occurredAt: report.createdAt,
        })
        return report
      },
      deleteAllLocalData: async () => {
        if (!runtime) throw new Error('Локальное хранилище ещё запускается.')
        await runtime.repository.deleteAllLocalData()
        await runtime.diagnostics.clearOutbox()
        await runtime.catalogStore.clearCatalog()
        setCatalogCache(null)
        setCatalogStatus('loading')
        await runtime.contentStore.resetDownloadedContent()
        await runtime.mediaStore.clearDownloadedMedia()
        await reload()
      },
    }),
    [
      contentPackages,
      catalogPackages,
      contentCatalog,
      catalogCache,
      catalogStatus,
      discoveryCatalog,
      error,
      installedPackages,
      loading,
      getTranscriptAnchor,
      perform,
      ensureContentForBuild,
      reportDiagnostic,
      refreshContent,
      refreshCatalog,
      reload,
      runtime,
      setTranscriptAnchor,
      snapshot,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = (): AppContextValue => {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return value
}
