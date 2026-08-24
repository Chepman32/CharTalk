import { radius, spacing } from '@razvilka/design-system'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { portraitSource } from '@/content'
import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { StoryCard } from '@/ui/StoryCard'
import { Pill, Screen, SectionLabel, Text } from '@/ui/primitives'

export default function CharacterScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { characterId } = useLocalSearchParams<{ characterId: string }>()
  const router = useRouter()
  const { contentCatalog, reportDiagnostic, snapshot } = useApp()
  const character = contentCatalog.characters.find(
    item => item.characterId === characterId,
  )
  const stories = contentCatalog.stories.filter(
    item => item.characterId === characterId,
  )
  useEffect(() => {
    if (!character || !snapshot?.settings.analytics) return
    void reportDiagnostic({
      eventName: 'character_viewed',
      contentBuildId: contentCatalog.manifest.buildId,
      occurredAt: new Date().toISOString(),
    })
  }, [
    character,
    characterId,
    contentCatalog.manifest.buildId,
    reportDiagnostic,
    snapshot?.settings.analytics,
  ])
  if (!character)
    return (
      <Screen>
        <Text variant="title">Персонаж не найден</Text>
      </Screen>
    )

  return (
    <Screen>
      <Image
        accessibilityLabel={character.name}
        source={portraitSource(character.portraitAssetId)}
        style={styles.portrait}
        contentFit="cover"
      />
      <SectionLabel>
        {character.ageLabel} · {character.genres.join(' · ')}
      </SectionLabel>
      <Text variant="display">{character.name}</Text>
      <Text color={nativeColors.textSecondary} style={styles.lead}>
        {character.description}
      </Text>
      <View style={styles.disclosure}>
        <Text variant="label">Вымышленный персонаж · авторский сценарий</Text>
        <Text variant="caption" color={nativeColors.textSecondary}>
          Все сообщения {character.name} заранее написаны редакцией «Развилки».
          Это не живой собеседник и не ИИ-чат.
        </Text>
      </View>
      <View style={styles.tags}>
        {character.dynamics.map(item => (
          <Pill key={item}>{item}</Pill>
        ))}
      </View>
      <SectionLabel>Истории</SectionLabel>
      {stories.map(story => (
        <StoryCard
          key={story.storyId}
          story={story}
          onPress={() =>
            router.push({
              pathname: '/story/[storyId]',
              params: { storyId: story.storyId },
            })
          }
        />
      ))}
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    portrait: { width: '100%', aspectRatio: 1, borderRadius: radius.large },
    lead: { fontSize: 18, lineHeight: 29 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    disclosure: {
      gap: spacing[2],
      padding: spacing[4],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.ochre,
    },
  })
