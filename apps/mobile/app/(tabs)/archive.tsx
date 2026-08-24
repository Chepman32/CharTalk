import { spacing, touchTarget, typography } from '@razvilka/design-system'
import { useRouter } from 'expo-router'
import {
  ArrowRight,
  ClockCounterClockwise,
  GitBranchIcon,
  PencilSimple,
  Trash,
} from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { formatChoiceCount } from '@/format'
import { contentForBuild } from '@/content-for-run'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import {
  Button,
  EmptyState,
  Pill,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

export default function ArchiveScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const router = useRouter()
  const {
    contentCatalog,
    contentPackages,
    installedPackages,
    snapshot,
    renameRun,
    deleteRun,
  } = useApp()
  const [editingRunId, setEditingRunId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const runs = (snapshot?.runs ?? []).slice().reverse()
  const groups = [
    { title: 'В процессе', runs: runs.filter(run => run.status === 'active') },
    {
      title: 'Завершённые',
      runs: runs.filter(run => run.status === 'completed'),
    },
    {
      title: 'Убрано в архив',
      runs: runs.filter(run => run.status === 'archived'),
    },
  ].filter(group => group.runs.length > 0)
  const branchedStoryIds = [
    ...new Set(
      runs
        .filter(
          run =>
            run.parentRunId ||
            runs.filter(other => other.storyId === run.storyId).length > 1,
        )
        .map(run => run.storyId),
    ),
  ]

  const openRun = (runId: string, active: boolean) =>
    router.push({
      pathname: active ? '/run/[runId]' : '/recap/[runId]',
      params: { runId },
    })

  const confirmDelete = (runId: string, label: string) => {
    Alert.alert(
      'Удалить прохождение?',
      `«${label}» исчезнет только с этого устройства. Дочерние ветви сохранятся. Отменить это действие нельзя.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => void deleteRun(runId),
        },
      ],
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <SectionLabel>Локальная память</SectionLabel>
        <Text variant="title">Прохождения</Text>
        <Text color={nativeColors.textSecondary}>
          Активные пути, финалы и ветви хранятся отдельно и доступны без сети.
        </Text>
      </View>
      {groups.length === 0 ? (
        <EmptyState
          title="Здесь пока тихо."
          body="Начните первую историю — её путь появится здесь после первого сохранения."
        />
      ) : (
        groups.map(group => (
          <View key={group.title} style={styles.section}>
            <SectionLabel>{group.title}</SectionLabel>
            {group.runs.map(run => {
              const runContent = contentForBuild(
                contentPackages,
                run.contentBuildId,
                run.packId,
              )
              if (!runContent) {
                const missingLabel = run.label ?? 'Прохождение'
                const editingMissing = editingRunId === run.runId
                const bundledRun = installedPackages.some(
                  item =>
                    item.status === 'bundled' &&
                    item.buildId === run.contentBuildId &&
                    (!run.packId || item.packId === run.packId),
                )
                return (
                  <View key={run.runId} style={styles.item}>
                    {editingMissing ? (
                      <View style={styles.editor}>
                        <Text variant="label">Название прохождения</Text>
                        <TextInput
                          accessibilityLabel="Название прохождения"
                          autoFocus
                          maxLength={60}
                          onChangeText={setDraftLabel}
                          placeholder={missingLabel}
                          placeholderTextColor={nativeColors.placeholder}
                          selectionColor={nativeColors.focus}
                          style={styles.input}
                          value={draftLabel}
                        />
                        <View style={styles.editorActions}>
                          <Button
                            label="Отмена"
                            variant="quiet"
                            onPress={() => setEditingRunId(null)}
                          />
                          <Button
                            label="Сохранить"
                            onPress={() =>
                              void renameRun(run.runId, draftLabel).then(() =>
                                setEditingRunId(null),
                              )
                            }
                          />
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.itemMain}>
                          <View style={styles.icon}>
                            <ClockCounterClockwise
                              color={nativeColors.ochre}
                              size={22}
                            />
                          </View>
                          <View style={styles.copy}>
                            <View style={styles.meta}>
                              <Pill>
                                {bundledRun ? 'Офлайн' : 'Пакет не установлен'}
                              </Pill>
                              <Pill>
                                {formatChoiceCount(run.events.length)}
                              </Pill>
                            </View>
                            <Text variant="heading">{missingLabel}</Text>
                            <Text
                              variant="caption"
                              color={nativeColors.textMuted}
                            >
                              {bundledRun
                                ? 'Точная версия уже встроена. Откройте прохождение — раздел подгрузится локально.'
                                : `Сборка ${run.contentBuildId} нужна для точного восстановления.`}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.itemActions}>
                          <Button
                            label={
                              bundledRun
                                ? run.status === 'active'
                                  ? 'Продолжить'
                                  : 'Открыть итог'
                                : 'Восстановить версию'
                            }
                            variant="quiet"
                            onPress={() =>
                              bundledRun
                                ? openRun(run.runId, run.status === 'active')
                                : router.push('/downloads')
                            }
                          />
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Переименовать прохождение"
                            onPress={() => {
                              setDraftLabel(missingLabel)
                              setEditingRunId(run.runId)
                            }}
                            style={styles.action}
                          >
                            <PencilSimple
                              color={nativeColors.textSecondary}
                              size={19}
                            />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Удалить прохождение"
                            onPress={() =>
                              confirmDelete(run.runId, missingLabel)
                            }
                            style={styles.action}
                          >
                            <Trash color={nativeColors.danger} size={19} />
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
                )
              }
              const story = runContent.stories.find(
                item => item.storyId === run.storyId,
              )
              const character = runContent.characters.find(
                item => item.characterId === run.characterId,
              )
              const ending = runContent.nodes.find(
                item => item.nodeId === run.activeNodeId,
              )
              const lastMessage = run.transcript
                .filter(item => item.kind === 'message')
                .at(-1)?.text
              if (!story || !character) return null
              const label = run.label ?? story.title
              const editing = editingRunId === run.runId
              return (
                <View key={run.runId} style={styles.item}>
                  {editing ? (
                    <View style={styles.editor}>
                      <Text variant="label">Название прохождения</Text>
                      <TextInput
                        accessibilityLabel="Название прохождения"
                        autoFocus
                        maxLength={60}
                        onChangeText={setDraftLabel}
                        placeholder={story.title}
                        placeholderTextColor={nativeColors.placeholder}
                        selectionColor={nativeColors.focus}
                        style={styles.input}
                        value={draftLabel}
                      />
                      <View style={styles.editorActions}>
                        <Button
                          label="Отмена"
                          variant="quiet"
                          onPress={() => setEditingRunId(null)}
                        />
                        <Button
                          label="Сохранить"
                          onPress={() =>
                            void renameRun(run.runId, draftLabel).then(() =>
                              setEditingRunId(null),
                            )
                          }
                        />
                      </View>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Открыть ${label}`}
                        onPress={() =>
                          openRun(run.runId, run.status === 'active')
                        }
                        style={({ pressed }) => [
                          styles.itemMain,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View style={styles.icon}>
                          {run.parentRunId ? (
                            <GitBranchIcon
                              color={nativeColors.emberSoft}
                              size={22}
                            />
                          ) : (
                            <ClockCounterClockwise
                              color={nativeColors.emberSoft}
                              size={22}
                            />
                          )}
                        </View>
                        <View style={styles.copy}>
                          <View style={styles.meta}>
                            <Pill>{character.name}</Pill>
                            <Pill>{formatChoiceCount(run.events.length)}</Pill>
                            <Pill>Офлайн</Pill>
                          </View>
                          <Text variant="heading">{label}</Text>
                          <Text
                            variant="caption"
                            color={nativeColors.textMuted}
                          >
                            {run.status === 'active'
                              ? 'Продолжить'
                              : ending?.type === 'ending'
                                ? ending.title
                                : 'Путь сохранён'}
                          </Text>
                          {lastMessage ? (
                            <Text
                              variant="caption"
                              color={nativeColors.textSecondary}
                              numberOfLines={2}
                            >
                              «{lastMessage}»
                            </Text>
                          ) : null}
                        </View>
                        <ArrowRight
                          color={nativeColors.textPrimary}
                          size={22}
                        />
                      </Pressable>
                      <View style={styles.itemActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Переименовать прохождение"
                          onPress={() => {
                            setDraftLabel(label)
                            setEditingRunId(run.runId)
                          }}
                          style={styles.action}
                        >
                          <PencilSimple
                            color={nativeColors.textSecondary}
                            size={19}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Удалить прохождение"
                          onPress={() => confirmDelete(run.runId, label)}
                          style={styles.action}
                        >
                          <Trash color={nativeColors.danger} size={19} />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              )
            })}
          </View>
        ))
      )}
      {branchedStoryIds.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>Карты развилок</SectionLabel>
          {branchedStoryIds.map(storyId => {
            const story = contentCatalog.stories.find(
              item => item.storyId === storyId,
            )
            if (!story) return null
            const count = runs.filter(run => run.storyId === storyId).length
            return (
              <Button
                key={storyId}
                label={`${story.title} · ${count} путей`}
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
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    header: { gap: spacing[2], paddingTop: spacing[4] },
    section: { gap: spacing[3] },
    item: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.divider,
    },
    itemMain: {
      flexDirection: 'row',
      gap: spacing[3],
      alignItems: 'center',
      paddingTop: spacing[4],
    },
    pressed: { opacity: 0.7 },
    icon: {
      width: touchTarget.minimum,
      height: touchTarget.minimum,
      justifyContent: 'center',
      alignItems: 'center',
    },
    copy: { flex: 1, gap: spacing[2] },
    meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    itemActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingBottom: spacing[2],
    },
    action: {
      width: touchTarget.minimum,
      height: touchTarget.minimum,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editor: { gap: spacing[3], paddingVertical: spacing[4] },
    input: {
      minHeight: 48,
      color: nativeColors.textPrimary,
      backgroundColor: nativeColors.input,
      borderWidth: 1,
      borderColor: nativeColors.focus,
      paddingHorizontal: spacing[3],
      fontFamily: typography.body,
      fontSize: 16,
    },
    editorActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing[2],
    },
  })
