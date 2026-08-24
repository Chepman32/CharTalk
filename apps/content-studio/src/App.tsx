import type {
  ContentNode,
  ContentPackage,
  DecisionNode,
} from '@razvilka/content-schema'
import {
  auditRussianQuality,
  type RussianQualityIssue,
} from '@razvilka/content-integrity'
import { sampleContentPackage } from '@razvilka/test-fixtures'
import {
  ArrowCounterClockwise,
  ArrowRight,
  BookOpenText,
  BracketsCurly,
  CheckCircle,
  CloudArrowUp,
  DownloadSimple,
  FloppyDisk,
  FlowArrow,
  Gauge,
  ListChecks,
  MagnifyingGlass,
  Play,
  ShieldWarning,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'

import brandMark from '../../mobile/assets/brand-mark.svg'
import {
  chooseInSimulator,
  canTransitionEditorialStatus,
  createSimulator,
  createStudioState,
  releaseReadiness,
  searchContent,
  securePublishBaseUrl,
  studioReducer,
  type StudioAuditEntry,
  type StudioState,
  type StudioStateOptions,
  type SimulatorState,
  type StudioView,
  type TextAnnotation,
} from './domain/studio'
import {
  inspectDraftRevision,
  parseContentPackage,
  parseDraftEnvelope,
  serializeDraftEnvelope,
  type DraftEnvelope,
} from './domain/draft-sync'
import {
  counterfactualRows,
  findOverusedNgrams,
  nodeReferences,
  type CounterfactualRow,
  type GraphReference,
  type OverusedNgram,
} from './domain/review'
import { diffContentPackages, type ContentDiff } from './domain/content-diff'
import { grammarPreviewRows } from './domain/text-preview'

const DRAFT_KEY = 'razvilka.studio.draft.v2'
const LEGACY_DRAFT_KEY = 'razvilka.studio.draft.v1'

const navItems: { id: StudioView; label: string; icon: typeof Gauge }[] = [
  { id: 'overview', label: 'Обзор', icon: Gauge },
  { id: 'content', label: 'Контент', icon: BookOpenText },
  { id: 'graph', label: 'Граф', icon: FlowArrow },
  { id: 'simulator', label: 'Симулятор', icon: Play },
  { id: 'review', label: 'Ревью', icon: ListChecks },
  { id: 'release', label: 'Выпуск', icon: CloudArrowUp },
]

interface InitialDraft {
  state: StudioState
  revision: string
}

const loadInitial = (): InitialDraft => {
  try {
    const stored = parseDraftEnvelope(localStorage.getItem(DRAFT_KEY))
    if (stored) {
      const options: StudioStateOptions = {
        auditLog: stored.auditLog,
      }
      if (stored.actorId) options.actorId = stored.actorId
      return {
        state: createStudioState(stored.content, options),
        revision: stored.revision,
      }
    }

    const legacy = parseDraftEnvelope(localStorage.getItem(LEGACY_DRAFT_KEY))
    if (legacy) {
      return {
        state: createStudioState(legacy.content),
        revision: legacy.revision,
      }
    }
  } catch {
    // Corrupt local drafts are ignored; the signed fixture remains available.
  }
  return {
    state: createStudioState(sampleContentPackage),
    revision: 'fresh',
  }
}

const nodeText = (node: ContentNode): string => {
  if (node.type === 'decision')
    return node.messageVariants[0]?.messages[0]?.text ?? ''
  if (node.type === 'checkpoint') return node.label
  if (node.type === 'ending') return node.messages[0]?.text ?? node.title
  return node.messages[0]?.text ?? ''
}

const statusLabel: Record<ContentNode['editorial']['status'], string> = {
  outline: 'План',
  'graph-ready': 'Граф готов',
  draft: 'Черновик',
  'voice-review': 'Голос',
  'continuity-review': 'Связность',
  'rating-review': 'Рейтинг',
  'logic-qa': 'Проверка логики',
  'device-qa': 'Проверка устройства',
  qa: 'Контроль качества',
  approved: 'Одобрено',
  scheduled: 'Запланировано',
  published: 'Опубликовано',
  deprecated: 'Устарело',
  fixture: 'Фикстура',
}

export function App() {
  const [initialDraft] = useState(loadInitial)
  const [state, dispatch] = useReducer(studioReducer, initialDraft.state)
  const [simulator, setSimulator] = useState<SimulatorState>(() =>
    createSimulator(state.content, state.content.stories[0]!.storyId),
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [apiUrl, setApiUrl] = useState(
    () =>
      localStorage.getItem('razvilka.studio.api') ?? 'http://localhost:8787',
  )
  const [adminToken, setAdminToken] = useState('')
  const [signingKeyId, setSigningKeyId] = useState(
    () => state.content.manifest.signingKeyId ?? '',
  )
  const importRef = useRef<HTMLInputElement>(null)
  const auditCounter = useRef(0)
  const revisionCounter = useRef(0)
  const draftRevision = useRef(initialDraft.revision)
  const [draftConflict, setDraftConflict] = useState<string | null>(null)
  const releaseContent = useMemo<ContentPackage>(
    () => ({
      ...state.content,
      manifest: {
        ...state.content.manifest,
        ...(signingKeyId.trim() ? { signingKeyId: signingKeyId.trim() } : {}),
      },
    }),
    [signingKeyId, state.content],
  )
  const readiness = useMemo(
    () => releaseReadiness(releaseContent),
    [releaseContent],
  )
  const searchResults = useMemo(
    () => searchContent(state.content, state.query),
    [state.content, state.query],
  )
  const selectedNode = state.content.nodes.find(
    node => node.nodeId === state.selectedNodeId,
  )

  useEffect(() => {
    const persist = (rotateRevision: boolean): boolean => {
      let inspection
      try {
        inspection = inspectDraftRevision(
          localStorage.getItem(DRAFT_KEY),
          draftRevision.current,
        )
      } catch {
        setDraftConflict('storage')
        return false
      }
      if (inspection.status === 'conflict') {
        setDraftConflict(inspection.remoteRevision)
        return false
      }
      if (inspection.status === 'invalid') {
        setDraftConflict('invalid')
        return false
      }
      const revision = rotateRevision
        ? (() => {
            revisionCounter.current += 1
            return `browser-${Date.now()}-${revisionCounter.current}`
          })()
        : draftRevision.current
      const envelope: DraftEnvelope = {
        schemaVersion: 2,
        revision,
        content: state.content,
        actorId: state.actorId,
        auditLog: state.auditLog,
        lastSavedAt: state.lastSavedAt,
      }
      try {
        localStorage.setItem(DRAFT_KEY, serializeDraftEnvelope(envelope))
        draftRevision.current = revision
        return true
      } catch {
        setDraftConflict('storage')
        return false
      }
    }
    if (!state.dirty) {
      persist(false)
      return
    }
    const timer = window.setTimeout(() => {
      if (persist(true))
        dispatch({ type: 'mark_saved', at: new Date().toISOString() })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [
    state.actorId,
    state.auditLog,
    state.content,
    state.dirty,
    state.lastSavedAt,
  ])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRAFT_KEY || event.newValue === null) return
      const inspection = inspectDraftRevision(
        event.newValue,
        draftRevision.current,
      )
      if (inspection.status === 'conflict')
        setDraftConflict(inspection.remoteRevision)
      else if (inspection.status === 'invalid') setDraftConflict('invalid')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const auditContext = () => {
    auditCounter.current += 1
    return {
      auditId: `browser-${Date.now()}-${auditCounter.current}`,
      actorId: state.actorId,
      reason: state.editReason,
      at: new Date().toISOString(),
    }
  }

  const changeView = (view: StudioView) => {
    dispatch({ type: 'set_view', view })
    dispatch({ type: 'set_query', query: '' })
  }

  const selectResult = (id: string, kind: 'character' | 'story' | 'node') => {
    if (kind === 'node') dispatch({ type: 'select_node', nodeId: id })
    else changeView('content')
    dispatch({ type: 'set_query', query: '' })
  }

  const resetSimulator = (storyId = simulator.storyId) => {
    setSimulator(createSimulator(state.content, storyId))
    setNotice('Симуляция перезапущена с чистым состоянием.')
  }

  const exportDraft = () => {
    const blob = new Blob([JSON.stringify(releaseContent, null, 2)], {
      type: 'application/json',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${releaseContent.manifest.buildId}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setNotice('JSON-пакет экспортирован.')
  }

  const importDraft = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = parseContentPackage(JSON.parse(await file.text()))
      if (!parsed) throw new Error('invalid content package')
      dispatch({
        type: 'replace_content',
        content: parsed,
        audit: auditContext(),
      })
      setSigningKeyId(parsed.manifest.signingKeyId ?? '')
      setSimulator(createSimulator(parsed, parsed.stories[0]!.storyId))
      setNotice(`Импортирован ${file.name}. Запустите проверку перед работой.`)
      setPublishError(null)
    } catch {
      setPublishError(
        'Файл не удалось прочитать как пакет приложения «Развилка».',
      )
    } finally {
      event.target.value = ''
    }
  }

  const publish = async (confirmedBuildId: string) => {
    if (draftConflict) {
      setPublishError(
        'Публикация остановлена: сначала разрешите конфликт локального черновика.',
      )
      return
    }
    if (
      !readiness.ready ||
      !adminToken.trim() ||
      confirmedBuildId !== releaseContent.manifest.buildId
    )
      return
    const publishBaseUrl = securePublishBaseUrl(apiUrl)
    if (!publishBaseUrl) {
      setPublishError(
        'Для публикации нужен HTTPS-адрес. HTTP разрешён только для localhost.',
      )
      return
    }
    setPublishing(true)
    setPublishError(null)
    localStorage.setItem('razvilka.studio.api', publishBaseUrl)
    try {
      const response = await fetch(
        `${publishBaseUrl}/v1/admin/content/publish`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${adminToken}`,
            'content-type': 'application/json',
            'x-razvilka-confirm-build-id': confirmedBuildId,
          },
          body: JSON.stringify(releaseContent),
        },
      )
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string }
        throw new Error(body.detail ?? `HTTP ${response.status}`)
      }
      setNotice('Пакет подписан и опубликован.')
      setAdminToken('')
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : 'Не удалось опубликовать пакет.',
      )
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="Навигация студии">
        <div className="brand-lockup">
          <img src={brandMark} alt="" width="38" height="38" />
          <div>
            <strong>Развилка</strong>
            <span>Content Studio</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <button
                className={
                  state.view === item.id ? 'nav-item is-active' : 'nav-item'
                }
                key={item.id}
                onClick={() => changeView(item.id)}
                type="button"
              >
                <Icon
                  size={19}
                  weight={state.view === item.id ? 'fill' : 'regular'}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="rail-meta">
          <span className="eyebrow">Сборка</span>
          <code>{state.content.manifest.buildId}</code>
          <span
            className={
              readiness.ready ? 'status-dot is-ok' : 'status-dot is-warn'
            }
          >
            {readiness.ready ? 'Готово к выпуску' : 'Есть блокеры'}
          </span>
        </div>
      </aside>

      <main className="studio-main">
        <header className="utility-bar">
          <div className="search-wrap">
            <MagnifyingGlass aria-hidden="true" size={19} />
            <input
              aria-label="Поиск по ID и тексту"
              onChange={event =>
                dispatch({ type: 'set_query', query: event.target.value })
              }
              placeholder="ID, реплика или история…"
              type="search"
              value={state.query}
            />
            <kbd>⌘ K</kbd>
            {state.query ? (
              <div className="search-results" role="listbox">
                {searchResults.length ? (
                  searchResults.map(result => (
                    <button
                      key={`${result.kind}:${result.id}`}
                      onClick={() => selectResult(result.id, result.kind)}
                      type="button"
                    >
                      <span className="result-kind">{result.kind}</span>
                      <strong>{result.label}</strong>
                      <span>{result.detail}</span>
                    </button>
                  ))
                ) : (
                  <p>Совпадений нет.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="utility-actions">
            <span
              className={
                draftConflict
                  ? 'save-state is-conflict'
                  : state.dirty
                    ? 'save-state is-dirty'
                    : 'save-state'
              }
            >
              <FloppyDisk size={17} />{' '}
              {draftConflict
                ? 'Сохранение остановлено'
                : state.dirty
                  ? 'Сохраняем…'
                  : 'Черновик сохранён'}
            </span>
            <button
              className="button secondary"
              onClick={() => changeView('release')}
              type="button"
            >
              <ShieldWarning size={18} /> Проверить
            </button>
          </div>
        </header>

        {notice ? (
          <div className="notice success" role="status">
            <CheckCircle size={19} weight="fill" />
            <span>{notice}</span>
            <button
              aria-label="Закрыть уведомление"
              onClick={() => setNotice(null)}
              type="button"
            >
              <X size={17} />
            </button>
          </div>
        ) : null}
        {publishError ? (
          <div className="notice error" role="alert">
            <WarningCircle size={19} weight="fill" />
            <span>{publishError}</span>
            <button
              aria-label="Закрыть ошибку"
              onClick={() => setPublishError(null)}
              type="button"
            >
              <X size={17} />
            </button>
          </div>
        ) : null}
        {draftConflict ? (
          <div className="notice error draft-conflict" role="alert">
            <WarningCircle size={19} weight="fill" />
            <span>
              {draftConflict === 'invalid'
                ? 'Локальный черновик повреждён.'
                : draftConflict === 'storage'
                  ? 'Локальное хранилище недоступно.'
                  : `Этот черновик уже изменён в другой вкладке (ревизия ${draftConflict}).`}{' '}
              Редактирование заблокировано, чтобы не потерять чужие изменения.
            </span>
            <button
              className="button secondary"
              onClick={exportDraft}
              type="button"
            >
              Сохранить мой вариант
            </button>
            <button
              className="button secondary"
              onClick={() => window.location.reload()}
              type="button"
            >
              Перезагрузить
            </button>
          </div>
        ) : null}

        {state.view === 'overview' ? (
          <Overview
            content={releaseContent}
            readiness={readiness}
            onOpen={changeView}
          />
        ) : null}
        {state.view === 'content' ? (
          <ContentWorkbench
            actorId={state.actorId}
            auditLog={state.auditLog}
            content={state.content}
            editReason={state.editReason}
            readOnly={Boolean(draftConflict)}
            selectedNode={selectedNode}
            onActorChange={actorId =>
              dispatch({ type: 'set_actor_id', actorId })
            }
            onEditReasonChange={reason =>
              dispatch({ type: 'set_edit_reason', reason })
            }
            onSelect={nodeId => dispatch({ type: 'select_node', nodeId })}
            onMessageChange={(nodeId, text) =>
              dispatch({
                type: 'edit_message',
                nodeId,
                text,
                audit: auditContext(),
              })
            }
            onChoiceChange={(nodeId, choiceId, text) =>
              dispatch({
                type: 'edit_choice',
                nodeId,
                choiceId,
                text,
                audit: auditContext(),
              })
            }
            onAnnotationChange={(nodeId, unitId, annotation) =>
              dispatch({
                type: 'set_text_annotation',
                nodeId,
                unitId,
                annotation,
                audit: auditContext(),
              })
            }
            onStatusChange={(nodeId, status) =>
              dispatch({
                type: 'set_editorial_status',
                nodeId,
                status,
                audit: auditContext(),
              })
            }
          />
        ) : null}
        {state.view === 'graph' ? (
          <GraphView
            content={state.content}
            onSelect={nodeId => dispatch({ type: 'select_node', nodeId })}
          />
        ) : null}
        {state.view === 'review' ? (
          <ReviewView
            baselineContent={initialDraft.state.content}
            content={state.content}
            onSelect={nodeId => dispatch({ type: 'select_node', nodeId })}
            readiness={readiness}
          />
        ) : null}
        {state.view === 'simulator' ? (
          <SimulatorView
            content={state.content}
            simulator={simulator}
            onChoose={choiceId =>
              setSimulator(current =>
                chooseInSimulator(state.content, current, choiceId),
              )
            }
            onReset={resetSimulator}
            onStoryChange={resetSimulator}
          />
        ) : null}
        {state.view === 'release' ? (
          <ReleaseView
            adminToken={adminToken}
            apiUrl={apiUrl}
            content={releaseContent}
            onAdminToken={setAdminToken}
            onApiUrl={setApiUrl}
            onExport={exportDraft}
            onImport={() => importRef.current?.click()}
            onPublish={confirmedBuildId => void publish(confirmedBuildId)}
            onSigningKeyId={setSigningKeyId}
            publishing={publishing}
            readiness={readiness}
            signingKeyId={signingKeyId}
          />
        ) : null}
        <input
          ref={importRef}
          accept="application/json,.json"
          hidden
          onChange={event => void importDraft(event)}
          type="file"
        />
      </main>
    </div>
  )
}

type Readiness = ReturnType<typeof releaseReadiness>

function Overview({
  content,
  readiness,
  onOpen,
}: {
  content: ContentPackage
  readiness: Readiness
  onOpen(view: StudioView): void
}) {
  const approvedPercent = Math.round(
    (readiness.report.counts.approvedTextUnitCount /
      readiness.requiredApprovedTextUnits) *
      100,
  )
  return (
    <section className="page" aria-labelledby="overview-title">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Рабочая сводка</span>
          <h1 id="overview-title">Контент перед выпуском</h1>
        </div>
        <p>
          Структура проходит автоматически. Голос, связность и чувствительность
          подтверждают люди.
        </p>
      </div>
      <div className="status-strip">
        <Metric value={content.stories.length} label="истории" />
        <Metric
          value={readiness.report.counts.choiceCandidateCount}
          label="вариантов ответа"
        />
        <Metric
          value={readiness.report.counts.uniquePublishedTextUnitCount}
          label="уникальных единиц"
        />
        <Metric
          value={readiness.report.blockers.length}
          label="структурных блокеров"
          tone={readiness.report.blockers.length ? 'warn' : 'ok'}
        />
      </div>
      <div className="overview-grid">
        <article className="editorial-panel release-progress">
          <div className="panel-heading">
            <span className="eyebrow">OQ-09 · Порог запуска</span>
            <h2>300 000 одобренных единиц</h2>
          </div>
          <div
            className="progress-track"
            aria-label={`${approvedPercent}% готово`}
          >
            <span style={{ width: `${Math.min(approvedPercent, 100)}%` }} />
          </div>
          <div className="progress-copy">
            <strong>
              {readiness.report.counts.approvedTextUnitCount.toLocaleString(
                'ru-RU',
              )}
            </strong>
            <span>
              из {readiness.requiredApprovedTextUnits.toLocaleString('ru-RU')}
            </span>
          </div>
          <p>
            Фикстура позволяет проверить продукт, но не считается опубликованным
            человеческим контентом.
          </p>
          <button
            className="text-link"
            onClick={() => onOpen('release')}
            type="button"
          >
            Открыть выпуск <ArrowRight size={17} />
          </button>
        </article>
        <article className="editorial-panel queue-panel">
          <div className="panel-heading">
            <span className="eyebrow">Очередь редакции</span>
            <h2>Следующие проходы</h2>
          </div>
          <QueueLine
            count={readiness.nonApprovedNodes}
            label="узлов ждут человеческого одобрения"
          />
          <QueueLine
            count={readiness.fixtureAssets}
            label="визуальных фикстур требуют замены или лицензии"
          />
          <QueueLine
            count={readiness.report.warnings.length}
            label="предупреждений компилятора"
          />
          <button
            className="text-link"
            onClick={() => onOpen('content')}
            type="button"
          >
            Перейти к узлам <ArrowRight size={17} />
          </button>
        </article>
      </div>
      <section className="story-ledger" aria-labelledby="stories-heading">
        <div className="panel-heading">
          <span className="eyebrow">Пакет ru-RU</span>
          <h2 id="stories-heading">Истории</h2>
        </div>
        {content.stories.map(story => {
          const character = content.characters.find(
            item => item.characterId === story.characterId,
          )
          const nodes = content.nodes.filter(node =>
            node.nodeId.startsWith(story.storyId),
          )
          return (
            <button
              className="ledger-row"
              key={story.storyId}
              onClick={() => onOpen('content')}
              type="button"
            >
              <span className="ledger-index">
                {String(content.stories.indexOf(story) + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{story.title}</strong>
                <small>
                  {character?.name} · {story.durationMinutes} мин
                </small>
              </span>
              <span>{nodes.length} узлов</span>
              <ArrowRight size={18} />
            </button>
          )
        })}
      </section>
    </section>
  )
}

function Metric({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone?: 'ok' | 'warn'
}) {
  return (
    <div className={`metric ${tone ? `is-${tone}` : ''}`}>
      <strong>{value.toLocaleString('ru-RU')}</strong>
      <span>{label}</span>
    </div>
  )
}

function QueueLine({ count, label }: { count: number; label: string }) {
  return (
    <div className="queue-line">
      <strong>{count}</strong>
      <span>{label}</span>
    </div>
  )
}

function ContentWorkbench({
  actorId,
  auditLog,
  content,
  editReason,
  readOnly,
  selectedNode,
  onActorChange,
  onEditReasonChange,
  onSelect,
  onMessageChange,
  onChoiceChange,
  onAnnotationChange,
  onStatusChange,
}: {
  actorId: string
  auditLog: StudioAuditEntry[]
  content: ContentPackage
  editReason: string
  readOnly: boolean
  selectedNode: ContentNode | undefined
  onActorChange(actorId: string): void
  onEditReasonChange(reason: string): void
  onSelect(nodeId: string): void
  onMessageChange(nodeId: string, text: string): void
  onChoiceChange(nodeId: string, choiceId: string, text: string): void
  onAnnotationChange(
    nodeId: string,
    unitId: string,
    annotation: TextAnnotation,
  ): void
  onStatusChange(
    nodeId: string,
    status: ContentNode['editorial']['status'],
  ): void
}) {
  const [storyId, setStoryId] = useState(content.stories[0]?.storyId ?? '')
  const visibleNodes = content.nodes.filter(node =>
    node.nodeId.startsWith(storyId),
  )
  return (
    <section className="page content-page" aria-labelledby="content-title">
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">Редактор узлов</span>
          <h1 id="content-title">Контент</h1>
        </div>
        <label className="inline-field">
          История
          <select
            value={storyId}
            onChange={event => setStoryId(event.target.value)}
          >
            {content.stories.map(story => (
              <option value={story.storyId} key={story.storyId}>
                {story.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="workbench">
        <aside className="node-index" aria-label="Узлы истории">
          <div className="workbench-heading">
            <span className="eyebrow">Структура</span>
            <strong>{visibleNodes.length} узлов</strong>
          </div>
          <div className="node-list">
            {visibleNodes.map(node => (
              <button
                className={
                  node.nodeId === selectedNode?.nodeId
                    ? 'node-row is-active'
                    : 'node-row'
                }
                key={node.nodeId}
                onClick={() => onSelect(node.nodeId)}
                type="button"
              >
                <span className={`node-type type-${node.type}`}>
                  {node.type.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{node.nodeId.split('.').slice(-2).join('.')}</strong>
                  <small>
                    {nodeText(node).slice(0, 54) || 'Без сообщения'}
                  </small>
                </span>
                <i
                  className={`review-dot review-${node.editorial.status}`}
                  title={statusLabel[node.editorial.status]}
                />
              </button>
            ))}
          </div>
        </aside>
        <div className="node-editor">
          {selectedNode ? (
            <>
              <div className="workbench-heading editor-heading">
                <div>
                  <span className="eyebrow">{selectedNode.type}</span>
                  <h2>{selectedNode.nodeId}</h2>
                </div>
                <span
                  className={`review-badge review-${selectedNode.editorial.status}`}
                >
                  {statusLabel[selectedNode.editorial.status]}
                </span>
              </div>
              <label className="field-label" htmlFor="primary-message">
                Основной текст
              </label>
              <textarea
                disabled={readOnly}
                id="primary-message"
                onChange={event =>
                  onMessageChange(selectedNode.nodeId, event.target.value)
                }
                rows={5}
                value={nodeText(selectedNode)}
              />
              <div className="field-rule">
                <span>{nodeText(selectedNode).length} знаков</span>
                <span>Рекомендуется до 500</span>
              </div>
              {primaryTextUnit(selectedNode) ? (
                <TextAnnotationEditor
                  annotation={primaryTextUnit(selectedNode)!.annotation}
                  disabled={readOnly}
                  onChange={annotation =>
                    onAnnotationChange(
                      selectedNode.nodeId,
                      primaryTextUnit(selectedNode)!.unitId,
                      annotation,
                    )
                  }
                />
              ) : null}
              {selectedNode.type === 'decision' ? (
                <ChoiceEditor
                  disabled={readOnly}
                  node={selectedNode}
                  onChange={(choiceId, text) =>
                    onChoiceChange(selectedNode.nodeId, choiceId, text)
                  }
                  onAnnotationChange={(unitId, annotation) =>
                    onAnnotationChange(selectedNode.nodeId, unitId, annotation)
                  }
                />
              ) : null}
              {selectedNode.type === 'ending' ? (
                <div className="ending-facts">
                  <span className="field-label">Факты эпилога</span>
                  {selectedNode.epilogueFacts.map(fact => (
                    <p key={fact}>{fact}</p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <BracketsCurly size={34} />
              <h2>Выберите узел</h2>
              <p>Текст, варианты и редакционные статусы появятся здесь.</p>
            </div>
          )}
        </div>
        <aside className="inspector" aria-label="Редакционный инспектор">
          {selectedNode ? (
            <>
              <div className="workbench-heading">
                <span className="eyebrow">Инспектор</span>
                <strong>Редакционный след</strong>
              </div>
              <label className="field-label" htmlFor="audit-actor">
                Оператор
              </label>
              <input
                disabled={readOnly}
                id="audit-actor"
                maxLength={80}
                onChange={event => onActorChange(event.target.value)}
                value={actorId}
              />
              <p className="field-help">
                Имя попадёт в локальный журнал изменений и не отправляется в
                телеметрию.
              </p>
              <label className="field-label" htmlFor="audit-reason">
                Причина изменения
              </label>
              <textarea
                aria-describedby="audit-reason-help"
                disabled={readOnly}
                id="audit-reason"
                maxLength={240}
                onChange={event => onEditReasonChange(event.target.value)}
                placeholder="Например: уточнить голос после проверки редактора"
                rows={3}
                value={editReason}
              />
              <p className="field-help" id="audit-reason-help">
                Причина прикрепляется к следующему изменению.
              </p>
              <label className="field-label" htmlFor="review-status">
                Статус
              </label>
              <select
                aria-describedby="review-status-help"
                disabled={readOnly}
                id="review-status"
                onChange={event =>
                  onStatusChange(
                    selectedNode.nodeId,
                    event.target.value as ContentNode['editorial']['status'],
                  )
                }
                value={selectedNode.editorial.status}
              >
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option
                    value={value}
                    key={value}
                    disabled={
                      !canTransitionEditorialStatus(
                        selectedNode.editorial.status,
                        value as ContentNode['editorial']['status'],
                      )
                    }
                  >
                    {label}
                  </option>
                ))}
              </select>
              <p className="field-help" id="review-status-help">
                Статусы проходят проверку голоса, связности и качества по
                порядку. Фикстуры нельзя одобрить.
              </p>
              <InspectorLine
                label="Автор"
                value={selectedNode.editorial.writerId}
              />
              <InspectorLine
                label="Редактор голоса"
                value={selectedNode.editorial.voiceEditorId}
              />
              <InspectorLine
                label="Связность"
                value={selectedNode.editorial.continuityEditorId}
              />
              <InspectorLine
                label="Версия карточки голоса"
                value={selectedNode.editorial.voiceCardVersion}
              />
              <InspectorLine label="ID сцены" value={selectedNode.sceneId} />
              <div className="inspector-note">
                <ShieldWarning size={20} />
                <p>
                  Статус «Одобрено» означает реальную проверку человеком. Не
                  используйте его для сгенерированной фикстуры.
                </p>
              </div>
              <AuditLog
                entries={auditLog.filter(
                  entry => entry.nodeId === selectedNode.nodeId,
                )}
              />
            </>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

function primaryTextUnit(
  node: ContentNode,
): { unitId: string; annotation: TextAnnotation } | null {
  if (node.type === 'checkpoint') return null
  const message =
    node.type === 'decision'
      ? node.messageVariants[0]?.messages[0]
      : node.messages[0]
  if (!message) return null
  return {
    unitId: message.messageId,
    annotation: {
      intentionalRepeatId: message.intentionalRepeatId,
      intentionalTypo: message.intentionalTypo,
    },
  }
}

function TextAnnotationEditor({
  annotation,
  disabled,
  onChange,
}: {
  annotation: TextAnnotation
  disabled: boolean
  onChange(annotation: TextAnnotation): void
}) {
  return (
    <div className="text-annotations">
      <div className="text-annotations-heading">
        <span className="field-label">Редакционные метки</span>
        <small>не меняют текст в приложении</small>
      </div>
      <div className="text-annotations-controls">
        <label>
          <span>Намеренный повтор</span>
          <input
            aria-label="ID намеренного повтора"
            disabled={disabled}
            maxLength={120}
            onChange={event =>
              onChange({
                ...annotation,
                intentionalRepeatId: event.target.value,
              })
            }
            placeholder="например, motif.night"
            value={annotation.intentionalRepeatId ?? ''}
          />
        </label>
        <label className="annotation-checkbox">
          <input
            checked={annotation.intentionalTypo === true}
            disabled={disabled}
            onChange={event =>
              onChange({
                ...annotation,
                intentionalTypo: event.target.checked,
              })
            }
            type="checkbox"
          />
          <span>Намеренная опечатка</span>
        </label>
      </div>
    </div>
  )
}

const auditActionLabel: Record<StudioAuditEntry['action'], string> = {
  'edit-message': 'Текст',
  'edit-choice': 'Вариант',
  'annotation-change': 'Метка',
  'status-change': 'Статус',
  'replace-content': 'Пакет',
}

function AuditLog({ entries }: { entries: StudioAuditEntry[] }) {
  const recent = [...entries].reverse().slice(0, 8)
  return (
    <section className="audit-log" aria-labelledby="audit-log-title">
      <div className="audit-log-heading">
        <span className="eyebrow" id="audit-log-title">
          История узла
        </span>
        <strong>{entries.length}</strong>
      </div>
      {recent.length ? (
        <ol>
          {recent.map(entry => (
            <li key={entry.auditId}>
              <div className="audit-entry-meta">
                <strong>{auditActionLabel[entry.action]}</strong>
                <time dateTime={entry.at}>
                  {new Date(entry.at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: '2-digit',
                  })}
                </time>
              </div>
              <span className="audit-entry-actor">{entry.actorId}</span>
              <p>{entry.reason}</p>
              <details>
                <summary>Показать изменение</summary>
                <div className="audit-diff">
                  <del>{entry.before}</del>
                  <span aria-hidden="true">→</span>
                  <ins>{entry.after}</ins>
                </div>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <p className="audit-log-empty">
          Изменения этого узла появятся здесь после первого действия.
        </p>
      )}
    </section>
  )
}

function ChoiceEditor({
  disabled,
  node,
  onChange,
  onAnnotationChange,
}: {
  disabled: boolean
  node: DecisionNode
  onChange(choiceId: string, text: string): void
  onAnnotationChange(unitId: string, annotation: TextAnnotation): void
}) {
  return (
    <fieldset className="choice-editor">
      <legend>Ровно четыре варианта</legend>
      {node.choiceSlots.map(slot => {
        const candidate = slot.candidates[0]
        if (!candidate) return null
        return (
          <div className="choice-row" key={candidate.choiceId}>
            <span>{slot.slot}</span>
            <input
              disabled={disabled}
              maxLength={110}
              onChange={event =>
                onChange(candidate.choiceId, event.target.value)
              }
              value={candidate.text}
            />
            <small>{candidate.intent}</small>
            <TextAnnotationEditor
              annotation={{
                intentionalRepeatId: candidate.intentionalRepeatId,
                intentionalTypo: candidate.intentionalTypo,
              }}
              disabled={disabled}
              onChange={annotation =>
                onAnnotationChange(candidate.choiceId, annotation)
              }
            />
          </div>
        )
      })}
    </fieldset>
  )
}

function InspectorLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="inspector-line">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  )
}

function GraphView({
  content,
  onSelect,
}: {
  content: ContentPackage
  onSelect(nodeId: string): void
}) {
  const [storyId, setStoryId] = useState(content.stories[0]?.storyId ?? '')
  const nodes = content.nodes.filter(node => node.nodeId.startsWith(storyId))
  const decisions = nodes.filter(
    (node): node is DecisionNode => node.type === 'decision',
  )
  return (
    <section className="page" aria-labelledby="graph-title">
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">Проверка топологии</span>
          <h1 id="graph-title">Граф решений</h1>
        </div>
        <label className="inline-field">
          История
          <select
            value={storyId}
            onChange={event => setStoryId(event.target.value)}
          >
            {content.stories.map(story => (
              <option value={story.storyId} key={story.storyId}>
                {story.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="graph-legend">
        <span>
          <i className="legend-node decision" /> Решение
        </span>
        <span>
          <i className="legend-node reaction" /> Реакция
        </span>
        <span>
          <i className="legend-node ending" /> Финал
        </span>
      </div>
      <div className="graph-canvas" aria-label="Граф узлов истории">
        {decisions.map((decision, decisionIndex) => (
          <div className="graph-stage" key={decision.nodeId}>
            <button
              className="graph-node graph-decision"
              onClick={() => onSelect(decision.nodeId)}
              type="button"
            >
              <span className="eyebrow">D{decisionIndex + 1}</span>
              <strong>{decision.nodeId.split('.').slice(-2).join('.')}</strong>
              <small>{nodeText(decision).slice(0, 70)}</small>
            </button>
            <div className="graph-branches">
              {decision.choiceSlots.map(slot => {
                const choice = slot.candidates[0]
                const reaction = choice
                  ? content.nodes.find(
                      node => node.nodeId === choice.nextNodeId,
                    )
                  : undefined
                const destinationId =
                  reaction && 'nextNodeId' in reaction
                    ? reaction.nextNodeId
                    : undefined
                const destination = destinationId
                  ? content.nodes.find(node => node.nodeId === destinationId)
                  : undefined
                return choice ? (
                  <div className="graph-branch" key={choice.choiceId}>
                    <span className="branch-line">{slot.slot}</span>
                    <button
                      className="graph-node graph-reaction"
                      onClick={() => reaction && onSelect(reaction.nodeId)}
                      type="button"
                    >
                      <strong>{choice.text}</strong>
                      <small>
                        {reaction
                          ? nodeText(reaction).slice(0, 62)
                          : 'Нет реакции'}
                      </small>
                    </button>
                    {destination ? (
                      <button
                        className={`graph-node graph-${destination.type}`}
                        onClick={() => onSelect(destination.nodeId)}
                        type="button"
                      >
                        <strong>
                          {destination.type === 'ending'
                            ? destination.title
                            : destination.nodeId.split('.').slice(-2).join('.')}
                        </strong>
                        <small>{destination.type}</small>
                      </button>
                    ) : null}
                  </div>
                ) : null
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReviewView({
  baselineContent,
  content,
  onSelect,
  readiness,
}: {
  baselineContent: ContentPackage
  content: ContentPackage
  onSelect(nodeId: string): void
  readiness: Readiness
}) {
  const decisions = content.nodes.filter(
    (node): node is DecisionNode => node.type === 'decision',
  )
  const [decisionId, setDecisionId] = useState(decisions[0]?.nodeId ?? '')
  const [statusFilter, setStatusFilter] = useState<
    ContentNode['editorial']['status'] | 'all'
  >('all')
  const [ngramSize, setNgramSize] = useState(3)
  const selectedDecision = decisions.find(node => node.nodeId === decisionId)
  const rows = useMemo(
    () => counterfactualRows(content, decisionId),
    [content, decisionId],
  )
  const references = useMemo(
    () => nodeReferences(content, decisionId),
    [content, decisionId],
  )
  const ngrams = useMemo(
    () => findOverusedNgrams(content, { n: ngramSize, minCount: 2 }),
    [content, ngramSize],
  )
  const filteredNodes = content.nodes.filter(
    node => statusFilter === 'all' || node.editorial.status === statusFilter,
  )
  const previewText = rows[0]?.text ?? selectedDecision?.nodeId ?? ''
  const grammarRows = useMemo(
    () => grammarPreviewRows(previewText, 'Лена'),
    [previewText],
  )
  const contentDiff = useMemo<ContentDiff>(
    () => diffContentPackages(baselineContent, content),
    [baselineContent, content],
  )
  const russianQuality = useMemo(() => auditRussianQuality(content), [content])

  return (
    <section className="page review-page" aria-labelledby="review-title">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Редакционная проверка</span>
          <h1 id="review-title">Ревью</h1>
        </div>
        <p>
          Сравнивайте все четыре последствия рядом, проверяйте граф и находите
          повторяющиеся формулировки до передачи материала на проверку.
        </p>
      </div>

      <div className="status-strip review-metrics">
        <Metric
          value={readiness.report.counts.decisionNodeCount}
          label="узлов-решений"
        />
        <Metric
          value={readiness.report.analysis.counterfactualValidatedDecisionCount}
          label="прошли проверку последствий"
          tone={
            readiness.report.analysis.counterfactualValidatedDecisionCount ===
            readiness.report.counts.decisionNodeCount
              ? 'ok'
              : 'warn'
          }
        />
        <Metric
          value={ngrams.length}
          label="повторяющихся n-грамм"
          tone="warn"
        />
        <Metric value={filteredNodes.length} label="узлов в фильтре" />
      </div>

      <div className="review-layout">
        <aside className="review-sidebar" aria-label="Фильтры ревью">
          <label className="field-label" htmlFor="review-decision">
            Сцена для проверки последствий
          </label>
          <select
            id="review-decision"
            onChange={event => setDecisionId(event.target.value)}
            value={decisionId}
          >
            {decisions.map(decision => (
              <option key={decision.nodeId} value={decision.nodeId}>
                {decision.nodeId}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="review-status-filter">
            Редакционный статус
          </label>
          <select
            id="review-status-filter"
            onChange={event =>
              setStatusFilter(
                event.target.value as
                  ContentNode['editorial']['status'] | 'all',
              )
            }
            value={statusFilter}
          >
            <option value="all">Все статусы</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="review-node-list" aria-label="Узлы в фильтре">
            {filteredNodes.slice(0, 48).map(node => (
              <button
                className={
                  node.nodeId === decisionId
                    ? 'review-node-row is-active'
                    : 'review-node-row'
                }
                key={node.nodeId}
                onClick={() => {
                  if (node.type === 'decision') setDecisionId(node.nodeId)
                  onSelect(node.nodeId)
                }}
                type="button"
              >
                <span>{node.type.slice(0, 1).toUpperCase()}</span>
                <strong>{node.nodeId.split('.').slice(-2).join('.')}</strong>
                <i
                  className={`review-dot review-${node.editorial.status}`}
                  title={statusLabel[node.editorial.status]}
                />
              </button>
            ))}
          </div>
        </aside>

        <div className="review-main">
          <section
            className="review-panel"
            aria-labelledby="counterfactual-title"
          >
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">A / B / C / D</span>
                <h2 id="counterfactual-title">Четыре последствия рядом</h2>
              </div>
              <span className="review-count">{rows.length} варианта</span>
            </div>
            {rows.length ? (
              <div className="counterfactual-table-wrap">
                <table className="counterfactual-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Текст и intent</th>
                      <th scope="col">Choice effects</th>
                      <th scope="col">Реакция</th>
                      <th scope="col">Downstream</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <CounterfactualTableRow key={row.choiceId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="review-empty">
                Выберите decision-узел для сравнения.
              </p>
            )}
          </section>

          <section className="review-panel" aria-labelledby="references-title">
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Graph references</span>
                <h2 id="references-title">Входящие и исходящие связи</h2>
              </div>
            </div>
            <div className="reference-columns">
              <ReferenceColumn
                content={content}
                references={references.inbound}
                title="Входящие"
                onSelect={onSelect}
              />
              <ReferenceColumn
                content={content}
                references={references.outbound}
                title="Исходящие"
                onSelect={onSelect}
              />
            </div>
          </section>

          <section className="review-panel" aria-labelledby="ngrams-title">
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Языковая проверка</span>
                <h2 id="ngrams-title">Повторяющиеся n-граммы</h2>
              </div>
              <label className="inline-field">
                Длина
                <select
                  aria-label="Длина n-граммы"
                  onChange={event => setNgramSize(Number(event.target.value))}
                  value={ngramSize}
                >
                  <option value={2}>2 слова</option>
                  <option value={3}>3 слова</option>
                  <option value={4}>4 слова</option>
                </select>
              </label>
            </div>
            {ngrams.length ? (
              <div className="ngram-list">
                {ngrams.map(ngram => (
                  <NgramRow
                    key={`${ngram.phrase}:${ngram.count}`}
                    ngram={ngram}
                  />
                ))}
              </div>
            ) : (
              <p className="review-empty">Повторений выше порога не найдено.</p>
            )}
          </section>

          <section
            className="review-panel"
            aria-labelledby="russian-quality-title"
          >
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Русский стандарт</span>
                <h2 id="russian-quality-title">
                  Автоматический языковой экран
                </h2>
              </div>
              <span className="review-count">
                {russianQuality.textUnitCount} единиц ·{' '}
                {russianQuality.warningIssueCount} предупреждений
              </span>
            </div>
            <p className="quality-disclaimer">
              Экран ищет технические и шаблонные риски, но не заменяет
              независимую проверку носителями русского языка.
            </p>
            {russianQuality.issues.length ? (
              <div className="quality-issue-list">
                {russianQuality.issues.slice(0, 24).map(issue => (
                  <RussianQualityIssueRow
                    issue={issue}
                    key={`${issue.path}:${issue.code}`}
                  />
                ))}
                {russianQuality.issues.length > 24 ? (
                  <p className="review-empty">
                    Показаны первые 24 из {russianQuality.issues.length}{' '}
                    замечаний. Полный отчёт сохраняется CLI-проверкой.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="review-empty">Автоматических рисков не найдено.</p>
            )}
          </section>

          <section className="review-panel" aria-labelledby="wrapping-title">
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Mobile rendering</span>
                <h2 id="wrapping-title">Перенос на реальных ширинах</h2>
              </div>
            </div>
            <div className="wrap-preview-grid">
              {[320, 375, 414].map(width => (
                <div className={`wrap-preview width-${width}`} key={width}>
                  <span>{width} px</span>
                  <p>{previewText}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="review-panel" aria-labelledby="grammar-title">
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Morphology preview</span>
                <h2 id="grammar-title">Три грамматических профиля</h2>
              </div>
              <span className="review-count">имя: Лена</span>
            </div>
            <div className="grammar-preview-grid">
              {grammarRows.map(row => (
                <article className="grammar-preview-card" key={row.profile}>
                  <span>{row.label}</span>
                  <p>{row.text}</p>
                  {row.unresolvedTokens.length ? (
                    <strong>
                      Неизвестные placeholders:{' '}
                      {row.unresolvedTokens.join(', ')}
                    </strong>
                  ) : (
                    <small>Все шаблоны разрешены</small>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="review-panel" aria-labelledby="diff-title">
            <div className="panel-heading review-panel-heading">
              <div>
                <span className="eyebrow">Change review</span>
                <h2 id="diff-title">Текст отдельно от логики</h2>
              </div>
              <span className="review-count">
                {contentDiff.text.length} текст · {contentDiff.logic.length}{' '}
                логика
              </span>
            </div>
            <div className="diff-columns">
              <DiffColumn
                entries={contentDiff.text}
                title="Текстовые изменения"
              />
              <DiffColumn
                entries={contentDiff.logic}
                title="State / graph изменения"
              />
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

function RussianQualityIssueRow({ issue }: { issue: RussianQualityIssue }) {
  return (
    <article
      className={
        issue.severity === 'blocker'
          ? 'quality-issue quality-issue-blocker'
          : 'quality-issue'
      }
    >
      <div className="quality-issue-heading">
        <strong>{issue.code}</strong>
        <span>{issue.severity === 'blocker' ? 'Блокер' : 'Проверить'}</span>
      </div>
      <p>{issue.message}</p>
      <code>{issue.path}</code>
      <small>{issue.text}</small>
    </article>
  )
}

function CounterfactualTableRow({ row }: { row: CounterfactualRow }) {
  return (
    <tr>
      <th scope="row">
        <span className="slot-badge">{row.slot}</span>
      </th>
      <td>
        <strong>{row.text}</strong>
        <small>{row.intent}</small>
      </td>
      <td>
        <code>{row.effectPaths.join('\n') || '—'}</code>
      </td>
      <td>
        <p>{row.reactionText || 'Нет реакции'}</p>
        <small>{row.reactionNodeId ?? '—'}</small>
      </td>
      <td>
        <strong>
          {row.destinationType ? `${row.destinationType}:` : ''}{' '}
          {row.destinationId ?? '—'}
        </strong>
        <small>{row.downstreamEffectPaths.join(', ') || 'Без эффекта'}</small>
        <small>
          {row.downstreamReads.length
            ? `Читают: ${row.downstreamReads.join(', ')}`
            : 'Правило чтения не найдено'}
        </small>
      </td>
    </tr>
  )
}

function ReferenceColumn({
  content,
  references,
  title,
  onSelect,
}: {
  content: ContentPackage
  references: GraphReference[]
  title: string
  onSelect(nodeId: string): void
}) {
  return (
    <div className="reference-column">
      <h3>{title}</h3>
      {references.length ? (
        <ul>
          {references.map(reference => {
            const source = content.nodes.find(
              node => node.nodeId === reference.sourceNodeId,
            )
            const target = content.nodes.find(
              node => node.nodeId === reference.targetNodeId,
            )
            const node = title === 'Входящие' ? source : target
            const nodeId = node?.nodeId ?? reference.targetNodeId
            return (
              <li key={`${reference.sourceNodeId}:${reference.targetNodeId}`}>
                <button onClick={() => onSelect(nodeId)} type="button">
                  <strong>{nodeId}</strong>
                  <small>{reference.label}</small>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="review-empty">Связей нет.</p>
      )}
    </div>
  )
}

function NgramRow({ ngram }: { ngram: OverusedNgram }) {
  return (
    <div className="ngram-row">
      <code>{ngram.phrase}</code>
      <strong>{ngram.count}×</strong>
      <span>{ngram.nodeIds.length} узлов</span>
    </div>
  )
}

function DiffColumn({
  entries,
  title,
}: {
  entries: ContentDiff['text'] | ContentDiff['logic']
  title: string
}) {
  return (
    <div className="diff-column">
      <h3>{title}</h3>
      {entries.length ? (
        <ul>
          {entries.slice(0, 12).map(entry => (
            <li
              key={`${entry.path}:${String('unitId' in entry ? entry.unitId : entry.nodeId)}`}
            >
              <code>{entry.path}</code>
              <del>{entry.before ?? 'Добавлено'}</del>
              <ins>{entry.after ?? 'Удалено'}</ins>
            </li>
          ))}
        </ul>
      ) : (
        <p className="review-empty">Изменений нет.</p>
      )}
      {entries.length > 12 ? (
        <small className="diff-overflow">
          Ещё {entries.length - 12} изменений скрыто в полном отчёте.
        </small>
      ) : null}
    </div>
  )
}

function SimulatorView({
  content,
  simulator,
  onChoose,
  onReset,
  onStoryChange,
}: {
  content: ContentPackage
  simulator: SimulatorState
  onChoose(choiceId: string): void
  onReset(): void
  onStoryChange(storyId: string): void
}) {
  const story = content.stories.find(item => item.storyId === simulator.storyId)
  const character = content.characters.find(
    item => item.characterId === story?.characterId,
  )
  return (
    <section className="page simulator-page" aria-labelledby="simulator-title">
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">Тот же движок, что в приложении</span>
          <h1 id="simulator-title">Симулятор</h1>
        </div>
        <button className="button secondary" onClick={onReset} type="button">
          <ArrowCounterClockwise size={18} /> Сначала
        </button>
      </div>
      <div className="simulator-layout">
        <aside className="simulator-controls">
          <label className="field-label" htmlFor="simulation-story">
            История
          </label>
          <select
            id="simulation-story"
            value={simulator.storyId}
            onChange={event => onStoryChange(event.target.value)}
          >
            {content.stories.map(item => (
              <option key={item.storyId} value={item.storyId}>
                {item.title}
              </option>
            ))}
          </select>
          <InspectorLine label="Активный узел" value={simulator.activeNodeId} />
          <InspectorLine
            label="Последовательность"
            value={String(simulator.sequence)}
          />
          <InspectorLine label="Состояние" value={simulator.status} />
          <div className="state-json">
            <span className="field-label">Скрытое состояние</span>
            <pre>{JSON.stringify(simulator.state, null, 2)}</pre>
          </div>
        </aside>
        <div className="phone-preview">
          <header>
            <span>
              <strong>{character?.name}</strong>
              <small>{story?.title}</small>
            </span>
            <i>{simulator.sequence + 1}</i>
          </header>
          <div className="sim-transcript">
            {simulator.transcript.map(line => (
              <div
                className={
                  line.speakerId === 'player'
                    ? 'sim-message own'
                    : 'sim-message'
                }
                key={line.id}
              >
                <small>
                  {line.speakerId === 'player' ? 'Вы' : character?.name}
                </small>
                <p>{line.text}</p>
              </div>
            ))}
            {simulator.status === 'completed' ? (
              <div className="sim-ending">
                <CheckCircle size={30} weight="fill" />
                <h2>{simulator.endingTitle}</h2>
                <p>Путь завершён после {simulator.sequence} выборов.</p>
              </div>
            ) : null}
          </div>
          {simulator.status === 'active' ? (
            <div className="sim-choices">
              {simulator.choices.map((choice, index) => (
                <button
                  key={choice.choiceId}
                  onClick={() => onChoose(choice.choiceId)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="button primary simulator-restart"
              onClick={onReset}
              type="button"
            >
              Пройти иначе
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function ReleaseView({
  content,
  readiness,
  apiUrl,
  adminToken,
  signingKeyId,
  publishing,
  onApiUrl,
  onAdminToken,
  onExport,
  onImport,
  onPublish,
  onSigningKeyId,
}: {
  content: ContentPackage
  readiness: Readiness
  apiUrl: string
  adminToken: string
  signingKeyId: string
  publishing: boolean
  onApiUrl(value: string): void
  onAdminToken(value: string): void
  onExport(): void
  onImport(): void
  onPublish(confirmedBuildId: string): void
  onSigningKeyId(value: string): void
}) {
  const [confirmedBuildId, setConfirmedBuildId] = useState('')
  useEffect(() => setConfirmedBuildId(''), [content.manifest.buildId])
  const { gate } = readiness
  const gates = [
    {
      label: 'Структура и достижимость',
      detail: `${readiness.report.blockers.length} блокеров · ${readiness.report.counts.reachableNodeCount} достижимых узлов`,
      pass: readiness.report.blockers.length === 0,
    },
    {
      label: 'Человеческое одобрение',
      detail: `${readiness.nonApprovedNodes} узлов не имеют статуса «Одобрено»`,
      pass: readiness.nonApprovedNodes === 0,
    },
    {
      label: 'Порог опубликованного текста',
      detail: `${gate.approvedTextUnits.toLocaleString('ru-RU')} из ${gate.requiredApprovedTextUnits.toLocaleString('ru-RU')} единиц`,
      pass: gate.approvedTextUnits >= gate.requiredApprovedTextUnits,
    },
    {
      label: 'Происхождение ассетов',
      detail: `${readiness.fixtureAssets} фикстур или неизвестных источников`,
      pass: readiness.fixtureAssets === 0,
    },
    {
      label: 'Узлы-решения',
      detail: `${gate.decisionNodes.toLocaleString('ru-RU')} из ${gate.requiredDecisionNodes.toLocaleString('ru-RU')}`,
      pass: gate.decisionNodes >= gate.requiredDecisionNodes,
    },
    {
      label: 'Уникальные входящие реплики',
      detail: `${gate.uniqueDecisionCharacterTexts.toLocaleString('ru-RU')} из ${gate.requiredUniqueDecisionCharacterTexts.toLocaleString('ru-RU')}`,
      pass:
        gate.uniqueDecisionCharacterTexts >=
        gate.requiredUniqueDecisionCharacterTexts,
    },
    {
      label: 'Уникальные ответы игрока',
      detail: `${gate.uniquePlayerChoiceTexts.toLocaleString('ru-RU')} из ${gate.requiredUniquePlayerChoiceTexts.toLocaleString('ru-RU')}`,
      pass:
        gate.uniquePlayerChoiceTexts >= gate.requiredUniquePlayerChoiceTexts,
    },
    {
      label: 'Стартовый состав',
      detail: `${gate.characters} из ${gate.requiredCharacters} персонажей`,
      pass: gate.characters >= gate.requiredCharacters,
    },
    {
      label: 'Завершённые арки',
      detail: `${gate.completedArcs} из ${gate.requiredCompletedArcs}`,
      pass: gate.completedArcs >= gate.requiredCompletedArcs,
    },
    {
      label: 'Финалы каждого персонажа',
      detail: `минимум ${gate.minimumEndingsPerCharacter} из ${gate.requiredEndingsPerCharacter}`,
      pass: gate.minimumEndingsPerCharacter >= gate.requiredEndingsPerCharacter,
    },
    {
      label: 'Возрастная политика core v1',
      detail: `${gate.adultOnlyStories} историй 18+ · разрешено ${gate.allowedAdultOnlyStories}`,
      pass: gate.adultOnlyStories <= gate.allowedAdultOnlyStories,
    },
    {
      label: 'Ключ подписи',
      detail: gate.signingKeyId
        ? `manifest привязан к ${gate.signingKeyId}`
        : 'signingKeyId не задан',
      pass: gate.signingKeyId !== null,
    },
    {
      label: 'Четыре семантически разных ответа',
      detail: `${readiness.report.analysis.counterfactualValidatedDecisionCount} из ${readiness.report.counts.decisionNodeCount} узлов-решений прошли проверку последствий`,
      pass:
        readiness.report.analysis.counterfactualValidatedDecisionCount ===
        readiness.report.counts.decisionNodeCount,
    },
  ]
  return (
    <section className="page" aria-labelledby="release-title">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Подпись Ed25519 · атомарная публикация
          </span>
          <h1 id="release-title">Выпуск пакета</h1>
        </div>
        <p>
          Публикация закрыта, пока каждый обязательный сигнал не подтверждён
          доказательством.
        </p>
      </div>
      <div
        className={
          readiness.ready ? 'release-banner is-ready' : 'release-banner'
        }
      >
        {readiness.ready ? (
          <CheckCircle size={34} weight="fill" />
        ) : (
          <ShieldWarning size={34} weight="fill" />
        )}
        <div>
          <span className="eyebrow">
            {readiness.ready ? 'Release candidate' : 'Публикация заблокирована'}
          </span>
          <h2>{content.manifest.buildId}</h2>
          <p>
            {readiness.ready
              ? 'Все автоматические ворота пройдены.'
              : 'Это рабочая фикстура для UX и движка, не заявленный GA-контент.'}
          </p>
        </div>
      </div>
      <div className="release-layout">
        <div className="gate-list">
          <div className="panel-heading">
            <span className="eyebrow">Обязательные ворота</span>
            <h2>Доказательства</h2>
          </div>
          {gates.map((gate, index) => (
            <div
              className={gate.pass ? 'gate-row is-pass' : 'gate-row is-blocked'}
              key={gate.label}
            >
              <span className="gate-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{gate.label}</strong>
                <small>{gate.detail}</small>
              </span>
              {gate.pass ? (
                <CheckCircle size={22} weight="fill" />
              ) : (
                <WarningCircle size={22} weight="fill" />
              )}
            </div>
          ))}
          {readiness.report.blockers.length ? (
            <details className="blocker-details">
              <summary>
                {readiness.report.blockers.length} структурных блокеров
              </summary>
              {readiness.report.blockers.map(issue => (
                <p key={`${issue.code}:${issue.path}`}>
                  <code>{issue.code}</code> {issue.path}: {issue.message}
                </p>
              ))}
            </details>
          ) : null}
        </div>
        <aside className="publish-panel">
          <div className="panel-heading">
            <span className="eyebrow">Операции</span>
            <h2>Пакет</h2>
          </div>
          <button
            className="button secondary full"
            onClick={onExport}
            type="button"
          >
            <DownloadSimple size={18} /> Экспортировать JSON
          </button>
          <button
            className="button secondary full"
            onClick={onImport}
            type="button"
          >
            <UploadSimple size={18} /> Импортировать JSON
          </button>
          <hr />
          <label className="field-label" htmlFor="api-url">
            API выпуска
          </label>
          <input
            id="api-url"
            onChange={event => onApiUrl(event.target.value)}
            spellCheck="false"
            type="url"
            value={apiUrl}
          />
          <label className="field-label" htmlFor="admin-token">
            Одноразовый токен оператора
          </label>
          <input
            autoComplete="off"
            id="admin-token"
            onChange={event => onAdminToken(event.target.value)}
            placeholder="Не сохраняется"
            type="password"
            value={adminToken}
          />
          <label className="field-label" htmlFor="signing-key-id">
            ID ключа подписи
          </label>
          <input
            autoComplete="off"
            id="signing-key-id"
            onChange={event => onSigningKeyId(event.target.value)}
            placeholder="prod-2026-q3"
            spellCheck="false"
            type="text"
            value={signingKeyId}
          />
          <label className="field-label" htmlFor="build-confirmation">
            Подтвердите точный ID сборки
          </label>
          <input
            autoComplete="off"
            id="build-confirmation"
            onChange={event => setConfirmedBuildId(event.target.value)}
            placeholder={content.manifest.buildId}
            spellCheck="false"
            type="text"
            value={confirmedBuildId}
          />
          <button
            className="button primary full"
            disabled={
              !readiness.ready ||
              !adminToken.trim() ||
              confirmedBuildId !== content.manifest.buildId ||
              publishing
            }
            onClick={() => onPublish(confirmedBuildId)}
            type="button"
          >
            <CloudArrowUp size={18} />{' '}
            {publishing ? 'Публикуем…' : 'Подписать и выпустить'}
          </button>
          {!readiness.ready ? (
            <p className="disabled-reason">
              Кнопка станет доступна после прохождения всех ворот.
            </p>
          ) : !adminToken.trim() ? (
            <p className="disabled-reason">
              Введите токен, выданный для этого выпуска.
            </p>
          ) : confirmedBuildId !== content.manifest.buildId ? (
            <p className="disabled-reason">
              Введите ID сборки без сокращений: {content.manifest.buildId}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
