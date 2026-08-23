import { radius, spacing, touchTarget } from '@chartalk/design-system'
import type { Story } from '@chartalk/content-schema'
import { Check, X } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { CatalogSort, DurationFilter } from '@/catalog-query'
import {
  availabilityFilterOptions,
  type CatalogFilterOption,
  durationFilterOptions,
  ratingFilterOptions,
  sortFilterOptions,
  statusFilterOptions,
} from '@/catalog-filter-options'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { Button, SectionLabel, Text } from '@/ui/primitives'

interface CatalogFilterSheetProps {
  visible: boolean
  genres: readonly string[]
  tones: readonly string[]
  genre: string | null
  tone: string | null
  duration: DurationFilter
  status: Story['status'] | null
  rating: Story['rating'] | null
  downloadedOnly: boolean
  sort: CatalogSort
  onGenreChange(value: string | null): void
  onToneChange(value: string | null): void
  onDurationChange(value: DurationFilter): void
  onStatusChange(value: Story['status'] | null): void
  onRatingChange(value: Story['rating'] | null): void
  onDownloadedOnlyChange(value: boolean): void
  onSortChange(value: CatalogSort): void
  onReset(): void
  onClose(): void
}

interface ChoiceGroupProps<T> {
  label: string
  options: ReadonlyArray<CatalogFilterOption<T>>
  value: T
  onChange(value: T): void
  styles: ReturnType<typeof createStyles>
  colors: ThemeColorAliases
}

function ChoiceGroup<T>({
  label,
  options,
  value,
  onChange,
  styles,
  colors,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.group}>
      <SectionLabel>{label}</SectionLabel>
      <View style={styles.choices} accessibilityRole="radiogroup">
        {options.map(option => {
          const selected = Object.is(option.value, value)
          return (
            <Pressable
              key={`${String(option.value)}-${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text variant="label">{option.label}</Text>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? (
                  <Check color={colors.inverse} size={15} weight="bold" />
                ) : null}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function CatalogFilterSheet({
  visible,
  genres,
  tones,
  genre,
  tone,
  duration,
  status,
  rating,
  downloadedOnly,
  sort,
  onGenreChange,
  onToneChange,
  onDurationChange,
  onStatusChange,
  onRatingChange,
  onDownloadedOnlyChange,
  onSortChange,
  onReset,
  onClose,
}: CatalogFilterSheetProps) {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const genreOptions = useMemo(
    () => [
      { value: null, label: 'Все жанры' },
      ...genres.map(value => ({ value, label: value })),
    ],
    [genres],
  )
  const toneOptions = useMemo(
    () => [
      { value: null, label: 'Любой тон' },
      ...tones.map(value => ({ value, label: value })),
    ],
    [tones],
  )

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Закрыть фильтры"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <SectionLabel>Каталог</SectionLabel>
              <Text variant="heading">Фильтры</Text>
            </View>
            <Pressable
              accessibilityLabel="Закрыть фильтры"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <X color={colors.textPrimary} size={24} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ChoiceGroup
              label="Жанр"
              options={genreOptions}
              value={genre}
              onChange={onGenreChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Тон"
              options={toneOptions}
              value={tone}
              onChange={onToneChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Длительность"
              options={durationFilterOptions}
              value={duration}
              onChange={onDurationChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Статус"
              options={statusFilterOptions}
              value={status}
              onChange={onStatusChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Возрастной рейтинг"
              options={ratingFilterOptions}
              value={rating}
              onChange={onRatingChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Доступность"
              options={availabilityFilterOptions}
              value={downloadedOnly}
              onChange={onDownloadedOnlyChange}
              styles={styles}
              colors={colors}
            />
            <ChoiceGroup
              label="Сначала"
              options={sortFilterOptions}
              value={sort}
              onChange={onSortChange}
              styles={styles}
              colors={colors}
            />
          </ScrollView>

          <View
            style={[
              styles.sheetActions,
              { paddingBottom: Math.max(insets.bottom, spacing[4]) },
            ]}
          >
            <View style={styles.action}>
              <Button label="Сбросить" variant="quiet" onPress={onReset} />
            </View>
            <View style={styles.action}>
              <Button label="Готово" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ThemeColorAliases) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(17, 17, 24, 0.56)',
    },
    sheet: {
      height: '88%',
      overflow: 'hidden',
      backgroundColor: colors.raised,
      borderTopLeftRadius: radius.large,
      borderTopRightRadius: radius.large,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      elevation: 24,
    },
    grabber: {
      width: 44,
      height: 4,
      alignSelf: 'center',
      marginTop: spacing[2],
      borderRadius: radius.pill,
      backgroundColor: colors.divider,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[4],
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
    },
    sheetHeaderCopy: {
      flex: 1,
      gap: spacing[1],
    },
    closeButton: {
      width: touchTarget.comfortable,
      height: touchTarget.comfortable,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      backgroundColor: colors.interactive,
    },
    sheetContent: {
      gap: spacing[6],
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[5],
    },
    group: {
      gap: spacing[2],
    },
    choices: {
      gap: spacing[2],
    },
    choice: {
      minHeight: touchTarget.minimum,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.medium,
      backgroundColor: colors.interactive,
    },
    choiceSelected: {
      borderColor: colors.focus,
      backgroundColor: colors.panel,
    },
    radio: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
    },
    radioSelected: {
      borderColor: colors.emberSoft,
      backgroundColor: colors.emberSoft,
    },
    sheetActions: {
      flexDirection: 'row',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.raised,
    },
    action: {
      flex: 1,
    },
    pressed: {
      opacity: 0.72,
    },
  })
