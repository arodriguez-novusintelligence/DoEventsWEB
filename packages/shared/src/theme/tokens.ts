/** Design tokens migrados desde DoEventsFront CommonStyles */
export const Colors = {
  Primary: '#F4F5FE',
  TexColor: '#0F172A',
  Placeholder: '#7A828A',
  Line: '#A1A5A9',
  FondoPressed: '#E3E2FC',
  FondoPressedRed: '#EEB6B7',
  NightBlue_200: '#E9EAFE',
  NightBlue_300: '#D0D4FC',
  NightBlue_400: '#B5BBFB',
  NightBlue_500: '#949DF9',
  NightBlue_600: '#6979F8',
  NightBlue_700: '#5E6CDE',
  NightBlue_800: '#515EC0',
  WellDoneGreen: '#008B63',
  WellDoneGreen_200: '#B4E3CE',
  WellDoneGreen_light: '#00C48C',
  AzulStatus: '#0084F4',
  Azul_Facebook: '#1877F2',
  Grey_04: '#BDBDBD',
  Grey_300: '#C6C7C8',
  Grey_07: '#333333',
  Grey_Soft: '#828282',
  MidnightDreams_200: '#E4E5E5',
  MidnightDreams_300: '#C6C7C8',
  MidnightDreams_500: '#72767A',
  MidnightDreams_600: '#0F172A',
  MidnightDreams_1000: '#2F366F',
  Blanco: '#FBFBFE',
  Negro: '#000000',
  Rojo: 'red',
  Red_400: '#DB242D',
  Grey_Top: '#032030',
  /** Tokens alineados con Lovable Discover Hub */
  LovablePrimary: '#6979F8',
  LovablePrimaryGlow: '#8B97FA',
  LovablePrimaryDark: '#2F366F',
  LovablePrimaryLight: '#F0EFFE',
  LovablePrimarySoft: '#F3F2FF',
  LovableBackground: '#F4F5FE',
  LovableSurfaceMuted: '#F4F5FE',
  LovableMuted: '#5A6178',
  LovableBorder: '#E4E6F0',
  LovableAccent: '#EEF0FE',
  LovableForeground: '#010E15',
  LovableCard: '#FFFFFF',
  LovableDrawer: '#2F366F',
  LovableNavPill: '#6979F8',
  LovableDestructive: '#DC2626',
  LovableFavorite: '#22C55E',
} as const;

export const Gradients = {
  brand: 'linear-gradient(135deg, #6979F8 0%, #8B97FA 100%)',
  hero: 'linear-gradient(135deg, #2F366F 0%, #6979F8 65%, #3D4A8F 100%)',
  soft: 'linear-gradient(180deg, #F4F5FE 0%, #FFFFFF 100%)',
  overlay: 'linear-gradient(180deg, transparent 30%, rgba(1, 14, 21, 0.85) 100%)',
  drawer: 'none',
} as const;

export const Shadows = {
  card: '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
  float: '0 14px 36px -10px rgba(105, 121, 248, 0.45)',
  nav: '0 8px 30px -6px rgba(105, 121, 248, 0.35)',
} as const;

export const FontSizes = {
  extrasmall: 10,
  small: 12,
  small_13: 13,
  small_14: 14,
  small_15: 15,
  medium: 16,
  medium_17: 17,
  medium_18: 18,
  medium_19: 19,
  large: 20,
  extraLarge: 24,
  megaLarge: 34,
} as const;

export const Breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export const Layout = {
  /** Marco móvil Figma (390px) */
  mobileFrame: 390,
  maxContentWidth: 390,
  cardMaxWidth: 358,
  borderRadius: 14,
  buttonHeight: 43,
  buttonRadius: 50,
  bottomNavHeight: 98,
  eventCardVerticalWidth: 171,
  eventCardVerticalHeight: 357,
  eventCardHorizontalWidth: 358,
  eventCardHorizontalHeight: 155,
} as const;
