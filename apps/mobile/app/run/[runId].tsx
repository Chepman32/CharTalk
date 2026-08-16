import { renderAuthoredText, type TranscriptEntry } from '@chartalk/app-core'
import { radius, spacing, touchTarget } from '@chartalk/design-system'
import { resolveDecision } from '@chartalk/dialogue-engine'
import { useAudioPlayer } from 'expo-audio'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Flag, GitBranchIcon, PaperPlaneRight, X } from 'phosphor-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { uiAudioSources } from '@/audio'
import { assetSource } from '@/content'
import { contentForBuild } from '@/content-for-run'
import { messageRevealDelayMs } from '@/domain/reading-motion'
import { createOperationId } from '@/domain/operation-id'
import { formatMessageAccessibility } from '@/format'
import {
  moveTranscriptWindow,
  resolveTranscriptWindow,
  transcriptWindowEntries,
  type TranscriptWindow,
} from '@/domain/transcript-window'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { Button, InlineError, Text } from '@/ui/primitives'

const UNDO_WINDOW_MS = 3_000
const CHOICE_TRAY_MAX_HEIGHT_DP = 280
const CHOICE_TRAY_MIN_HEIGHT_DP = 220
const CHOICE_TRAY_VIEWPORT_RATIO = 0.42

type AudioPlayer = ReturnType<typeof useAudioPlayer>

const playFromStart = (player: AudioPlayer) => {
  void player
    .seekTo(0)
    .then(() => player.play())
    .catch(() => {})
}

export default function RunScreen() {
  const nativeColors = useThemeColors()
  const { height: windowHeight } = useWindowDimensions()
  // Standard Russian choices fit in the max budget; shorter viewports and
  // larger text retain a bounded vertical ScrollView instead of clipping.
  const choiceTrayMaxHeight = Math.min(
    CHOICE_TRAY_MAX_HEIGHT_DP,
    Math.max(
      CHOICE_TRAY_MIN_HEIGHT_DP,
      windowHeight * CHOICE_TRAY_VIEWPORT_RATIO,
    ),
  )
  const styles = useMemo(
    () => createStyles(nativeColors, choiceTrayMaxHeight),
    [choiceTrayMaxHeight, nativeColors],
  )
  const choicePlayer = useAudioPlayer(uiAudioSources.choice)
  const commitPlayer = useAudioPlayer(uiAudioSources.commit)
  const { runId } = useLocalSearchParams<{ runId: string }>()
  const router = useRouter()
  const {
    snapshot,
    contentPackages,
    ensureContentForBuild,
    setProvisional,
    clearProvisional,
    getTranscriptAnchor,
    setTranscriptAnchor,
    commitChoice,
    reportDiagnostic,
    error,
    clearError,
  } = useApp()
  const run = snapshot?.runs.find(item => item.runId === runId)
  const runContent = run
    ? contentForBuild(contentPackages, run.contentBuildId, run.packId)
    : undefined
  const [contentLoading, setContentLoading] = useState(false)
  const nodesById = useMemo(
    () => new Map(runContent?.nodes.map(item => [item.nodeId, item]) ?? []),
    [runContent?.nodes],
  )
  const node = run ? nodesById.get(run.activeNodeId) : undefined
  const resolvedDecision =
    node?.type === 'decision' && run ? resolveDecision(node, run.state) : null
  const decision = resolvedDecision
    ? {
        ...resolvedDecision,
        choices: resolvedDecision.choices.map(choice => ({
          ...choice,
          text: renderAuthoredText(choice.text, snapshot?.profile ?? null),
        })),
      }
    : null
  const story =
    run && runContent
      ? runContent.stories.find(item => item.storyId === run.storyId)
      : undefined
  const episode = run
    ? runContent?.episodes.find(item => item.episodeId === run.episodeId)
    : undefined
  const character = run
    ? runContent?.characters.find(item => item.characterId === run.characterId)
    : undefined
  const existingProvisional =
    snapshot?.provisional?.runId === runId ? snapshot.provisional : null
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    existingProvisional?.choiceId ?? null,
  )
  const [recoveredProvisional, setRecoveredProvisional] = useState(
    Boolean(existingProvisional),
  )
  const [committing, setCommitting] = useState(false)
  const [typing, setTyping] = useState(false)
  const [visibleTranscriptCount, setVisibleTranscriptCount] = useState(
    run?.transcript.length ?? 0,
  )
  const [transcriptWindow, setTranscriptWindow] = useState<TranscriptWindow>(
    () =>
      resolveTranscriptWindow(
        run?.transcript ?? [],
        run?.transcript.length ?? 0,
        null,
      ),
  )
  const [pendingRecap, setPendingRecap] = useState(false)
  const listRef = useRef<FlatList<TranscriptEntry>>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleAnchorRef = useRef<string | null>(null)
  const anchorHydratedRunRef = useRef<string | null>(null)
  const decisionPresentedKeyRef = useRef<string | null>(null)
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current
  const typingOpacity = useRef(new Animated.Value(0)).current

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

  const selectedChoice = decision?.choices.find(
    item => item.choiceId === selectedChoiceId,
  )

  const doCommit = useCallback(async () => {
    if (!run || !selectedChoiceId || committing) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setCommitting(true)
    try {
      if (snapshot?.settings.haptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      setTyping(true)
      Animated.timing(typingOpacity, {
        toValue: 1,
        duration: snapshot?.settings.reduceMotion ? 0 : 180,
        useNativeDriver: true,
      }).start()
      const updated = await commitChoice({
        runId: run.runId,
        operationId: createOperationId(),
        expectedSequence: run.sequence,
        expectedNodeId: run.activeNodeId,
        choiceId: selectedChoiceId,
      })
      if (snapshot?.settings.sound) playFromStart(commitPlayer)
      setSelectedChoiceId(null)
      setRecoveredProvisional(false)
      if (updated.status === 'completed') setPendingRecap(true)
    } finally {
      setTyping(false)
      typingOpacity.setValue(0)
      setCommitting(false)
    }
  }, [
    commitChoice,
    commitPlayer,
    committing,
    run,
    selectedChoiceId,
    snapshot?.settings,
    typingOpacity,
  ])

  useEffect(() => {
    if (!run) return
    let active = true
    const runIdentifier = run.runId
    const entries = run.transcript
    setVisibleTranscriptCount(entries.length)
    void getTranscriptAnchor(runIdentifier).then(anchorEntryId => {
      if (!active) return
      anchorHydratedRunRef.current = runIdentifier
      setTranscriptWindow(
        resolveTranscriptWindow(entries, entries.length, anchorEntryId),
      )
    })
    return () => {
      active = false
    }
  }, [getTranscriptAnchor, run?.runId])

  useEffect(() => {
    if (!run || !decision || !snapshot?.settings.analytics) return
    const key = `${run.runId}:${run.sequence}`
    if (decisionPresentedKeyRef.current === key) return
    decisionPresentedKeyRef.current = key
    void reportDiagnostic({
      eventName: 'decision_presented',
      contentBuildId: run.contentBuildId,
      occurredAt: new Date().toISOString(),
    })
  }, [
    decision,
    run?.contentBuildId,
    run?.runId,
    run?.sequence,
    reportDiagnostic,
    snapshot?.settings.analytics,
  ])

  useEffect(() => {
    const total = run?.transcript.length ?? 0
    if (visibleTranscriptCount >= total) return
    const settings = snapshot?.settings
    if (!settings) return
    const delay = messageRevealDelayMs(settings)
    if (delay === 0) {
      setVisibleTranscriptCount(total)
      return
    }
    const timer = setTimeout(
      () => setVisibleTranscriptCount(count => Math.min(total, count + 1)),
      delay,
    )
    return () => clearTimeout(timer)
  }, [
    run?.transcript.length,
    snapshot?.settings.messageSpeed,
    snapshot?.settings.reduceMotion,
    snapshot?.settings.revealImmediately,
    visibleTranscriptCount,
  ])

  useEffect(() => {
    if (!run || anchorHydratedRunRef.current !== run.runId) return
    setTranscriptWindow(current => {
      const previousVisibleCount = Math.min(
        visibleTranscriptCount,
        Math.max(current.endIndex, 0),
      )
      const wasAtLatest =
        !current.hasNewer && current.endIndex >= previousVisibleCount
      if (wasAtLatest) {
        return resolveTranscriptWindow(
          run.transcript,
          visibleTranscriptCount,
          null,
        )
      }
      return resolveTranscriptWindow(
        run.transcript,
        visibleTranscriptCount,
        current.anchorEntryId,
      )
    })
  }, [run, visibleTranscriptCount])

  useEffect(() => {
    if (
      !pendingRecap ||
      !run ||
      run.status !== 'completed' ||
      visibleTranscriptCount < run.transcript.length
    ) {
      return
    }
    const delay = snapshot?.settings.messageSpeed === 'slow' ? 1_100 : 700
    const timer = setTimeout(
      () =>
        router.replace({
          pathname: '/recap/[runId]',
          params: { runId: run.runId },
        }),
      delay,
    )
    return () => clearTimeout(timer)
  }, [
    pendingRecap,
    router,
    run,
    snapshot?.settings.messageSpeed,
    visibleTranscriptCount,
  ])

  useEffect(() => {
    if (!selectedChoiceId || recoveredProvisional) return
    timerRef.current = setTimeout(() => void doCommit(), UNDO_WINDOW_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [doCommit, recoveredProvisional, selectedChoiceId])

  useEffect(() => {
    if (run?.transcript.length && !transcriptWindow.hasNewer) {
      const timer = setTimeout(
        () =>
          listRef.current?.scrollToEnd({
            animated: !snapshot?.settings.reduceMotion,
          }),
        80,
      )
      return () => clearTimeout(timer)
    }
  }, [
    run?.transcript.length,
    snapshot?.settings.reduceMotion,
    transcriptWindow.hasNewer,
  ])

  const choose = async (choiceId: string) => {
    if (!run || committing) return
    if (snapshot?.settings.sound) playFromStart(choicePlayer)
    const createdAt = new Date()
    const provisional = {
      runId: run.runId,
      nodeId: run.activeNodeId,
      choiceId,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + UNDO_WINDOW_MS).toISOString(),
    }
    setSelectedChoiceId(choiceId)
    setRecoveredProvisional(false)
    await setProvisional(provisional)
    const optionPosition =
      (decision?.choices.findIndex(choice => choice.choiceId === choiceId) ??
        -1) + 1
    if (optionPosition >= 1 && optionPosition <= 4) {
      void reportDiagnostic({
        eventName: 'choice_selected',
        contentBuildId: run.contentBuildId,
        occurredAt: provisional.createdAt,
        optionPosition: optionPosition as 1 | 2 | 3 | 4,
      })
    }
  }

  const undo = async () => {
    if (!run) return
    const optionPosition =
      (decision?.choices.findIndex(
        choice => choice.choiceId === selectedChoiceId,
      ) ?? -1) + 1
    if (timerRef.current) clearTimeout(timerRef.current)
    setSelectedChoiceId(null)
    setRecoveredProvisional(false)
    await clearProvisional(run.runId)
    void reportDiagnostic({
      eventName: 'choice_undone',
      contentBuildId: run.contentBuildId,
      occurredAt: new Date().toISOString(),
      ...(optionPosition >= 1 && optionPosition <= 4
        ? { optionPosition: optionPosition as 1 | 2 | 3 | 4 }
        : {}),
    })
  }

  const transcript = useMemo<TranscriptEntry[]>(() => {
    if (!run) return []
    return transcriptWindowEntries(run.transcript, transcriptWindow)
  }, [run, transcriptWindow])
  const revealing = visibleTranscriptCount < (run?.transcript.length ?? 0)

  useEffect(() => {
    if (!run || !transcriptWindow.anchorEntryId || transcript.length === 0) {
      return
    }
    const index = transcript.findIndex(
      item => item.entryId === transcriptWindow.anchorEntryId,
    )
    if (index < 0) return
    const timer = setTimeout(
      () =>
        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: transcriptWindow.hasNewer ? 0.35 : 1,
        }),
      0,
    )
    return () => clearTimeout(timer)
  }, [run, transcript, transcriptWindow])

  const moveTranscript = useCallback(
    (direction: 'older' | 'newer') => {
      if (!run) return
      setTranscriptWindow(current =>
        moveTranscriptWindow(
          run.transcript,
          current,
          direction,
          visibleTranscriptCount,
        ),
      )
    },
    [run, visibleTranscriptCount],
  )

  const persistVisibleAnchor = useCallback(() => {
    if (!run || !visibleAnchorRef.current) return
    void setTranscriptAnchor(run.runId, visibleAnchorRef.current)
  }, [run, setTranscriptAnchor])

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ item: TranscriptEntry; isViewable?: boolean }>
    }) => {
      const visible = viewableItems.filter(item => item.isViewable !== false)
      visibleAnchorRef.current = visible.at(-1)?.item.entryId ?? null
    },
  ).current

  if (!run) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="heading">Прохождение не найдено.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!runContent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {contentLoading ? (
            <>
              <ActivityIndicator color={nativeColors.textPrimary} />
              <Text variant="heading">Готовим точную офлайн-версию…</Text>
              <Text
                color={nativeColors.textSecondary}
                style={styles.unavailableCopy}
              >
                Текст этой ветки уже входит в приложение. Нужен короткий момент,
                чтобы открыть локальный раздел.
              </Text>
            </>
          ) : (
            <>
              <Text variant="heading">Версия истории недоступна.</Text>
              <Text
                color={nativeColors.textSecondary}
                style={styles.unavailableCopy}
              >
                Это прохождение сохранено за точной сборкой контента. Загрузите
                её снова, чтобы продолжить без подмены текста.
              </Text>
              <Button
                label="Открыть загрузки"
                onPress={() => router.replace('/downloads')}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    )
  }

  if (!story || !character) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="heading">Прохождение повреждено.</Text>
          <Text
            color={nativeColors.textSecondary}
            style={styles.unavailableCopy}
          >
            Пакет не содержит нужную историю или персонажа. Текст не будет
            заменён другой версией.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть историю"
          onPress={() => router.replace('/(tabs)/stories')}
          style={styles.headerButton}
        >
          <X color={nativeColors.textPrimary} size={22} />
        </Pressable>
        <View
          accessibilityLabel={`${character.name}. ${story.title}.${episode ? ` Глава ${episode.ordinal}: ${episode.title}.` : ''}`}
          style={styles.headerCopy}
        >
          <Text
            maxFontSizeMultiplier={1.25}
            numberOfLines={1}
            scaleWithPreference={false}
            variant="caption"
          >
            {character.name}
          </Text>
          <Text
            color={nativeColors.textMuted}
            maxFontSizeMultiplier={1.15}
            numberOfLines={1}
            scaleWithPreference={false}
            variant="mono"
          >
            {episode
              ? `Глава ${episode.ordinal} · ${episode.title}`
              : story.title}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Сообщить о проблеме"
          onPress={() =>
            router.push({
              pathname: '/report',
              params: { runId: run.runId, nodeId: run.activeNodeId },
            })
          }
          style={styles.headerButton}
        >
          <Flag color={nativeColors.textPrimary} size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть карту развилок"
          onPress={() =>
            router.push({
              pathname: '/branches/[storyId]',
              params: { storyId: run.storyId },
            })
          }
          style={styles.headerButton}
        >
          <GitBranchIcon color={nativeColors.textPrimary} size={20} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <InlineError message={error} onDismiss={clearError} />
        </View>
      ) : null}

      <FlatList<TranscriptEntry>
        ref={listRef}
        data={transcript}
        keyExtractor={item => item.entryId}
        style={styles.transcriptList}
        testID="run-transcript"
        contentContainerStyle={styles.transcript}
        initialNumToRender={20}
        maxToRenderPerBatch={16}
        windowSize={7}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onEndReached={() => {
          if (transcriptWindow.hasNewer) moveTranscript('newer')
        }}
        onEndReachedThreshold={0.2}
        onMomentumScrollEnd={persistVisibleAnchor}
        onScrollEndDrag={persistVisibleAnchor}
        onStartReached={() => {
          if (transcriptWindow.hasOlder) moveTranscript('older')
        }}
        onStartReachedThreshold={0.2}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollToIndexFailed={({ averageItemLength, index }) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, averageItemLength * index),
            animated: false,
          })
        }}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const own = item.speakerId === 'player'
          const notice = item.kind === 'notice'
          const attachment = item.assetId
            ? runContent.assets.find(asset => asset.assetId === item.assetId)
            : undefined
          return (
            <View
              accessibilityLabel={`${own ? 'Вы' : notice ? 'Система' : character.name}: ${formatMessageAccessibility(item.altText, item.text)}`}
              accessibilityLiveRegion={
                item.entryId ===
                run.transcript[visibleTranscriptCount - 1]?.entryId
                  ? 'polite'
                  : 'none'
              }
              style={[
                styles.message,
                own ? styles.messageOwn : styles.messageOther,
                notice && styles.messageNotice,
              ]}
            >
              {!own ? (
                <Text
                  variant="caption"
                  color={notice ? nativeColors.ochre : nativeColors.emberSoft}
                >
                  {notice ? 'Безопасный маршрут' : character.name}
                </Text>
              ) : null}
              {item.messageKind === 'image' && item.assetId ? (
                <Image
                  accessible={false}
                  source={assetSource(item.assetId)}
                  style={[
                    styles.attachment,
                    {
                      aspectRatio: attachment
                        ? attachment.width / attachment.height
                        : 1,
                    },
                  ]}
                  contentFit="cover"
                  transition={snapshot?.settings.reduceMotion ? 0 : 160}
                />
              ) : null}
              <Text
                color={own ? nativeColors.inverse : nativeColors.textPrimary}
              >
                {item.text}
              </Text>
            </View>
          )
        }}
        ListFooterComponent={
          typing || revealing ? (
            <Animated.View
              style={[styles.typing, { opacity: typing ? typingOpacity : 1 }]}
            >
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <Text variant="caption" color={nativeColors.textMuted}>
                {character.name} отвечает…
              </Text>
            </Animated.View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.composer} testID="run-composer">
        {selectedChoice && recoveredProvisional ? (
          <View style={styles.recovered}>
            <Text variant="caption" color={nativeColors.ochre}>
              Незавершённый выбор восстановлен
            </Text>
            <Text>{selectedChoice.text}</Text>
            <View style={styles.recoveredActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void undo()}
                style={styles.textAction}
              >
                <Text variant="label" color={nativeColors.textSecondary}>
                  Выбрать другой
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void doCommit()}
                style={styles.sendAction}
              >
                <Text variant="label" color={nativeColors.inverse}>
                  Отправить
                </Text>
                <PaperPlaneRight
                  color={nativeColors.inverse}
                  size={18}
                  weight="fill"
                />
              </Pressable>
            </View>
          </View>
        ) : selectedChoice ? (
          <View style={styles.pending}>
            <View style={styles.pendingCopy}>
              <Text variant="caption" color={nativeColors.emberSoft}>
                Отправим через 3 секунды
              </Text>
              <Text numberOfLines={2}>{selectedChoice.text}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отменить выбор"
              onPress={() => void undo()}
              style={styles.undoButton}
            >
              <Text variant="label">Отменить</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отправить сейчас"
              onPress={() => void doCommit()}
              style={styles.sendIcon}
            >
              {committing ? (
                <ActivityIndicator color={nativeColors.inverse} />
              ) : (
                <PaperPlaneRight
                  color={nativeColors.inverse}
                  size={20}
                  weight="fill"
                />
              )}
            </Pressable>
          </View>
        ) : revealing ? (
          <View style={styles.completed}>
            <Text variant="caption" color={nativeColors.textMuted}>
              {character.name} отвечает…
            </Text>
          </View>
        ) : run.status === 'completed' ? (
          <View style={styles.completed}>
            <Text variant="caption" color={nativeColors.textMuted}>
              Последняя реакция сохранена. Итог откроется автоматически.
            </Text>
            <Button
              label="Открыть итог"
              onPress={() =>
                router.replace({
                  pathname: '/recap/[runId]',
                  params: { runId: run.runId },
                })
              }
            />
          </View>
        ) : decision ? (
          <ScrollView
            accessibilityLabel="Четыре варианта ответа"
            contentContainerStyle={styles.choicesContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={styles.choices}
          >
            <Text variant="mono" color={nativeColors.textMuted}>
              Выберите интонацию
            </Text>
            {decision.choices.map((choice, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Вариант ${index + 1} из ${decision.choices.length}: ${choice.text}`}
                disabled={committing}
                key={choice.choiceId}
                onPress={() => void choose(choice.choiceId)}
                style={({ pressed }) => [
                  styles.choice,
                  pressed && styles.choicePressed,
                ]}
                testID={`choice-${index + 1}`}
              >
                <Text variant="mono" color={nativeColors.textMuted}>
                  {index + 1}
                </Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const createStyles = (
  nativeColors: ThemeColorAliases,
  choiceTrayMaxHeight: number,
) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: nativeColors.canvas },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    unavailableCopy: {
      maxWidth: 420,
      paddingHorizontal: spacing[6],
      textAlign: 'center',
      marginVertical: spacing[4],
    },
    header: {
      minHeight: 62,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[3],
    },
    headerButton: {
      width: touchTarget.minimum,
      height: touchTarget.minimum,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1, alignItems: 'center' },
    errorWrap: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
    transcriptList: {
      flex: 1,
      minHeight: 0,
    },
    transcript: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      padding: spacing[4],
      gap: spacing[3],
    },
    message: {
      maxWidth: '86%',
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      gap: spacing[1],
    },
    messageOther: {
      alignSelf: 'flex-start',
      backgroundColor: nativeColors.panel,
      borderRadius: radius.medium,
      borderTopLeftRadius: 3,
    },
    messageOwn: {
      alignSelf: 'flex-end',
      backgroundColor: nativeColors.emberSoft,
      borderRadius: radius.medium,
      borderTopRightRadius: 3,
    },
    messageNotice: {
      maxWidth: '100%',
      borderRadius: 0,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    attachment: {
      width: 260,
      maxWidth: '100%',
      borderRadius: radius.small,
      backgroundColor: nativeColors.raised,
    },
    typing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      paddingVertical: spacing[3],
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: nativeColors.textMuted,
    },
    composer: {
      flexShrink: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: nativeColors.border,
      backgroundColor: nativeColors.raised,
    },
    choices: {
      width: '100%',
      maxWidth: 680,
      maxHeight: choiceTrayMaxHeight,
      alignSelf: 'center',
    },
    choicesContent: {
      paddingHorizontal: spacing[4],
      paddingTop: spacing[2],
      paddingBottom: spacing[2],
      gap: spacing[1],
    },
    choice: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.border,
      paddingHorizontal: spacing[2],
    },
    choicePressed: { backgroundColor: nativeColors.interactive },
    choiceText: { flex: 1 },
    pending: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      padding: spacing[3],
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    pendingCopy: { flex: 1, gap: spacing[1] },
    undoButton: {
      minHeight: touchTarget.minimum,
      justifyContent: 'center',
      paddingHorizontal: spacing[2],
    },
    sendIcon: {
      width: touchTarget.minimum,
      height: touchTarget.minimum,
      borderRadius: radius.pill,
      backgroundColor: nativeColors.emberSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completed: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      padding: spacing[4],
      gap: spacing[2],
    },
    recovered: {
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
      padding: spacing[4],
      gap: spacing[2],
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    recoveredActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing[2],
    },
    textAction: {
      minHeight: touchTarget.minimum,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
    },
    sendAction: {
      minHeight: touchTarget.minimum,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingHorizontal: spacing[4],
      backgroundColor: nativeColors.emberSoft,
      borderRadius: radius.medium,
    },
  })
