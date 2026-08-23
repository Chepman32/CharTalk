import { radius, spacing, typography } from '@chartalk/design-system'
import type { GrammarProfile } from '@chartalk/app-core'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, Check } from 'phosphor-react-native'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { portraitSource } from '@/content'
import { requestNotificationPermission } from '@/notifications/notification-gateway'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import {
  Button,
  InlineError,
  Screen,
  SectionLabel,
  Text,
} from '@/ui/primitives'

const steps = ['Вход', 'Ритм', 'Имя', 'Персонаж'] as const

const grammarProfiles: {
  value: GrammarProfile
  label: string
  preview: string
}[] = [
  {
    value: 'neutralPhrasing',
    label: 'Нейтрально',
    preview: '«Ваш ответ принят»',
  },
  {
    value: 'masculine',
    label: 'Мужская форма',
    preview: '«Вы ответили первым»',
  },
  {
    value: 'feminine',
    label: 'Женская форма',
    preview: '«Вы ответили первой»',
  },
]

export default function OnboardingScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const router = useRouter()
  const {
    completeOnboarding,
    updateSettings,
    contentCatalog,
    error,
    clearError,
  } = useApp()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [grammarProfile, setGrammarProfile] =
    useState<GrammarProfile>('neutralPhrasing')
  const [selectedCharacterId, setSelectedCharacterId] = useState('char.ira')
  const [saving, setSaving] = useState(false)
  const activeCharacter = useMemo(
    () =>
      contentCatalog.characters.find(
        item => item.characterId === selectedCharacterId,
      ),
    [contentCatalog.characters, selectedCharacterId],
  )

  const finish = async (shouldRequestNotifications: boolean) => {
    setSaving(true)
    try {
      await completeOnboarding({
        displayName,
        selectedCharacterId,
        grammarProfile,
      })
      if (shouldRequestNotifications) {
        try {
          const permission = await requestNotificationPermission()
          await updateSettings({ notifications: permission.granted })
        } catch {
          // Notification setup is optional and must not block onboarding.
        }
      }
      router.replace('/(tabs)/stories')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen testID="onboarding-screen" contentStyle={styles.content}>
      <View
        style={styles.progress}
        accessibilityLabel={`Шаг ${step + 1} из ${steps.length}`}
      >
        {steps.map((label, index) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressLine,
                index <= step && styles.progressLineActive,
              ]}
            />
            <Text
              variant="mono"
              color={
                index === step ? nativeColors.emberSoft : nativeColors.textMuted
              }
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {error ? <InlineError message={error} onDismiss={clearError} /> : null}

      {step === 0 ? (
        <View style={styles.hero}>
          <SectionLabel>Интерактивные истории · 16+</SectionLabel>
          <Text variant="display">Ваши слова меняют то, что будет дальше.</Text>
          <Text color={nativeColors.textSecondary} style={styles.copy}>
            Четыре варианта ответа. Никаких случайных реплик. История работает
            без сети и сохраняет каждый выбор на устройстве.
          </Text>
          <View style={styles.fictionDisclosure}>
            <Text variant="label">Это вымышленная авторская история.</Text>
            <Text variant="caption" color={nativeColors.textSecondary}>
              Персонажи и сообщения заранее написаны авторами CharTalk. Перед
              вами не живой человек и не ИИ-чат.
            </Text>
          </View>
          <View style={styles.promiseRow}>
            <View style={styles.promiseNumber}>
              <Text variant="mono">01</Text>
            </View>
            <Text style={styles.promiseText}>
              Выбирайте интонацию, а не угадывайте «правильный» ответ.
            </Text>
          </View>
          <View style={styles.promiseRow}>
            <View style={styles.promiseNumber}>
              <Text variant="mono">02</Text>
            </View>
            <Text style={styles.promiseText}>
              Отмените выбор в течение трёх секунд.
            </Text>
          </View>
          <View style={styles.promiseRow}>
            <View style={styles.promiseNumber}>
              <Text variant="mono">03</Text>
            </View>
            <Text style={styles.promiseText}>
              Пропускайте чувствительные сцены без штрафа.
            </Text>
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.hero}>
          <SectionLabel>Как это устроено</SectionLabel>
          <Text variant="title">Короткий ритм, долгие последствия.</Text>
          <View style={styles.demoMessage}>
            <Text variant="caption" color={nativeColors.emberSoft}>
              Ира · сейчас
            </Text>
            <Text>«Ты ведь понимаешь, почему я позвала именно тебя?»</Text>
          </View>
          {[
            'Скажи прямо.',
            'Похоже, ты уже решила.',
            'Я сначала выслушаю.',
            'Мы можем просто уйти.',
          ].map((label, index) => (
            <View
              key={label}
              style={[
                styles.demoChoice,
                index === 2 && styles.demoChoiceActive,
              ]}
            >
              <Text
                variant="mono"
                color={
                  index === 2 ? nativeColors.inverse : nativeColors.textMuted
                }
              >
                {index + 1}
              </Text>
              <Text
                color={
                  index === 2 ? nativeColors.inverse : nativeColors.textPrimary
                }
              >
                {label}
              </Text>
            </View>
          ))}
          <Text variant="caption" color={nativeColors.textMuted}>
            Числа отношений скрыты. Вы увидите последствия в поступках и
            формулировках персонажей.
          </Text>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.hero}>
          <SectionLabel>Обращение</SectionLabel>
          <Text variant="title">Как к вам обращаться?</Text>
          <Text color={nativeColors.textSecondary}>
            Имя хранится только на этом устройстве. Можно оставить поле пустым —
            используем «Читатель».
          </Text>
          <TextInput
            accessibilityLabel="Ваше имя"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            onChangeText={setDisplayName}
            placeholder="Например, Саша"
            placeholderTextColor={nativeColors.textMuted}
            selectionColor={nativeColors.emberSoft}
            style={styles.input}
            value={displayName}
          />
          <Text variant="caption" color={nativeColors.textMuted}>
            {displayName.length}/40
          </Text>
          <View>
            <Text variant="heading">Грамматическая форма</Text>
            <Text variant="caption" color={nativeColors.textMuted}>
              Это настройка формулировок, не обязательный выбор пола. Старые
              реплики при дальнейшем изменении не переписываются.
            </Text>
          </View>
          <View style={styles.grammarChoices} accessibilityRole="radiogroup">
            {grammarProfiles.map(profile => {
              const selected = grammarProfile === profile.value
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={profile.value}
                  onPress={() => setGrammarProfile(profile.value)}
                  style={[
                    styles.grammarChoice,
                    selected && styles.grammarChoiceSelected,
                  ]}
                >
                  <View style={styles.grammarCopy}>
                    <Text variant="label">{profile.label}</Text>
                    <Text variant="caption" color={nativeColors.textSecondary}>
                      {profile.preview}
                    </Text>
                  </View>
                  {selected ? (
                    <Check
                      color={nativeColors.emberSoft}
                      size={20}
                      weight="bold"
                    />
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.hero}>
          <SectionLabel>Первая история</SectionLabel>
          <Text variant="title">С кем начнём?</Text>
          <View style={styles.characters}>
            {contentCatalog.characters.slice(0, 5).map(character => {
              const selected = character.characterId === selectedCharacterId
              return (
                <Pressable
                  accessibilityLabel={`${character.name}. ${character.hook}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={character.characterId}
                  onPress={() => setSelectedCharacterId(character.characterId)}
                  style={[
                    styles.character,
                    selected && styles.characterSelected,
                  ]}
                >
                  <Image
                    accessible={false}
                    source={portraitSource(character.portraitAssetId)}
                    style={styles.characterImage}
                    contentFit="cover"
                  />
                  <View style={styles.characterCopy}>
                    <View style={styles.characterTitleRow}>
                      <Text variant="heading">{character.name}</Text>
                      {selected ? (
                        <Check
                          color={nativeColors.emberSoft}
                          size={22}
                          weight="bold"
                        />
                      ) : null}
                    </View>
                    <Text variant="caption" color={nativeColors.textSecondary}>
                      {character.hook}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
          {activeCharacter ? (
            <Text variant="caption" color={nativeColors.textMuted}>
              Выбор определит лишь первую рекомендацию. Все истории останутся
              доступны.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <Button
            label="Назад"
            icon={ArrowLeft}
            variant="quiet"
            onPress={() => setStep(value => value - 1)}
          />
        ) : (
          <Button
            label="Начать сразу"
            variant="quiet"
            accessibilityHint="Сохранить настройки по умолчанию и открыть каталог"
            loading={saving}
            onPress={() => void finish(false)}
          />
        )}
        {step < steps.length - 1 ? (
          <Button
            label="Продолжить"
            icon={ArrowRight}
            onPress={() => setStep(value => value + 1)}
          />
        ) : (
          <Button
            label="Открыть истории"
            icon={ArrowRight}
            loading={saving}
            onPress={() => void finish(true)}
            testID="finish-onboarding"
          />
        )}
      </View>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    content: { justifyContent: 'space-between', minHeight: 680 },
    progress: { flexDirection: 'row', gap: spacing[2], paddingTop: spacing[2] },
    progressItem: { flex: 1, gap: spacing[2] },
    progressLine: { height: 2, backgroundColor: nativeColors.interactive },
    progressLineActive: { backgroundColor: nativeColors.emberSoft },
    hero: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing[5],
      paddingVertical: spacing[8],
    },
    copy: { maxWidth: 590, fontSize: 18, lineHeight: 29 },
    fictionDisclosure: {
      maxWidth: 590,
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
    promiseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      maxWidth: 560,
    },
    promiseNumber: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: nativeColors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promiseText: { flex: 1 },
    demoMessage: {
      maxWidth: 520,
      alignSelf: 'flex-start',
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ember,
      padding: spacing[5],
      gap: spacing[2],
    },
    demoChoice: {
      minHeight: 48,
      borderBottomWidth: 1,
      borderColor: nativeColors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[4],
      paddingHorizontal: spacing[4],
    },
    demoChoiceActive: {
      backgroundColor: nativeColors.emberSoft,
      borderBottomColor: nativeColors.emberSoft,
    },
    input: {
      color: nativeColors.textPrimary,
      fontFamily: typography.display,
      fontSize: 28,
      lineHeight: 38,
      borderBottomWidth: 1,
      borderBottomColor: nativeColors.emberSoft,
      paddingVertical: spacing[3],
    },
    grammarChoices: { gap: spacing[2] },
    grammarChoice: {
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
    grammarChoiceSelected: {
      borderColor: nativeColors.emberSoft,
      backgroundColor: nativeColors.panel,
    },
    grammarCopy: { flex: 1, gap: spacing[1] },
    characters: { gap: spacing[3] },
    character: {
      flexDirection: 'row',
      minHeight: 116,
      borderWidth: 1,
      borderColor: nativeColors.border,
      borderRadius: radius.medium,
      overflow: 'hidden',
      backgroundColor: nativeColors.raised,
    },
    characterSelected: {
      borderColor: nativeColors.emberSoft,
      backgroundColor: nativeColors.panel,
    },
    characterImage: { width: 104, minHeight: 116 },
    characterCopy: {
      flex: 1,
      padding: spacing[4],
      gap: spacing[2],
      justifyContent: 'center',
    },
    characterTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[3],
    },
  })
