import { radius, spacing, touchTarget } from '@razvilka/design-system'
import type { Story } from '@razvilka/content-schema'
import { useRouter } from 'expo-router'
import {
  ArrowRight,
  GitBranchIcon,
  SlidersHorizontal,
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
  type CatalogSort,
  type DurationFilter,
  queryCatalogStories,
} from '@/catalog-query'
import { countActiveCatalogFilters } from '@/catalog-filter-options'
import { contentForBuild } from '@/content-for-run'
import { formatRunCount, formatStoryCount } from '@/format'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { CatalogFilterSheet } from '@/ui/CatalogFilterSheet'
import { StoryCard } from '@/ui/StoryCard'
import {
  Button,
  EmptyState,
  InlineError,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

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
  } = useApp()
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [tone, setTone] = useState<string | null>(null)
  const [duration, setDuration] = useState<DurationFilter>('any')
  const [status, setStatus] = useState<Story['status'] | null>(null)
  const [rating, setRating] = useState<Story['rating'] | null>(null)
  const [downloadedOnly, setDownloadedOnly] = useState(false)
  const [sort, setSort] = useState<CatalogSort>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount = countActiveCatalogFilters({
    genre,
    tone,
    duration,
    status,
    rating,
    downloadedOnly,
    sort,
  })
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
  }

  return (
    <Screen testID="stories-screen">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <SectionLabel>Развилка · локальная библиотека</SectionLabel>
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
          onChangeText={setSearch}
          placeholder="Имя персонажа или история"
          placeholderTextColor={nativeColors.placeholder}
          selectionColor={nativeColors.focus}
          style={styles.search}
          value={search}
        />
        <Pressable
          accessibilityLabel={`Открыть фильтры каталога${
            activeFilterCount > 0 ? `. Выбрано: ${activeFilterCount}` : ''
          }`}
          accessibilityRole="button"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [
            styles.filterTrigger,
            activeFilterCount > 0 && styles.filterTriggerActive,
            pressed && styles.pressed,
          ]}
        >
          <SlidersHorizontal
            color={
              activeFilterCount > 0
                ? nativeColors.emberSoft
                : nativeColors.textPrimary
            }
            size={22}
          />
          <View style={styles.filterTriggerCopy}>
            <Text variant="label">Фильтры</Text>
            <Text variant="caption" color={nativeColors.textMuted}>
              {activeFilterCount > 0
                ? `Выбрано: ${activeFilterCount}`
                : 'Показать все варианты'}
            </Text>
          </View>
          <Text
            variant="label"
            color={
              activeFilterCount > 0
                ? nativeColors.emberSoft
                : nativeColors.textMuted
            }
          >
            {activeFilterCount || 'Все'}
          </Text>
        </Pressable>
        <View style={styles.resultsHeader}>
          <Text variant="caption" color={nativeColors.textMuted}>
            Найдено: {stories.length}
          </Text>
          {search || activeFilterCount > 0 ? (
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
        {stories.length === 0 ? (
          <EmptyState
            title="Ничего не нашлось."
            body="Уберите один из фильтров или сбросьте условия поиска."
          />
        ) : (
          <View style={[styles.grid, width >= 700 && styles.gridWide]}>
            {stories.map(story => (
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
      </View>

      <CatalogFilterSheet
        visible={filtersOpen}
        genres={genres}
        tones={tones}
        genre={genre}
        tone={tone}
        duration={duration}
        status={status}
        rating={rating}
        downloadedOnly={downloadedOnly}
        sort={sort}
        onGenreChange={setGenre}
        onToneChange={setTone}
        onDurationChange={setDuration}
        onStatusChange={setStatus}
        onRatingChange={setRating}
        onDownloadedOnlyChange={setDownloadedOnly}
        onSortChange={setSort}
        onReset={resetFilters}
        onClose={() => setFiltersOpen(false)}
      />
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
    filterTrigger: {
      minHeight: touchTarget.comfortable,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderWidth: 1,
      borderColor: nativeColors.border,
      borderRadius: radius.medium,
      backgroundColor: nativeColors.interactive,
    },
    filterTriggerActive: {
      borderColor: nativeColors.focus,
      backgroundColor: nativeColors.panel,
    },
    filterTriggerCopy: {
      flex: 1,
      gap: spacing[1],
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
