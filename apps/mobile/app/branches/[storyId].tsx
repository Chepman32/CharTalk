import { getRunForkPoints, type StoryRun } from '@razvilka/app-core'
import type { ContentPackage } from '@razvilka/content-schema'
import { spacing } from '@razvilka/design-system'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { GitBranchIcon, PathIcon, Sparkle } from 'phosphor-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { formatEndingCount, formatRunCount } from '@/format'
import { contentForBuild } from '@/content-for-run'
import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import {
  Button,
  EmptyState,
  InlineError,
  Pill,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

const runDepth = (run: StoryRun, runs: readonly StoryRun[]): number => {
  let depth = 0
  let parentId = run.parentRunId
  const visited = new Set<string>()
  while (parentId && !visited.has(parentId) && depth < 4) {
    visited.add(parentId)
    depth += 1
    parentId = runs.find(item => item.runId === parentId)?.parentRunId
  }
  return depth
}

const exactContent = (
  run: StoryRun,
  packages: readonly ContentPackage[],
): ContentPackage | undefined =>
  contentForBuild(packages, run.contentBuildId, run.packId)

export default function BranchesScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>()
  const router = useRouter()
  const {
    contentCatalog,
    contentPackages,
    ensureContentForBuild,
    snapshot,
    startStory,
    forkRun,
    error,
    clearError,
  } = useApp()
  const { theme } = useTheme()
  const [workingKey, setWorkingKey] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: { gap: spacing[3], paddingTop: spacing[4] },
        overview: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing[2],
        },
        branch: {
          gap: spacing[4],
          padding: spacing[4],
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.borderStrong,
          backgroundColor: theme.colors.card,
        },
        branchChild: { borderLeftColor: theme.colors.primary },
        branchHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
        },
        branchCopy: { flex: 1, gap: spacing[1] },
        path: { gap: spacing[3] },
        event: { gap: spacing[2] },
        eventHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
        },
        dots: { flexDirection: 'row', gap: spacing[2] },
        dot: {
          width: 12,
          height: 12,
          borderRadius: 99,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          backgroundColor: 'transparent',
        },
        dotVisited: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary,
        },
        eventText: { flex: 1 },
        checkpoints: { gap: spacing[2] },
        hidden: {
          gap: spacing[2],
          padding: spacing[4],
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.colors.borderStrong,
        },
        footer: { gap: spacing[3] },
      }),
    [theme],
  )
  const story = contentCatalog.stories.find(item => item.storyId === storyId)
  const runs = useMemo(
    () =>
      (snapshot?.runs.filter(run => run.storyId === storyId) ?? [])
        .slice()
        .sort((left, right) => left.startedAt.localeCompare(right.startedAt)),
    [snapshot?.runs, storyId],
  )
  useEffect(() => {
    if (runs.length === 0) {
      setContentLoading(false)
      return
    }
    let active = true
    setContentLoading(true)
    const builds = new Map<string, { packId: string | null; buildId: string }>()
    for (const run of runs) {
      builds.set(`${run.packId ?? ''}:${run.contentBuildId}`, {
        packId: run.packId ?? null,
        buildId: run.contentBuildId,
      })
    }
    void Promise.all(
      [...builds.values()].map(item =>
        ensureContentForBuild(item.packId, item.buildId).catch(() => null),
      ),
    ).finally(() => {
      if (active) setContentLoading(false)
    })
    return () => {
      active = false
    }
  }, [ensureContentForBuild, runs])
  const endingCount = new Set(
    contentPackages
      .flatMap(content =>
        content.nodes.flatMap(node =>
          node.type === 'ending' ? [node.endingId] : [],
        ),
      )
      .filter(endingId => endingId.startsWith(`${storyId}.`)),
  ).size
  const discoveredEndings = new Set(
    runs.flatMap(run => (run.endingId ? [run.endingId] : [])),
  ).size

  if (!story) {
    return (
      <Screen>
        <EmptyState
          title="История не найдена."
          body="Её пакет мог быть удалён с устройства."
        />
      </Screen>
    )
  }

  const openRun = (run: StoryRun) =>
    router.push({
      pathname: run.status === 'active' ? '/run/[runId]' : '/recap/[runId]',
      params: { runId: run.runId },
    })

  const newReplay = async () => {
    setWorkingKey('replay')
    try {
      const run = await startStory(story.storyId)
      openRun(run)
    } finally {
      setWorkingKey(null)
    }
  }

  const createBranch = async (source: StoryRun, sequence: number) => {
    const key = `${source.runId}:${sequence}`
    setWorkingKey(key)
    try {
      const branch = await forkRun(
        source.runId,
        sequence,
        `Ветка ${runs.length + 1}`,
      )
      openRun(branch)
    } finally {
      setWorkingKey(null)
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <SectionLabel>Без спойлеров</SectionLabel>
        <Text variant="title">Развилки · {story.title}</Text>
        <Text color={theme.colors.textSecondary}>
          Видны только ваши ответы. Остальные варианты и ненайденные финалы
          остаются силуэтами.
        </Text>
        <View style={styles.overview}>
          <Pill>{formatRunCount(runs.length)}</Pill>
          <Pill tone="accent">
            {formatEndingCount(discoveredEndings)} найдено
          </Pill>
          {contentLoading ? <Pill>Открываем карту…</Pill> : null}
        </View>
      </View>
      {error ? <InlineError message={error} onDismiss={clearError} /> : null}
      {runs.length === 0 ? (
        <EmptyState
          title="Пути появятся после первого выбора."
          body="Начните историю — карта будет открываться без названий непосещённых веток."
        />
      ) : (
        runs.map((run, runIndex) => {
          const content = exactContent(run, contentPackages)
          if (!content) {
            return (
              <View key={run.runId} style={styles.branch}>
                <View style={styles.branchHeader}>
                  <PathIcon color={theme.colors.textSecondary} size={24} />
                  <View style={styles.branchCopy}>
                    <Text variant="heading">
                      {run.label ?? `Путь ${runIndex + 1}`}
                    </Text>
                    <Text variant="caption" color={theme.colors.textMuted}>
                      {contentLoading
                        ? 'Открываем локальную версию…'
                        : `Версия истории не установлена · ${run.contentBuildId}`}
                    </Text>
                  </View>
                  {!contentLoading ? (
                    <Button
                      label="Восстановить версию"
                      variant="quiet"
                      onPress={() => router.push('/downloads')}
                    />
                  ) : null}
                </View>
              </View>
            )
          }
          const depth = runDepth(run, runs)
          const ending = content.nodes.find(
            node => node.type === 'ending' && node.endingId === run.endingId,
          )
          const points = getRunForkPoints(run, content).filter(
            point => point.sequence < run.sequence,
          )
          return (
            <View
              key={run.runId}
              style={[
                styles.branch,
                depth > 0 && styles.branchChild,
                { marginLeft: Math.min(depth * 12, 36) },
              ]}
            >
              <View style={styles.branchHeader}>
                {depth > 0 ? (
                  <GitBranchIcon color={theme.colors.primary} size={24} />
                ) : (
                  <PathIcon color={theme.colors.textSecondary} size={24} />
                )}
                <View style={styles.branchCopy}>
                  <Text variant="heading">
                    {run.label ?? `Путь ${runIndex + 1}`}
                  </Text>
                  <Text variant="caption" color={theme.colors.textMuted}>
                    {run.parentRunId
                      ? `Новая ветвь после ${run.branchFromSequence ?? 0} выборов`
                      : 'Независимое прохождение'}
                  </Text>
                </View>
                <Pill>{run.status === 'active' ? 'в процессе' : 'финал'}</Pill>
              </View>
              <View style={styles.path}>
                {run.events.map((event, eventIndex) => {
                  const decision = content.nodes.find(
                    node => node.nodeId === event.nodeId,
                  )
                  const selectedSlot =
                    decision?.type === 'decision'
                      ? decision.choiceSlots.find(slot =>
                          slot.candidates.some(
                            candidate => candidate.choiceId === event.choiceId,
                          ),
                        )?.slot
                      : undefined
                  const text = run.transcript.find(
                    entry => entry.choiceId === event.choiceId,
                  )?.text
                  return (
                    <View key={event.eventId} style={styles.event}>
                      <View style={styles.eventHeader}>
                        <Text variant="mono" color={theme.colors.textMuted}>
                          {String(eventIndex + 1).padStart(2, '0')}
                        </Text>
                        <View style={styles.dots}>
                          {[1, 2, 3, 4].map(slot => (
                            <View
                              accessibilityLabel={
                                slot === selectedSlot
                                  ? `Выбран вариант ${slot}`
                                  : `Неизвестный вариант ${slot}`
                              }
                              key={slot}
                              style={[
                                styles.dot,
                                slot === selectedSlot && styles.dotVisited,
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.eventText}>
                        {text ?? 'Ответ сохранён'}
                      </Text>
                    </View>
                  )
                })}
              </View>
              {ending?.type === 'ending' ? (
                <View>
                  <SectionLabel>Найденный финал</SectionLabel>
                  <Text variant="heading">{ending.title}</Text>
                </View>
              ) : null}
              {points.length > 0 ? (
                <View style={styles.checkpoints}>
                  <Text variant="label">
                    Создать ветвь от сохранённой точки
                  </Text>
                  {points.map(point => (
                    <Button
                      key={`${run.runId}:${point.sequence}`}
                      label={`${point.label} · переиграть ${run.sequence - point.sequence} выборов`}
                      variant="quiet"
                      loading={workingKey === `${run.runId}:${point.sequence}`}
                      onPress={() => void createBranch(run, point.sequence)}
                    />
                  ))}
                </View>
              ) : null}
              <Button
                label={
                  run.status === 'active' ? 'Продолжить путь' : 'Открыть итог'
                }
                variant="secondary"
                onPress={() => openRun(run)}
              />
            </View>
          )
        })
      )}
      {endingCount > discoveredEndings ? (
        <View style={styles.hidden}>
          <Sparkle color={theme.colors.textMuted} size={22} />
          <Text variant="heading">
            Ещё {endingCount - discoveredEndings} финалов скрыто
          </Text>
          <Text color={theme.colors.textMuted}>
            Их названия появятся только после прохождения.
          </Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <Button
          label="Независимое прохождение"
          icon={GitBranchIcon}
          loading={workingKey === 'replay'}
          onPress={() => void newReplay()}
        />
        <Button
          label="К историям"
          variant="quiet"
          onPress={() => router.replace('/(tabs)/stories')}
        />
      </View>
    </Screen>
  )
}
