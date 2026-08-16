import { radius, spacing, touchTarget } from '@chartalk/design-system'
import type { Story } from '@chartalk/content-schema'
import { useRouter } from 'expo-router'
import {
  ArrowRight,
  DownloadSimple,
  GitBranchIcon,
  Sparkle,
} from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'

import {
  catalogPage,
  type CatalogSort,
  type DurationFilter,
  queryCatalogStories,
} from '@/catalog-query'
import { contentForBuild } from '@/content-for-run'
import { formatRunCount, formatStoryCount } from '@/format'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { StoryCard } from '@/ui/StoryCard'
import {
  Button,
  EmptyState,
  InlineError,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

const PAGE_SIZE = 6
const durationValues: DurationFilter[] = ['any', 'short', 'medium', 'long']
const sortValues: CatalogSort[] = [
  'recommended',
  'newest',
  'updated',
  'short',
  'complete',
]
const statusValues: Array<Story['status'] | null> = [
  null,
  'complete',
  'ongoing',
  'mini',
]
const ratingValues: Array<Story['rating'] | null> = [null, '12+', '16+', '18+']

const nextValue = <T,>(values: readonly T[], current: T): T => {
  const index = values.indexOf(current)
  return values[(index + 1) % values.length] ?? values[0]!
}

export default function StoriesScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const router = useRouter()
  const { width } = useWindowDimensions()
  const {
    contentCatalog,
    discoveryCatalog,
    contentPackages,
    installedPackages,
    snapshot,
    error,
    clearError,
    catalogStatus,
    catalogUpdatedAt,
    refreshCatalog,
  } = useApp()
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [tone, setTone] = useState<string | null>(null)
  const [duration, setDuration] = useState<DurationFilter>('any')
  const [status, setStatus] = useState<Story['status'] | null>(null)
  const [rating, setRating] = useState<Story['rating'] | null>(null)
  const [downloadedOnly, setDownloadedOnly] = useState(false)
  const [sort, setSort] = useState<CatalogSort>('recommended')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const activeRuns = snapshot?.runs.filter(run => run.status === 'active') ?? []
  const branchedStoryIds = useMemo(() => {
    const runStoryIds = new Set(snapshot?.runs.map(run => run.storyId) ?? [])
    return discoveryCatalog.stories
      .filter(story => runStoryIds.has(story.storyId))
      .map(story => story.storyId)
  }, [discoveryCatalog.stories, snapshot?.runs])
  const recommendedStoryId = discoveryCatalog.stories.find(
    story => story.characterId === snapshot?.profile?.selectedCharacterId,
  )?.storyId
  const hiddenCategories = snapshot?.settings.hiddenContentCategories ?? []
  const genres = useMemo(
    () => [
      ...new Set(discoveryCatalog.characters.flatMap(item => item.genres)),
    ],
    [discoveryCatalog.characters],
  )
  const tones = useMemo(
    () => [
      ...new Set(discoveryCatalog.characters.flatMap(item => item.dynamics)),
    ],
    [discoveryCatalog.characters],
  )
  const downloadedStoryIds = useMemo(
    () => new Set(contentCatalog.stories.map(story => story.storyId)),
    [contentCatalog.stories],
  )
  const stories = useMemo(
    () =>
      queryCatalogStories(
        discoveryCatalog,
        {
          search,
          genre,
          tone,
          duration,
          status,
          rating,
          downloadedOnly,
          sort,
          hiddenCategories,
        },
        recommendedStoryId,
        downloadedStoryIds,
      ),
    [
      discoveryCatalog,
      downloadedOnly,
      downloadedStoryIds,
      duration,
      genre,
      hiddenCategories,
      rating,
      recommendedStoryId,
      search,
      sort,
      status,
      tone,
    ],
  )
  const page = catalogPage(stories, visibleCount)
  const boundaryVisibleCount = useMemo(
    () =>
      queryCatalogStories(discoveryCatalog, {
        search: '',
        genre: null,
        tone: null,
        duration: 'any',
        status: null,
        rating: null,
        downloadedOnly: false,
        sort: 'recommended',
        hiddenCategories,
      }).length,
    [discoveryCatalog, hiddenCategories],
  )
  const hiddenStoryCount =
    discoveryCatalog.stories.length - boundaryVisibleCount
  const resetFilters = () => {
    setSearch('')
    setGenre(null)
    setTone(null)
    setDuration('any')
    setStatus(null)
    setRating(null)
    setDownloadedOnly(false)
    setSort('recommended')
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <Screen testID="stories-screen">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <SectionLabel>CharTalk · локальная библиотека</SectionLabel>
          <Text variant="title">
            Добрый вечер
            {snapshot?.profile?.displayName
              ? `, ${snapshot.profile.displayName}`
              : ''}
            .
          </Text>
          <Text color={nativeColors.textSecondary}>
            {formatStoryCount(contentCatalog.stories.length)} уже встроены —
            сеть для чтения не понадобится.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть обновления"
          onPress={() => router.push('/downloads')}
          style={styles.iconButton}
        >
          <DownloadSimple color={nativeColors.textPrimary} size={22} />
        </Pressable>
      </View>

      {error ? <InlineError message={error} onDismiss={clearError} /> : null}

      {activeRuns.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>Продолжить</SectionLabel>
          {activeRuns.map(run => {
            const runContent = contentForBuild(
              contentPackages,
              run.contentBuildId,
              run.packId,
            )
            if (!runContent) {
              const bundledRun = installedPackages.some(
                item =>
                  item.status === 'bundled' &&
                  item.buildId === run.contentBuildId &&
                  (!run.packId || item.packId === run.packId),
              )
              return (
                <View key={run.runId} style={styles.continueCardMissing}>
                  <View style={styles.continueCopy}>
                    <Text variant="caption" color={nativeColors.ochre}>
                      {bundledRun
                        ? 'Офлайн-версия встроена'
                        : 'Пакет этой версии не установлен'}
                    </Text>
                    <Text variant="heading">
                      {bundledRun
                        ? 'Готовим продолжение'
                        : 'Продолжение недоступно'}
                    </Text>
                    <Text variant="caption" color={nativeColors.textMuted}>
                      {bundledRun
                        ? 'Откройте прохождение — точный сохранённый текст загрузится с устройства.'
                        : `Сборка ${run.contentBuildId} нужна, чтобы открыть точный сохранённый текст.`}
                    </Text>
                  </View>
                  <Button
                    label={bundledRun ? 'Продолжить' : 'Восстановить версию'}
                    variant="quiet"
                    onPress={() =>
                      bundledRun
                        ? router.push({
                            pathname: '/run/[runId]',
                            params: { runId: run.runId },
                          })
                        : router.push('/downloads')
                    }
                  />
                </View>
              )
            }
            const story = runContent.stories.find(
              item => item.storyId === run.storyId,
            )
            const character = runContent.characters.find(
              item => item.characterId === run.characterId,
            )
            if (!story || !character) return null
            return (
              <Pressable
                key={run.runId}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/run/[runId]',
                    params: { runId: run.runId },
                  })
                }
                style={({ pressed }) => [
                  styles.continueCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.continueCopy}>
                  <Text variant="caption" color={nativeColors.emberSoft}>
                    {character.name} · выбор {run.sequence + 1}
                  </Text>
                  <Text variant="heading">{story.title}</Text>
                </View>
                <ArrowRight
                  color={nativeColors.textPrimary}
                  size={24}
                  weight="bold"
                />
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {branchedStoryIds.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>Карты развилок</SectionLabel>
          <Text color={nativeColors.textSecondary}>
            Отдельная карта ваших решений — без спойлеров ненайденных путей.
          </Text>
          {branchedStoryIds.map(storyId => {
            const story = discoveryCatalog.stories.find(
              item => item.storyId === storyId,
            )
            if (!story) return null
            const runCount =
              snapshot?.runs.filter(run => run.storyId === storyId).length ?? 0
            return (
              <Button
                key={storyId}
                label={`${story.title} · ${formatRunCount(runCount)}`}
                icon={GitBranchIcon}
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/branches/[storyId]',
                    params: { storyId },
                  })
                }
              />
            )
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionLabel>
          Каталог
          {catalogStatus === 'fresh'
            ? ' · обновлён'
            : catalogStatus === 'cached'
              ? ` · кэш от ${formatCatalogDate(catalogUpdatedAt)}`
              : ''}
        </SectionLabel>
        <TextInput
          accessibilityLabel="Поиск по персонажам и историям"
          autoCorrect={false}
          onChangeText={value => {
            setSearch(value)
            setVisibleCount(PAGE_SIZE)
          }}
          placeholder="Имя персонажа или история"
          placeholderTextColor={nativeColors.placeholder}
          selectionColor={nativeColors.focus}
          style={styles.search}
          value={search}
        />
        <View style={styles.filters}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setGenre(nextValue([null, ...genres], genre))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, Boolean(genre) && styles.chipActive]}
          >
            <Text variant="caption">Жанр: {genre ?? 'все'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setTone(nextValue([null, ...tones], tone))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, Boolean(tone) && styles.chipActive]}
          >
            <Text variant="caption">Тон: {tone ?? 'любой'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDuration(nextValue(durationValues, duration))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, duration !== 'any' && styles.chipActive]}
          >
            <Text variant="caption">
              Длина:{' '}
              {duration === 'any'
                ? 'любая'
                : duration === 'short'
                  ? 'до 15 мин'
                  : duration === 'medium'
                    ? '15–30 мин'
                    : '30+ мин'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setStatus(nextValue(statusValues, status))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, Boolean(status) && styles.chipActive]}
          >
            <Text variant="caption">
              Статус:{' '}
              {status === 'complete'
                ? 'завершена'
                : status === 'ongoing'
                  ? 'выходит'
                  : status === 'mini'
                    ? 'мини'
                    : 'любой'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRating(nextValue(ratingValues, rating))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, Boolean(rating) && styles.chipActive]}
          >
            <Text variant="caption">Рейтинг: {rating ?? 'любой'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: downloadedOnly }}
            onPress={() => {
              setDownloadedOnly(value => !value)
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, downloadedOnly && styles.chipActive]}
          >
            <Text variant="caption">На устройстве</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSort(nextValue(sortValues, sort))
              setVisibleCount(PAGE_SIZE)
            }}
            style={[styles.chip, sort !== 'recommended' && styles.chipActive]}
          >
            <Text variant="caption">
              Сначала:{' '}
              {sort === 'recommended'
                ? 'рекомендованные'
                : sort === 'newest'
                  ? 'новые'
                  : sort === 'updated'
                    ? 'обновлённые'
                    : sort === 'short'
                      ? 'короткие'
                      : 'завершённые'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.resultsHeader}>
          <Text variant="caption" color={nativeColors.textMuted}>
            Найдено: {stories.length}
          </Text>
          {search ||
          genre ||
          tone ||
          duration !== 'any' ||
          status ||
          rating ||
          downloadedOnly ||
          sort !== 'recommended' ? (
            <Pressable accessibilityRole="button" onPress={resetFilters}>
              <Text variant="label" color={nativeColors.emberSoft}>
                Сбросить
              </Text>
            </Pressable>
          ) : null}
        </View>
        {hiddenStoryCount > 0 ? (
          <View style={styles.filteredNote}>
            <Text color={nativeColors.textSecondary}>
              {hiddenStoryCount} история скрыта вашими настройками тем.
            </Text>
            <Button
              label="Изменить фильтр"
              variant="quiet"
              onPress={() => router.push('/content-controls')}
            />
          </View>
        ) : null}
        {page.items.length === 0 ? (
          <EmptyState
            title="Ничего не нашлось."
            body="Уберите один из фильтров или сбросьте условия поиска."
          />
        ) : (
          <View style={[styles.grid, width >= 700 && styles.gridWide]}>
            {page.items.map(story => (
              <View
                key={story.storyId}
                style={width >= 700 ? styles.gridCell : undefined}
              >
                {story.storyId === recommendedStoryId ? (
                  <View style={styles.recommended}>
                    <Sparkle
                      color={nativeColors.inverse}
                      size={14}
                      weight="fill"
                    />
                    <Text variant="mono" color={nativeColors.inverse}>
                      Для начала
                    </Text>
                  </View>
                ) : null}
                <StoryCard
                  story={story}
                  character={discoveryCatalog.characters.find(
                    item => item.characterId === story.characterId,
                  )}
                  isDownloaded={downloadedStoryIds.has(story.storyId)}
                  onPress={() =>
                    router.push({
                      pathname: '/story/[storyId]',
                      params: { storyId: story.storyId },
                    })
                  }
                />
              </View>
            ))}
          </View>
        )}
        {page.hasMore ? (
          <Button
            label={`Показать ещё ${Math.min(PAGE_SIZE, stories.length - visibleCount)}`}
            variant="secondary"
            onPress={() => setVisibleCount(count => count + PAGE_SIZE)}
          />
        ) : null}
      </View>

      <View style={styles.offlineNote}>
        <Text variant="heading">
          {catalogStatus === 'unavailable' ||
          catalogStatus === 'invalid' ||
          catalogStatus === 'error'
            ? 'Встроенные истории доступны офлайн.'
            : `Все ${formatStoryCount(contentCatalog.stories.length)} доступны офлайн.`}
        </Text>
        <Text color={nativeColors.textSecondary}>
          {catalogStatus === 'unavailable' ||
          catalogStatus === 'invalid' ||
          catalogStatus === 'error'
            ? 'Каталог не обновился, но встроенные истории и сохранённые карточки никуда не делись.'
            : 'Ничего скачивать для чтения не нужно. Обновления никогда не заменяют версию, по которой идёт активное прохождение.'}
        </Text>
        {catalogStatus !== 'fresh' ? (
          <Button
            label="Обновить каталог"
            variant="quiet"
            loading={catalogStatus === 'loading'}
            onPress={() => void refreshCatalog()}
          />
        ) : null}
        <Button
          label="Управлять обновлениями"
          variant="quiet"
          onPress={() => router.push('/downloads')}
        />
      </View>
    </Screen>
  )
}

const formatCatalogDate = (value: string | null): string => {
  if (!value) return 'ранее'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'ранее'
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[4],
      paddingTop: spacing[4],
    },
    headerCopy: { flex: 1, gap: spacing[2] },
    iconButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: nativeColors.border,
      borderRadius: radius.pill,
    },
    section: { gap: spacing[4] },
    search: {
      minHeight: 50,
      color: nativeColors.textPrimary,
      backgroundColor: nativeColors.input,
      borderWidth: 1,
      borderColor: nativeColors.inputBorder,
      borderRadius: radius.medium,
      paddingHorizontal: spacing[4],
      fontSize: 16,
    },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    chip: {
      minHeight: touchTarget.minimum,
      justifyContent: 'center',
      paddingHorizontal: spacing[3],
      borderWidth: 1,
      borderColor: nativeColors.border,
      borderRadius: radius.pill,
    },
    chipActive: {
      borderColor: nativeColors.focus,
      backgroundColor: nativeColors.panel,
    },
    resultsHeader: {
      minHeight: touchTarget.minimum,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[3],
    },
    filteredNote: {
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    continueCard: {
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ember,
      backgroundColor: nativeColors.panel,
      padding: spacing[5],
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
    },
    continueCardMissing: {
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
      backgroundColor: nativeColors.panel,
      padding: spacing[5],
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
    },
    continueCopy: { flex: 1, gap: spacing[1] },
    pressed: { opacity: 0.72 },
    grid: { gap: spacing[5] },
    gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
    gridCell: { width: '48%', flexGrow: 1 },
    recommended: {
      position: 'absolute',
      zIndex: 2,
      right: spacing[4],
      top: spacing[4],
      flexDirection: 'row',
      gap: spacing[1],
      alignItems: 'center',
      backgroundColor: nativeColors.emberSoft,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radius.pill,
    },
    offlineNote: {
      borderTopWidth: 1,
      borderTopColor: nativeColors.border,
      paddingTop: spacing[6],
      gap: spacing[3],
    },
  })
