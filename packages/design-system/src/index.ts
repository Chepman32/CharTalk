export type ThemeName = 'light' | 'dark' | 'solar' | 'mono'
export type CharacterAccent = 'ember' | 'ochre' | 'rose' | 'plum' | 'moss'

export interface ThemeColors {
  background: string
  surface: string
  surfaceElevated: string
  surfaceMuted: string
  card: string
  cardAlt: string
  text: string
  textSecondary: string
  textMuted: string
  textInverse: string
  primary: string
  primaryHover: string
  primaryPressed: string
  primarySoft: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
  info: string
  border: string
  borderStrong: string
  divider: string
  inputBackground: string
  inputBorder: string
  inputText: string
  placeholder: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  buttonGhostText: string
  buttonDisabledBg: string
  buttonDisabledText: string
  tabActive: string
  tabInactive: string
  navBackground: string
  headerBackground: string
  modalBackdrop: string
  shadow: string
  scrim: string
  mediaScrim: string
  mediaText: string
  mediaTextMuted: string
  focusRing: string
  selection: string
}

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const

export const radius = {
  small: 8,
  medium: 14,
  large: 20,
  extraLarge: 28,
  pill: 999,
} as const

export const typography = {
  display: 'Lora_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  size: { xs: 11, sm: 13, md: 16, lg: 23, xl: 32 },
  weight: { regular: '400', medium: '600', bold: '700' },
} as const

export const shadows = {
  small: { opacity: 0.12, radius: 6, offsetY: 2, elevation: 2 },
  medium: { opacity: 0.16, radius: 14, offsetY: 6, elevation: 5 },
  large: { opacity: 0.2, radius: 24, offsetY: 12, elevation: 9 },
} as const

export const opacity = { disabled: 0.42, pressed: 0.72 } as const

export interface AppTheme {
  name: ThemeName
  isDark: boolean
  colors: ThemeColors
  accents: Record<CharacterAccent, string>
  radius: typeof radius
  spacing: typeof spacing
  typography: typeof typography
  shadows: typeof shadows
  opacity: typeof opacity
}

const lightColors: ThemeColors = {
  background: '#F7F4EF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EEEAE4',
  card: '#FFFFFF',
  cardAlt: '#F2EEE8',
  text: '#1B1918',
  textSecondary: '#514C48',
  textMuted: '#746E69',
  textInverse: '#FFFFFF',
  primary: '#A74423',
  primaryHover: '#8E361A',
  primaryPressed: '#742B14',
  primarySoft: '#F6DDD2',
  secondary: '#74456E',
  accent: '#A74423',
  success: '#2F6E45',
  warning: '#8A5C00',
  danger: '#A52E2A',
  info: '#24667D',
  border: '#D9D3CC',
  borderStrong: '#B7AFA7',
  divider: '#E5E0DA',
  inputBackground: '#FFFFFF',
  inputBorder: '#817A74',
  inputText: '#1B1918',
  placeholder: '#746E69',
  buttonPrimaryBg: '#A74423',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#EEEAE4',
  buttonSecondaryText: '#1B1918',
  buttonGhostText: '#1B1918',
  buttonDisabledBg: '#D9D3CC',
  buttonDisabledText: '#746E69',
  tabActive: '#A74423',
  tabInactive: '#746E69',
  navBackground: '#FFFFFF',
  headerBackground: '#F7F4EF',
  modalBackdrop: 'rgba(27,25,24,0.54)',
  shadow: '#312A25',
  scrim: 'rgba(27,25,24,0.70)',
  mediaScrim: 'rgba(17,17,24,0.78)',
  mediaText: '#FFFFFF',
  mediaTextMuted: '#E8E3DE',
  focusRing: '#A74423',
  selection: '#F6DDD2',
}

const darkColors: ThemeColors = {
  background: '#111118',
  surface: '#181820',
  surfaceElevated: '#202029',
  surfaceMuted: '#292933',
  card: '#181820',
  cardAlt: '#202029',
  text: '#FAF7F0',
  textSecondary: '#C5C1BD',
  textMuted: '#918D91',
  textInverse: '#111118',
  primary: '#EFA052',
  primaryHover: '#F4B36A',
  primaryPressed: '#D98539',
  primarySoft: '#38291F',
  secondary: '#C078B5',
  accent: '#EFA052',
  success: '#70B889',
  warning: '#D2A63F',
  danger: '#E46B64',
  info: '#70B8D1',
  border: '#44434E',
  borderStrong: '#67636E',
  divider: '#33323B',
  inputBackground: '#181820',
  inputBorder: '#67636E',
  inputText: '#FAF7F0',
  placeholder: '#918D91',
  buttonPrimaryBg: '#EFA052',
  buttonPrimaryText: '#111118',
  buttonSecondaryBg: '#292933',
  buttonSecondaryText: '#FAF7F0',
  buttonGhostText: '#FAF7F0',
  buttonDisabledBg: '#292933',
  buttonDisabledText: '#918D91',
  tabActive: '#EFA052',
  tabInactive: '#918D91',
  navBackground: '#181820',
  headerBackground: '#111118',
  modalBackdrop: 'rgba(0,0,0,0.68)',
  shadow: '#000000',
  scrim: 'rgba(0,0,0,0.74)',
  mediaScrim: 'rgba(17,17,24,0.78)',
  mediaText: '#FFFFFF',
  mediaTextMuted: '#E8E3DE',
  focusRing: '#EFA052',
  selection: '#49311F',
}

const solarColors: ThemeColors = {
  background: '#FFF8E7',
  surface: '#FFFCF2',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#FCEBC0',
  card: '#FFFFFF',
  cardAlt: '#FFF3CF',
  text: '#3B2F1E',
  textSecondary: '#684B17',
  textMuted: '#805D20',
  textInverse: '#FFFFFF',
  primary: '#8A4C00',
  primaryHover: '#743E00',
  primaryPressed: '#603200',
  primarySoft: '#F7D991',
  secondary: '#76510A',
  accent: '#9B5900',
  success: '#376C3D',
  warning: '#7D4B00',
  danger: '#A5322D',
  info: '#29667C',
  border: '#E4C77B',
  borderStrong: '#B98D2F',
  divider: '#EED89D',
  inputBackground: '#FFFDF7',
  inputBorder: '#A8781E',
  inputText: '#3B2F1E',
  placeholder: '#805D20',
  buttonPrimaryBg: '#8A4C00',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#FCEBC0',
  buttonSecondaryText: '#3B2F1E',
  buttonGhostText: '#3B2F1E',
  buttonDisabledBg: '#E8D8AF',
  buttonDisabledText: '#805D20',
  tabActive: '#8A4C00',
  tabInactive: '#805D20',
  navBackground: '#FFFCF2',
  headerBackground: '#FFF8E7',
  modalBackdrop: 'rgba(59,47,30,0.50)',
  shadow: '#5E431B',
  scrim: 'rgba(59,47,30,0.68)',
  mediaScrim: 'rgba(17,17,24,0.78)',
  mediaText: '#FFFFFF',
  mediaTextMuted: '#E8E3DE',
  focusRing: '#8A4C00',
  selection: '#F7D991',
}

const monoColors: ThemeColors = {
  background: '#F4F4F4',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  surfaceMuted: '#E4E4E4',
  card: '#FFFFFF',
  cardAlt: '#F4F4F4',
  text: '#181818',
  textSecondary: '#3F3F3F',
  textMuted: '#666666',
  textInverse: '#FFFFFF',
  primary: '#272727',
  primaryHover: '#3F3F3F',
  primaryPressed: '#181818',
  primarySoft: '#E4E4E4',
  secondary: '#525252',
  accent: '#525252',
  success: '#3F3F3F',
  warning: '#525252',
  danger: '#272727',
  info: '#525252',
  border: '#D4D4D4',
  borderStrong: '#A1A1A1',
  divider: '#E4E4E4',
  inputBackground: '#FFFFFF',
  inputBorder: '#767676',
  inputText: '#181818',
  placeholder: '#666666',
  buttonPrimaryBg: '#272727',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#E4E4E4',
  buttonSecondaryText: '#181818',
  buttonGhostText: '#181818',
  buttonDisabledBg: '#D4D4D4',
  buttonDisabledText: '#666666',
  tabActive: '#181818',
  tabInactive: '#666666',
  navBackground: '#FFFFFF',
  headerBackground: '#F4F4F4',
  modalBackdrop: 'rgba(24,24,24,0.52)',
  shadow: '#181818',
  scrim: 'rgba(24,24,24,0.68)',
  mediaScrim: 'rgba(17,17,24,0.78)',
  mediaText: '#FFFFFF',
  mediaTextMuted: '#E6E6E6',
  focusRing: '#181818',
  selection: '#D4D4D4',
}

const makeTheme = (
  name: ThemeName,
  isDark: boolean,
  colors: ThemeColors,
  accents: Record<CharacterAccent, string>,
): AppTheme => ({
  name,
  isDark,
  colors,
  accents,
  radius,
  spacing,
  typography,
  shadows,
  opacity,
})

export const themes: Record<ThemeName, AppTheme> = {
  light: makeTheme('light', false, lightColors, {
    ember: '#A74423',
    ochre: '#846313',
    rose: '#A23F61',
    plum: '#74456E',
    moss: '#376C4A',
  }),
  dark: makeTheme('dark', true, darkColors, {
    ember: '#E26F3F',
    ochre: '#D2A63F',
    rose: '#D46B89',
    plum: '#B86DAD',
    moss: '#70B889',
  }),
  solar: makeTheme('solar', false, solarColors, {
    ember: '#98501B',
    ochre: '#7A5900',
    rose: '#984D55',
    plum: '#77506D',
    moss: '#486638',
  }),
  mono: makeTheme('mono', false, monoColors, {
    ember: '#272727',
    ochre: '#3F3F3F',
    rose: '#525252',
    plum: '#666666',
    moss: '#181818',
  }),
}

/** @deprecated Use the runtime theme from the mobile ThemeProvider. */
export const nativeColors = {
  canvas: darkColors.background,
  raised: darkColors.surface,
  panel: darkColors.surfaceElevated,
  interactive: darkColors.surfaceMuted,
  border: darkColors.border,
  textPrimary: darkColors.text,
  textSecondary: darkColors.textSecondary,
  textMuted: darkColors.textMuted,
  ember: themes.dark.accents.ember,
  emberSoft: darkColors.primary,
  ochre: themes.dark.accents.ochre,
  plum: themes.dark.accents.plum,
  moss: themes.dark.accents.moss,
  danger: darkColors.danger,
  info: darkColors.info,
} as const

/** @deprecated Use `theme.accents` from the mobile ThemeProvider. */
export const accents = themes.dark.accents

export const motion = { fast: 120, normal: 220, deliberate: 420 } as const
export const touchTarget = { minimum: 48, comfortable: 52 } as const
