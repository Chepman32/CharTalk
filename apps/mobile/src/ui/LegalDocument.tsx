import { spacing } from '@chartalk/design-system'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { Screen, SectionLabel, Text } from './primitives'
import { useTheme } from '@/theme/ThemeProvider'

export interface LegalSection {
  title: string
  paragraphs: readonly string[]
}

export function LegalDocument({
  eyebrow,
  title,
  effectiveDate,
  introduction,
  sections,
}: {
  eyebrow: string
  title: string
  effectiveDate: string
  introduction: string
  sections: readonly LegalSection[]
}) {
  const { theme } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: { gap: spacing[3], paddingVertical: spacing[5] },
        section: {
          gap: spacing[3],
          paddingTop: spacing[4],
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.divider,
        },
      }),
    [theme],
  )
  return (
    <Screen>
      <View style={styles.hero}>
        <SectionLabel>{eyebrow}</SectionLabel>
        <Text variant="title">{title}</Text>
        <Text variant="mono" color={theme.colors.textMuted}>
          Действует с {effectiveDate}
        </Text>
        <Text color={theme.colors.textSecondary}>{introduction}</Text>
      </View>
      {sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text variant="heading">{section.title}</Text>
          {section.paragraphs.map(paragraph => (
            <Text key={paragraph} color={theme.colors.textSecondary}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  )
}
