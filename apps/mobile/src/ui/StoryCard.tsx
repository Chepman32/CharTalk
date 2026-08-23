import type { Character, Story } from '@chartalk/content-schema'
import { radius, spacing } from '@chartalk/design-system'
import { Image } from 'expo-image'
import { ArrowRight } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { assetSource } from '@/content'
import { formatMinuteCount } from '@/format'
import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { Pill, Text } from '@/ui/primitives'

export function StoryCard({
  story,
  character: providedCharacter,
  onPress,
}: {
  story: Story
  character?: Character
  onPress(): void
}) {
  const { contentCatalog } = useApp()
  const { theme } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          minHeight: 390,
          borderRadius: radius.large,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
        pressed: {
          opacity: theme.opacity.pressed,
          transform: [{ scale: 0.992 }],
        },
        image: { position: 'absolute', inset: 0 },
        scrim: {
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(17,17,24,0.42)',
          borderTopColor: 'rgba(17,17,24,0)',
          borderTopWidth: 190,
        },
        copy: {
          flex: 1,
          justifyContent: 'flex-end',
          padding: spacing[5],
          gap: spacing[3],
        },
        meta: { flexDirection: 'row', gap: spacing[2] },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[4],
        },
        titleCopy: { flex: 1, gap: spacing[1] },
        tags: { minHeight: 18 },
      }),
    [theme],
  )
  const character =
    providedCharacter ??
    contentCatalog.characters.find(
      item => item.characterId === story.characterId,
    )
  if (!character) return null
  const tags = [...character.genres, ...character.dynamics].slice(0, 3)
  const tagLabel = tags.length ? ` ${tags.join(', ')}.` : ''
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${story.title}. ${character.name}.${tagLabel} ${formatMinuteCount(story.durationMinutes)}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        accessible={false}
        source={assetSource(story.previewAssetId ?? character.portraitAssetId)}
        style={styles.image}
        contentFit="cover"
        transition={180}
      />
      <View style={styles.scrim} />
      <View style={styles.copy}>
        <View style={styles.meta}>
          <Pill tone="accent">{story.rating}</Pill>
          <Pill tone="media">{story.durationMinutes} мин</Pill>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text variant="caption" color={theme.colors.mediaTextMuted}>
              {character.name}
            </Text>
            <Text variant="heading" color={theme.colors.mediaText}>
              {story.title}
            </Text>
          </View>
          <ArrowRight color={theme.colors.mediaText} size={24} weight="bold" />
        </View>
        {tags.length ? (
          <Text
            variant="caption"
            color={theme.colors.mediaTextMuted}
            numberOfLines={1}
            style={styles.tags}
          >
            {tags.join(' · ')}
          </Text>
        ) : null}
        <Text
          variant="caption"
          color={theme.colors.mediaTextMuted}
          numberOfLines={2}
        >
          {story.premise}
        </Text>
      </View>
    </Pressable>
  )
}
