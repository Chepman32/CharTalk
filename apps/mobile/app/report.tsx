import type { ContentReport, ReportCategory } from '@chartalk/app-core'
import {
  radius,
  spacing,
  touchTarget,
  typography,
} from '@chartalk/design-system'
import Constants from 'expo-constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Check, CheckCircle, PaperPlaneTilt } from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import {
  Button,
  InlineError,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

const categories: { value: ReportCategory; label: string }[] = [
  { value: 'typo', label: 'Опечатка' },
  { value: 'continuity', label: 'Логика истории' },
  { value: 'intent', label: 'Ответ передал не тот смысл' },
  { value: 'warning', label: 'Не хватает предупреждения' },
  { value: 'safety', label: 'Чувствительный контент' },
  { value: 'technical', label: 'Техническая ошибка' },
  { value: 'other', label: 'Другое' },
]

export default function ReportScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { runId, nodeId, diagnosticCode } = useLocalSearchParams<{
    runId?: string
    nodeId?: string
    diagnosticCode?: string
  }>()
  const router = useRouter()
  const { contentCatalog, snapshot, submitContentReport, error, clearError } =
    useApp()
  const [category, setCategory] = useState<ReportCategory>('typo')
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  const [savedReport, setSavedReport] = useState<ContentReport | null>(null)
  const [saving, setSaving] = useState(false)
  const run = snapshot?.runs.find(item => item.runId === runId)
  const lastChoiceId = run?.events.at(-1)?.choiceId ?? null
  const contentBuildId = run?.contentBuildId ?? contentCatalog.manifest.buildId
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const platform =
    Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
      ? Platform.OS
      : 'unknown'

  const submit = async () => {
    setSaving(true)
    try {
      const report = await submitContentReport({
        runId: runId ?? null,
        nodeId: nodeId ?? null,
        choiceId: lastChoiceId,
        contentBuildId,
        appVersion,
        platform,
        diagnosticCode: diagnosticCode ?? null,
        category,
        note: note || null,
        uploadConsent: true,
      })
      setSavedReport(report)
    } finally {
      setSaving(false)
    }
  }

  if (savedReport) {
    return (
      <Screen contentStyle={styles.success}>
        <CheckCircle color={nativeColors.moss} size={52} weight="fill" />
        <Text variant="title">
          {savedReport.status === 'sent'
            ? 'Отчёт отправлен.'
            : 'Отчёт сохранён в очереди.'}
        </Text>
        <Text color={nativeColors.textSecondary}>
          {savedReport.status === 'sent'
            ? 'Спасибо. Текст переписки в отчёт не добавлен.'
            : 'Он отправится при следующем соединении. Это не зависит от настройки аналитики; согласие относится только к этому отчёту.'}
        </Text>
        <Text variant="mono" color={nativeColors.textMuted}>
          ID {savedReport.reportId}
        </Text>
        <Button label="Вернуться" onPress={() => router.back()} />
      </Screen>
    )
  }

  return (
    <Screen>
      <SectionLabel>Без текста переписки</SectionLabel>
      <Text variant="title">Что пошло не так?</Text>
      <Text color={nativeColors.textSecondary}>
        Мы сохраним только категорию, ваш комментарий и технический ID сцены.
        Это помогает исправить контент без чтения личной истории прохождения.
      </Text>
      {error ? <InlineError message={error} onDismiss={clearError} /> : null}
      <View style={styles.categories} accessibilityRole="radiogroup">
        {categories.map(item => {
          const selected = item.value === category
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[styles.category, selected && styles.categorySelected]}
            >
              <Text
                color={
                  selected ? nativeColors.inverse : nativeColors.textPrimary
                }
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <TextInput
        accessibilityLabel="Комментарий к отчёту"
        maxLength={500}
        multiline
        onChangeText={setNote}
        placeholder="Необязательно. Не добавляйте личные данные."
        placeholderTextColor={nativeColors.textMuted}
        selectionColor={nativeColors.emberSoft}
        style={styles.input}
        textAlignVertical="top"
        value={note}
      />
      <Text variant="caption" color={nativeColors.textMuted}>
        {note.length}/500 · хранится локально до отправки
      </Text>
      <View style={styles.metadata}>
        <Text variant="label">Будут отправлены</Text>
        <Text variant="caption" color={nativeColors.textSecondary}>
          Категория и комментарий; ID истории, сцены и последнего выбора при
          наличии; версия контента {contentBuildId}; версия приложения{' '}
          {appVersion}; платформа {platform}.
        </Text>
        <Text variant="caption" color={nativeColors.textMuted}>
          Имя, полный путь, состояние истории и текст переписки не отправляются.
        </Text>
      </View>
      <Pressable
        aria-checked={consent}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent(value => !value)}
        style={({ pressed }) => [styles.consent, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
          {consent ? (
            <Check color={nativeColors.inverse} size={15} weight="bold" />
          ) : null}
        </View>
        <Text style={styles.consentText}>
          Разрешаю отправить перечисленные данные для этого отчёта.
        </Text>
      </Pressable>
      <Button
        label="Отправить отчёт"
        icon={PaperPlaneTilt}
        disabled={!consent}
        loading={saving}
        onPress={() => void submit()}
      />
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    success: {
      justifyContent: 'center',
      minHeight: 560,
      alignItems: 'flex-start',
    },
    categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    category: {
      minHeight: touchTarget.minimum,
      justifyContent: 'center',
      paddingHorizontal: spacing[4],
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: nativeColors.border,
    },
    categorySelected: {
      backgroundColor: nativeColors.emberSoft,
      borderColor: nativeColors.emberSoft,
    },
    input: {
      minHeight: 150,
      borderWidth: 1,
      borderColor: nativeColors.inputBorder,
      borderRadius: radius.medium,
      padding: spacing[4],
      fontFamily: typography.body,
      fontSize: 16,
      lineHeight: 24,
      color: nativeColors.textPrimary,
      backgroundColor: nativeColors.raised,
    },
    metadata: {
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    consent: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[3],
      paddingVertical: spacing[2],
    },
    checkbox: {
      width: 23,
      height: 23,
      borderWidth: 1,
      borderColor: nativeColors.inputBorder,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: nativeColors.emberSoft,
      borderColor: nativeColors.emberSoft,
    },
    consentText: { flex: 1 },
    pressed: { opacity: 0.7 },
  })
