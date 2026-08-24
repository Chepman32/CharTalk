import { spacing } from '@razvilka/design-system'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowCounterClockwise, ArrowRight, Tray } from 'phosphor-react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { formatChoiceCount } from '@/format'
import { contentForBuild } from '@/content-for-run'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import {
  Button,
  Divider,
  Pill,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

export default function RecapScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { runId } = useLocalSearchParams<{ runId: string }>()
  const router = useRouter()
  const {
    contentPackages,
    ensureContentForBuild,
    reportDiagnostic,
    snapshot,
    archiveRun,
    startStory,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const recapSentRunRef = useRef<string | null>(null)
  const run = snapshot?.runs.find(item => item.runId === runId)
  const runContent = run
    ? contentForBuild(contentPackages, run.contentBuildId, run.packId)
    : undefined
  const story = run
    ? runContent?.stories.find(item => item.storyId === run.storyId)
    : undefined
  const character = run
    ? runContent?.characters.find(item => item.characterId === run.characterId)
    : undefined
  const episode = run
    ? runContent?.episodes.find(item => item.episodeId === run.episodeId)
    : undefined
  const ending = run
    ? runContent?.nodes.find(item => item.nodeId === run.activeNodeId)
    : undefined

  useEffect(() => {
    if (!run) return
    if (runContent) {
      setContentLoading(false)
      return
    }
    let active = true
    setContentLoading(true)
    void ensureContentForBuild(run.packId, run.contentBuildId)
      .catch(() => null)
      .finally(() => {
        if (active) setContentLoading(false)
      })
    return () => {
      active = false
    }
  }, [ensureContentForBuild, run, runContent])

  useEffect(() => {
    if (
      !run ||
      !runContent ||
      ending?.type !== 'ending' ||
      !snapshot?.settings.analytics ||
      recapSentRunRef.current === run.runId
    ) {
      return
    }
    recapSentRunRef.current = run.runId
    void reportDiagnostic({
      eventName: 'recap_viewed',
      contentBuildId: run.contentBuildId,
      occurredAt: new Date().toISOString(),
    })
  }, [
    ending?.type,
    run?.contentBuildId,
    run?.runId,
    runContent,
    reportDiagnostic,
    snapshot?.settings.analytics,
  ])

  if (
    !run ||
    !runContent ||
    !story ||
    !character ||
    ending?.type !== 'ending'
  ) {
    return (
      <Screen>
        <Text variant="title">
          {contentLoading
            ? 'Готовим точную офлайн-версию…'
            : !runContent && run
              ? 'Версия истории недоступна.'
              : 'Итог пока недоступен.'}
        </Text>
        {contentLoading ? (
          <ActivityIndicator color={nativeColors.textPrimary} />
        ) : null}
        {!contentLoading && !runContent && run ? (
          <>
            <Text color={nativeColors.textSecondary}>
              Загрузите точную сборку, привязанную к этому прохождению, чтобы
              открыть замороженный текст.
            </Text>
            <Button
              label="Открыть загрузки"
              onPress={() => router.replace('/downloads')}
            />
          </>
        ) : null}
      </Screen>
    )
  }

  const keyEvents = run.events.slice(0, 4)

  const replay = async () => {
    setBusy(true)
    try {
      const next = await startStory(story.storyId)
      router.replace({
        pathname: '/run/[runId]',
        params: { runId: next.runId },
      })
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    await archiveRun(run.runId)
    router.replace('/(tabs)/archive')
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <SectionLabel>
          {episode
            ? `Глава ${episode.ordinal} · ${episode.title}`
            : story.title}
        </SectionLabel>
        <Text variant="caption" color={nativeColors.textMuted}>
          Финал · {character.name}
        </Text>
        <Text variant="display">{ending.title}</Text>
        <Text color={nativeColors.textSecondary} style={styles.lead}>
          История запомнила {formatChoiceCount(run.events.length)}.
        </Text>
      </View>
      <Divider />
      <View style={styles.facts}>
        <SectionLabel>Что осталось после разговора</SectionLabel>
        {ending.epilogueFacts.map((fact, index) => (
          <View key={fact} style={styles.fact}>
            <Pill tone="accent">{String(index + 1).padStart(2, '0')}</Pill>
            <Text style={styles.factText}>{fact}</Text>
          </View>
        ))}
      </View>
      <View style={styles.summary}>
        <Text variant="heading">Ключевые решения</Text>
        {keyEvents.map((event, index) => {
          const entry = run.transcript.find(
            item => item.choiceId === event.choiceId,
          )
          return (
            <View key={event.eventId} style={styles.pathItem}>
              <Text variant="mono" color={nativeColors.textMuted}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.factText}>
                {entry?.text ?? event.choiceId}
              </Text>
            </View>
          )
        })}
      </View>
      <View style={styles.actions}>
        <Button
          label="Пройти иначе"
          icon={ArrowCounterClockwise}
          loading={busy}
          onPress={() => void replay()}
        />
        <Button
          label="В архив"
          icon={Tray}
          variant="secondary"
          onPress={() => void archive()}
        />
        <Button
          label="К другим историям"
          icon={ArrowRight}
          variant="quiet"
          onPress={() => router.replace('/(tabs)/stories')}
        />
      </View>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    hero: { paddingVertical: spacing[10], gap: spacing[4] },
    lead: { fontSize: 18, lineHeight: 29 },
    facts: { gap: spacing[4] },
    fact: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
    factText: { flex: 1 },
    summary: { gap: spacing[3] },
    pathItem: {
      flexDirection: 'row',
      gap: spacing[3],
      paddingBottom: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.border,
    },
    actions: { gap: spacing[3] },
  })
