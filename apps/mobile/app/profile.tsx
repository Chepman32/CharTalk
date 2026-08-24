import type { GrammarProfile } from '@razvilka/app-core'
import { radius, spacing, typography } from '@razvilka/design-system'
import { useRouter } from 'expo-router'
import { Check } from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { Button, Screen, SectionLabel, Text } from '@/ui/primitives'

const profiles: { value: GrammarProfile; label: string; preview: string }[] = [
  {
    value: 'neutralPhrasing',
    label: 'Нейтрально',
    preview: 'Ответ принят',
  },
  { value: 'masculine', label: 'Мужская форма', preview: 'Вы были первым' },
  { value: 'feminine', label: 'Женская форма', preview: 'Вы были первой' },
]

export default function ProfileScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const router = useRouter()
  const { snapshot, updateProfile } = useApp()
  const profile = snapshot?.profile
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [grammarProfile, setGrammarProfile] = useState<GrammarProfile>(
    profile?.grammarProfile ?? 'neutralPhrasing',
  )
  const [saving, setSaving] = useState(false)

  if (!profile) return null

  const save = async () => {
    setSaving(true)
    try {
      await updateProfile({ displayName, grammarProfile })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <SectionLabel>Локальный профиль</SectionLabel>
      <Text variant="title">Имя и обращение</Text>
      <Text color={nativeColors.textSecondary}>
        Настройки применяются только к будущим репликам. Уже прочитанный текст
        остаётся частью замороженного прохождения.
      </Text>
      <TextInput
        accessibilityLabel="Ваше имя"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={40}
        onChangeText={setDisplayName}
        placeholder="Читатель"
        placeholderTextColor={nativeColors.textMuted}
        selectionColor={nativeColors.emberSoft}
        style={styles.input}
        value={displayName}
      />
      <View>
        <Text variant="heading">Грамматическая форма</Text>
        <Text variant="caption" color={nativeColors.textMuted}>
          Это выбор формы фраз, а не вопрос о поле или идентичности.
        </Text>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup">
        {profiles.map(item => {
          const selected = grammarProfile === item.value
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={item.value}
              onPress={() => setGrammarProfile(item.value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.optionCopy}>
                <Text variant="label">{item.label}</Text>
                <Text variant="caption" color={nativeColors.textSecondary}>
                  Пример: «{item.preview}»
                </Text>
              </View>
              {selected ? (
                <Check color={nativeColors.emberSoft} size={20} weight="bold" />
              ) : null}
            </Pressable>
          )
        })}
      </View>
      <Button label="Сохранить" loading={saving} onPress={() => void save()} />
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    input: {
      color: nativeColors.textPrimary,
      fontFamily: typography.display,
      fontSize: 28,
      lineHeight: 38,
      borderBottomWidth: 1,
      borderBottomColor: nativeColors.emberSoft,
      paddingVertical: spacing[3],
    },
    options: { gap: spacing[2] },
    option: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderWidth: 1,
      borderColor: nativeColors.border,
      borderRadius: radius.medium,
    },
    optionSelected: {
      borderColor: nativeColors.emberSoft,
      backgroundColor: nativeColors.panel,
    },
    optionCopy: { flex: 1, gap: spacing[1] },
  })
