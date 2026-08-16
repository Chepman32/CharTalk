import { spacing } from '@chartalk/design-system'
import {
  CheckCircle,
  HardDrives,
  ShieldCheck,
  Trash,
} from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { sampleContentPackage } from '@/content'
import {
  contentBuildKey,
  missingContentBuildsForRestore,
} from '@/content-recovery'
import { contentUpdateConfigured } from '@/content-update-config'
import { formatBytes } from '@/format'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import {
  Button,
  Divider,
  InlineError,
  Pill,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

export default function DownloadsScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const {
    installedPackages,
    snapshot,
    installContentUpdate,
    removeContentBuild,
  } = useApp()
  const [working, setWorking] = useState(false)
  const [restoringBuildId, setRestoringBuildId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const totalBytes = installedPackages.reduce(
    (sum, item) => sum + item.byteCount,
    0,
  )
  const updatesConfigured = contentUpdateConfigured(
    process.env.EXPO_PUBLIC_CHARTALK_API_URL,
    process.env.EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEY,
    process.env.EXPO_PUBLIC_CHARTALK_CONTENT_PUBLIC_KEYS,
  )
  const protectedBuildKeys = new Set(
    snapshot?.runs.map(run =>
      run.packId
        ? contentBuildKey(run.packId, run.contentBuildId)
        : contentBuildKey('*', run.contentBuildId),
    ) ?? [],
  )
  const installedBuildKeys = new Set(
    installedPackages.map(item => contentBuildKey(item.packId, item.buildId)),
  )
  const missingRunBuilds = missingContentBuildsForRestore(
    snapshot?.runs ?? [],
    installedBuildKeys,
  )

  const checkForUpdate = async () => {
    setWorking(true)
    setLocalError(null)
    setMessage(null)
    try {
      const content = await installContentUpdate(
        sampleContentPackage.manifest.packId,
      )
      setMessage(
        `Проверена и активирована версия ${content.manifest.contentVersion}.`,
      )
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось установить обновление.',
      )
    } finally {
      setWorking(false)
    }
  }

  const restoreExactBuild = async (packId: string, buildId: string) => {
    setRestoringBuildId(buildId)
    setLocalError(null)
    setMessage(null)
    try {
      const content = await installContentUpdate(packId, buildId)
      setMessage(
        `Восстановлена точная версия ${content.manifest.contentVersion}.`,
      )
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось восстановить точную версию.',
      )
    } finally {
      setRestoringBuildId(null)
    }
  }

  return (
    <Screen>
      <SectionLabel>Офлайн прежде всего</SectionLabel>
      <Text variant="title">Обновления</Text>
      <Text color={nativeColors.textSecondary}>
        Базовый пакет встроен в приложение. Обновление активируется только для
        нового прохождения — текущая версия остаётся замороженной.
      </Text>
      <View style={styles.storage}>
        <HardDrives color={nativeColors.emberSoft} size={30} />
        <View style={styles.storageCopy}>
          <Text variant="heading">{formatBytes(totalBytes)}</Text>
          <Text variant="caption" color={nativeColors.textMuted}>
            встроенный контент · размер локальных пакетов
          </Text>
        </View>
        <Pill tone="accent">Готово</Pill>
      </View>
      <Button
        label="Проверить подписанное обновление"
        icon={ShieldCheck}
        disabled={!updatesConfigured}
        loading={working}
        onPress={() => void checkForUpdate()}
      />
      {!updatesConfigured ? (
        <Text variant="caption" color={nativeColors.textMuted}>
          В этой внутренней сборке endpoint и публичный ключ обновлений не
          заданы. Встроенный пакет продолжает работать офлайн.
        </Text>
      ) : null}
      {missingRunBuilds.length > 0 ? (
        <View style={styles.recovery}>
          <Text variant="heading">Точные версии прохождений</Text>
          <Text color={nativeColors.textSecondary}>
            Эти сборки нужны для продолжения сохранённого текста. CharTalk не
            подменит их текущей версией каталога.
          </Text>
          {missingRunBuilds.map(run => (
            <View key={run.buildId} style={styles.recoveryRow}>
              <View style={styles.recoveryCopy}>
                <Text variant="mono">{run.buildId}</Text>
                <Text variant="caption" color={nativeColors.textMuted}>
                  Пакет {run.packId}
                </Text>
              </View>
              <Button
                label="Восстановить"
                variant="quiet"
                loading={restoringBuildId === run.buildId}
                disabled={restoringBuildId !== null}
                onPress={() => void restoreExactBuild(run.packId, run.buildId)}
              />
            </View>
          ))}
        </View>
      ) : null}
      {message ? (
        <Text variant="caption" color={nativeColors.moss}>
          {message}
        </Text>
      ) : null}
      {localError ? (
        <InlineError
          message={localError}
          onDismiss={() => setLocalError(null)}
        />
      ) : null}
      <Divider />
      <SectionLabel>Установленные сборки</SectionLabel>
      {installedPackages.map(item => {
        const removable =
          item.status === 'rollback' &&
          !protectedBuildKeys.has(contentBuildKey(item.packId, item.buildId)) &&
          !protectedBuildKeys.has(contentBuildKey('*', item.buildId))
        return (
          <View key={`${item.packId}:${item.buildId}`} style={styles.item}>
            <CheckCircle color={nativeColors.moss} size={24} weight="fill" />
            <View style={styles.itemCopy}>
              <Text variant="label">Пакет русских историй</Text>
              <Text variant="caption" color={nativeColors.textMuted}>
                Версия {item.contentVersion} · {formatBytes(item.byteCount)} ·{' '}
                {item.status === 'bundled'
                  ? 'встроено'
                  : item.status === 'active'
                    ? 'активно'
                    : 'резерв отката'}
              </Text>
              <Text variant="mono" color={nativeColors.textMuted}>
                {item.buildId}
              </Text>
            </View>
            {removable ? (
              <Button
                label="Удалить резерв"
                icon={Trash}
                variant="quiet"
                onPress={() =>
                  void removeContentBuild(item.packId, item.buildId).catch(
                    cause =>
                      setLocalError(
                        cause instanceof Error
                          ? cause.message
                          : 'Не удалось удалить резерв.',
                      ),
                  )
                }
              />
            ) : null}
          </View>
        )
      })}
      <View style={styles.note}>
        <Text variant="heading">Если обновление прервётся</Text>
        <Text color={nativeColors.textSecondary}>
          CharTalk продолжит использовать последнюю проверенную версию. При
          следующей попытке загрузка продолжится с сохранённой точки.
        </Text>
        <Text variant="caption" color={nativeColors.textMuted}>
          Неполные файлы не открываются и не становятся активными. Учтено в
          реестре: {formatBytes(totalBytes)}. Версии активных прохождений
          защищены от удаления.
        </Text>
      </View>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    storage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingVertical: spacing[4],
    },
    storageCopy: { flex: 1 },
    item: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing[3],
      paddingVertical: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.border,
    },
    itemCopy: { flex: 1 },
    note: {
      marginTop: spacing[4],
      gap: spacing[2],
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.info,
      backgroundColor: nativeColors.panel,
      padding: spacing[5],
    },
    recovery: {
      gap: spacing[3],
      padding: spacing[5],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    recoveryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingTop: spacing[2],
    },
    recoveryCopy: { flex: 1, gap: spacing[1] },
  })
