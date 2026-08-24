import type { ContentWarning } from '@razvilka/content-schema'
import { spacing } from '@razvilka/design-system'
import {
  EyeSlash,
  ShieldCheck,
  Signpost,
  WarningCircle,
} from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { SettingsRow } from '@/ui/SettingsRow'
import { Pill, Screen, SectionLabel, Text } from '@/ui/primitives'

const categoryLabels: Record<ContentWarning['category'], string> = {
  profanity: 'грубая лексика',
  'sexual-themes': 'сексуальные темы',
  frightening: 'тревожные или пугающие сцены',
  violence: 'насилие',
  'psychological-pressure': 'психологическое давление',
  addiction: 'зависимости',
  loss: 'утрата',
  'self-harm': 'самоповреждение',
  'abuse-or-stalking': 'абьюз или преследование',
  discrimination: 'дискриминационная речь',
}

const categories = Object.keys(categoryLabels) as ContentWarning['category'][]

export default function ContentControlsScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { contentCatalog, snapshot, updateSettings } = useApp()
  const settings = snapshot?.settings
  if (!settings) return null
  return (
    <Screen>
      <SectionLabel>Вы управляете границами</SectionLabel>
      <Text variant="title">Контент и безопасные маршруты</Text>
      <Text color={nativeColors.textSecondary}>
        Предупреждения появляются до сцены и не раскрывают исход. Если для
        эпизода есть безопасный маршрут, его можно выбрать без штрафа и потери
        доступа к финалу.
      </Text>
      <View style={styles.control}>
        <SettingsRow
          icon={WarningCircle}
          label="Показывать предупреждения"
          detail="Рекомендуется для первого прохождения"
          value={settings.showContentWarnings}
          onValueChange={value =>
            void updateSettings({ showContentWarnings: value })
          }
        />
      </View>
      <SectionLabel>Скрывать новые истории по темам</SectionLabel>
      <Text variant="caption" color={nativeColors.textMuted}>
        Фильтр действует на каталог. Уже начатые прохождения остаются доступны,
        чтобы прогресс не исчезал молча.
      </Text>
      <View style={styles.control}>
        {categories.map(category => {
          const hidden = settings.hiddenContentCategories.includes(category)
          return (
            <SettingsRow
              icon={EyeSlash}
              key={category}
              label={categoryLabels[category]}
              detail={hidden ? 'Скрывается в каталоге' : 'Разрешено в каталоге'}
              value={hidden}
              onValueChange={value =>
                void updateSettings({
                  hiddenContentCategories: value
                    ? [...settings.hiddenContentCategories, category]
                    : settings.hiddenContentCategories.filter(
                        item => item !== category,
                      ),
                })
              }
            />
          )
        })}
      </View>
      <View style={styles.explainer}>
        <ShieldCheck color={nativeColors.ochre} size={30} weight="fill" />
        <View style={styles.explainerCopy}>
          <Text variant="heading">Что делает безопасный маршрут</Text>
          <Text color={nativeColors.textSecondary}>
            Заменяет отмеченную сцену кратким нейтральным пересказом и переводит
            историю к заранее проверенному узлу. Состояние сюжета обновляется
            явно, а не случайно.
          </Text>
        </View>
      </View>
      <SectionLabel>Предупреждения в текущем пакете</SectionLabel>
      {contentCatalog.warnings.length ? (
        contentCatalog.warnings.map(warning => (
          <View key={warning.warningId} style={styles.warning}>
            <Signpost color={nativeColors.textSecondary} size={22} />
            <View style={styles.warningCopy}>
              <View style={styles.warningMeta}>
                <Pill>
                  {categoryLabels[warning.category] ?? warning.category}
                </Pill>
                <Pill tone="accent">маршрут доступен</Pill>
              </View>
              <Text variant="label">{warning.summary}</Text>
              <Text variant="caption" color={nativeColors.textMuted}>
                {warning.detail}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text color={nativeColors.textMuted}>
          В текущем пакете нет отмеченных сцен.
        </Text>
      )}
      <Text variant="caption" color={nativeColors.textMuted}>
        Пропуск чувствительной сцены не передаётся другим пользователям и
        хранится только в локальном прохождении.
      </Text>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    control: { marginTop: spacing[2] },
    explainer: {
      flexDirection: 'row',
      gap: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
      padding: spacing[5],
    },
    explainerCopy: { flex: 1, gap: spacing[2] },
    warning: {
      flexDirection: 'row',
      gap: spacing[3],
      paddingVertical: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: nativeColors.border,
    },
    warningCopy: { flex: 1, gap: spacing[2] },
    warningMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  })
