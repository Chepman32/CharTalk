import { radius, spacing } from '@chartalk/design-system'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowRight,
  CaretDown,
  CaretUp,
  CheckCircle,
  DownloadSimple,
  ShieldCheck,
} from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { portraitSource } from '@/content'
import { packageForStory } from '@/catalog'
import {
  discoveredEndingCountForStory,
  latestActiveRunForStory,
} from '@/story-progress'
import { contentPackageByteCount } from '@/persistence/content-store'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { formatBytes, formatEndingCount, formatEpisodeCount } from '@/format'
import {
  Button,
  Divider,
  InlineError,
  Pill,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

export default function StoryDetailScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { storyId } = useLocalSearchParams<{ storyId: string }>()
  const router = useRouter()
  const {
    contentCatalog,
    catalogPackages,
    contentPackages,
    discoveryCatalog,
    catalogCache,
    installedPackages,
    snapshot,
    startStory,
    installContentUpdate,
    error,
    clearError,
  } = useApp()
  const [starting, setStarting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const story = useMemo(
    () => discoveryCatalog.stories.find(item => item.storyId === storyId),
    [discoveryCatalog.stories, storyId],
  )
  const character = discoveryCatalog.characters.find(
    item => item.characterId === story?.characterId,
  )
  const storyPackage = story
    ? packageForStory(contentPackages, story.storyId)
    : null
  const catalogStoryPackage = story
    ? catalogPackages.find(item =>
        item.stories.some(candidate => candidate.storyId === story.storyId),
      )
    : null
  const catalogPackId =
    catalogCache?.data.packId ??
    catalogStoryPackage?.manifest.packId ??
    storyPackage?.manifest.packId ??
    contentCatalog.manifest.packId
  const catalogBuildId =
    catalogCache?.data.buildId ??
    catalogStoryPackage?.manifest.buildId ??
    storyPackage?.manifest.buildId ??
    contentCatalog.manifest.buildId
  const storyRuns = snapshot?.runs.filter(run => run.storyId === storyId) ?? []
  const activeRun = latestActiveRunForStory(storyRuns, storyId)
  const currentCatalogBuildInstalled = contentPackages.some(
    content =>
      content.manifest.packId === catalogPackId &&
      content.manifest.buildId === catalogBuildId &&
      content.stories.some(item => item.storyId === storyId),
  )
  const pinnedRunBuildInstalled = activeRun
    ? contentPackages.some(
        content =>
          content.manifest.buildId === activeRun.contentBuildId &&
          (!activeRun.packId || content.manifest.packId === activeRun.packId),
      )
    : false
  const downloadPackId = activeRun?.packId ?? catalogPackId
  const downloadBuildId = activeRun?.contentBuildId ?? catalogBuildId
  const discoveredEndingCount = discoveredEndingCountForStory(
    storyRuns,
    storyId,
  )
  const episodes = useMemo(
    () =>
      discoveryCatalog.episodes.filter(item =>
        story?.episodeIds.includes(item.episodeId),
      ),
    [discoveryCatalog.episodes, story],
  )
  const downloadBytes = episodes.reduce(
    (total, episode) => total + episode.downloadBytes,
    0,
  )
  const isBundled =
    episodes.length > 0 && episodes.every(episode => episode.isBundled)
  // A cached catalog can describe a newer build than the one currently on
  // the device. Bundled episode metadata is the source of truth for offline
  // availability; never ask the reader to download embedded content.
  const isInstalled =
    isBundled ||
    Boolean(storyPackage) ||
    currentCatalogBuildInstalled ||
    pinnedRunBuildInstalled
  const installedPackage = storyPackage
    ? installedPackages.find(
        item =>
          item.packId === storyPackage.manifest.packId &&
          item.buildId === storyPackage.manifest.buildId,
      )
    : catalogStoryPackage
      ? installedPackages.find(
          item =>
            item.packId === catalogStoryPackage.manifest.packId &&
            item.buildId === catalogStoryPackage.manifest.buildId,
        )
      : undefined
  // The bundled package record is hydrated asynchronously. Compute the exact
  // local payload immediately as a fallback so the first paint never shows
  // the declared episode download size for content that is already embedded.
  const packageSize =
    installedPackage?.byteCount ??
    (isBundled && storyPackage
      ? contentPackageByteCount(storyPackage)
      : downloadBytes)
  const warnings = discoveryCatalog.warnings.filter(item =>
    story?.warningIds.includes(item.warningId),
  )
  const [collapsedWarningIds, setCollapsedWarningIds] = useState<Set<string>>(
    () => new Set(),
  )

  if (!story || !character) {
    return (
      <Screen>
        <Text variant="title">История не найдена</Text>
        <Button
          label="Вернуться"
          variant="quiet"
          onPress={() => router.back()}
        />
      </Screen>
    )
  }

  const begin = async (safeRouteWarningId?: string) => {
    if (!isInstalled) return
    setStarting(true)
    try {
      const run = await startStory(
        story.storyId,
        safeRouteWarningId ? { safeRouteWarningId } : undefined,
      )
      router.replace({
        pathname:
          run.status === 'completed' ? '/recap/[runId]' : '/run/[runId]',
        params: { runId: run.runId },
      })
    } finally {
      setStarting(false)
    }
  }

  const download = async () => {
    if (downloading || isInstalled) return
    setDownloading(true)
    try {
      await installContentUpdate(downloadPackId, downloadBuildId)
    } finally {
      setDownloading(false)
    }
  }

  const openRun = () => {
    if (!activeRun) return
    router.replace({
      pathname: '/run/[runId]',
      params: { runId: activeRun.runId },
    })
  }

  const primaryAction = () => {
    if (activeRun) {
      openRun()
      return
    }
    void begin()
  }

  return (
    <Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть профиль персонажа ${character.name}`}
        onPress={() =>
          router.push({
            pathname: '/character/[characterId]',
            params: { characterId: character.characterId },
          })
        }
        style={({ pressed }) => [
          styles.portraitFrame,
          pressed && styles.portraitPressed,
        ]}
      >
        <Image
          accessible={false}
          source={portraitSource(character.portraitAssetId)}
          style={styles.portrait}
          contentFit="cover"
        />
        <View style={styles.portraitCaption}>
          <View style={styles.portraitCaptionPanel}>
            <Text variant="mono" color={nativeColors.mediaTextMuted}>
              {character.ageLabel}
            </Text>
            <Text variant="display" color={nativeColors.mediaText}>
              {character.name}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.copy}>
        <View style={styles.meta}>
          <Pill tone="accent">{story.rating}</Pill>
          <Pill>{story.durationMinutes} мин</Pill>
          <Pill>{isInstalled ? 'Офлайн' : 'Нужна загрузка'}</Pill>
        </View>
        <View
          accessibilityLabel={`${isInstalled ? (isBundled ? 'Доступно' : 'Сохранено') : 'Нужно скачать'} офлайн. ${isBundled ? `встроенный пакет ${formatBytes(packageSize)}` : formatBytes(downloadBytes)}. ${formatEpisodeCount(episodes.length)}.`}
          style={styles.downloadStatus}
        >
          {isInstalled ? (
            <CheckCircle color={nativeColors.moss} size={22} weight="fill" />
          ) : (
            <DownloadSimple color={nativeColors.ochre} size={22} />
          )}
          <View style={styles.downloadCopy}>
            <Text variant="label">
              {!isInstalled
                ? 'Сначала скачайте историю'
                : isBundled
                  ? 'Доступно офлайн'
                  : 'Сохранено на устройстве'}
            </Text>
            <Text variant="caption" color={nativeColors.textMuted}>
              {isBundled
                ? `Встроено в пакет · ${formatBytes(packageSize)}`
                : `${formatBytes(downloadBytes)} · ${formatEpisodeCount(episodes.length)}`}
            </Text>
          </View>
        </View>
        {storyRuns.length > 0 ? (
          <Text variant="caption" color={nativeColors.textMuted}>
            {formatEndingCount(discoveredEndingCount)} найдено · без названий
            скрытых финалов
          </Text>
        ) : null}
        <SectionLabel>{character.genres.join(' · ')}</SectionLabel>
        <Text variant="title">{story.title}</Text>
        <Text color={nativeColors.textSecondary} style={styles.lead}>
          {story.premise}
        </Text>
        <Divider />
        <Text variant="heading">Кто перед вами</Text>
        <Text color={nativeColors.textSecondary}>{character.description}</Text>
        <View style={styles.disclosure}>
          <Text variant="label">Вымышленный персонаж · авторский сценарий</Text>
          <Text variant="caption" color={nativeColors.textSecondary}>
            Все сообщения заранее написаны редакцией CharTalk. Это не живой
            собеседник и не ИИ-чат.
          </Text>
        </View>
        <View style={styles.dynamics}>
          {character.dynamics.map(item => (
            <Pill key={item}>{item}</Pill>
          ))}
        </View>
      </View>

      {warnings.length ? (
        <View style={styles.warning}>
          <View style={styles.warningTitle}>
            <ShieldCheck color={nativeColors.ochre} size={23} weight="fill" />
            <Text variant="heading">Перед началом</Text>
          </View>
          {!snapshot?.settings.showContentWarnings ? (
            <Text variant="caption" color={nativeColors.textSecondary}>
              Подробности предупреждений скрыты вашей настройкой. Безопасный
              маршрут остаётся доступен.
            </Text>
          ) : null}
          {warnings.map(warning => {
            const collapsed = collapsedWarningIds.has(warning.warningId)
            return (
              <View key={warning.warningId} style={styles.warningCopy}>
                {snapshot?.settings.showContentWarnings ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Предупреждение: ${warning.summary}`}
                      accessibilityState={{ expanded: !collapsed }}
                      onPress={() =>
                        setCollapsedWarningIds(current => {
                          const next = new Set(current)
                          if (next.has(warning.warningId)) {
                            next.delete(warning.warningId)
                          } else {
                            next.add(warning.warningId)
                          }
                          return next
                        })
                      }
                      style={styles.warningToggle}
                    >
                      <Text style={styles.warningToggleCopy}>
                        {warning.summary}
                      </Text>
                      {collapsed ? (
                        <CaretDown
                          color={nativeColors.textSecondary}
                          size={20}
                        />
                      ) : (
                        <CaretUp color={nativeColors.textSecondary} size={20} />
                      )}
                    </Pressable>
                    {!collapsed ? (
                      <Text
                        variant="caption"
                        color={nativeColors.textSecondary}
                      >
                        {warning.detail}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {isInstalled && warning.safeRoute ? (
                  <Button
                    label="Начать без этой сцены"
                    variant="quiet"
                    loading={starting}
                    onPress={() => void begin(warning.warningId)}
                  />
                ) : null}
              </View>
            )
          })}
        </View>
      ) : null}

      {error ? <InlineError message={error} onDismiss={clearError} /> : null}
      <View style={styles.actions}>
        <Button
          label={
            activeRun
              ? 'Продолжить историю'
              : !isInstalled
                ? 'Скачать историю'
                : storyRuns.length > 0
                  ? 'Новая попытка'
                  : 'Начать историю'
          }
          icon={!isInstalled ? DownloadSimple : ArrowRight}
          loading={starting || downloading}
          onPress={() => void (isInstalled ? primaryAction() : download())}
          testID="start-story"
        />
      </View>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    portraitFrame: {
      minHeight: 420,
      borderRadius: radius.large,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: nativeColors.border,
    },
    portraitPressed: { opacity: 0.92 },
    portrait: { position: 'absolute', inset: 0 },
    portraitCaption: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    portraitCaptionPanel: {
      gap: spacing[1],
      padding: spacing[5],
      backgroundColor: nativeColors.mediaScrim,
    },
    copy: { gap: spacing[4] },
    meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    downloadStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingVertical: spacing[1],
    },
    downloadCopy: { flex: 1, gap: spacing[1] },
    lead: { fontSize: 18, lineHeight: 29 },
    disclosure: {
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    dynamics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    warning: {
      backgroundColor: nativeColors.panel,
      borderLeftColor: nativeColors.ochre,
      borderLeftWidth: 3,
      padding: spacing[5],
      gap: spacing[4],
    },
    warningTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    warningCopy: { gap: spacing[3] },
    warningToggle: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    warningToggleCopy: { flex: 1 },
    actions: { gap: spacing[3] },
  })
