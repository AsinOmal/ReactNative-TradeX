// Font configuration for TradeX
// Using Plus Jakarta Sans font family

export const fonts = {
  // Font family names for use in StyleSheet
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
  light: 'PlusJakartaSans-Light',
  extraLight: 'PlusJakartaSans-ExtraLight',
  
  // Italic variants
  regularItalic: 'PlusJakartaSans-Italic',
  mediumItalic: 'PlusJakartaSans-MediumItalic',
  semiBoldItalic: 'PlusJakartaSans-SemiBoldItalic',
  boldItalic: 'PlusJakartaSans-BoldItalic',
  extraBoldItalic: 'PlusJakartaSans-ExtraBoldItalic',
  lightItalic: 'PlusJakartaSans-LightItalic',
  extraLightItalic: 'PlusJakartaSans-ExtraLightItalic',
} as const;

// Font files to load with useFonts hook
export const fontAssets = {
  'PlusJakartaSans-Regular': require('../../assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-Medium': require('../../assets/fonts/PlusJakartaSans-Medium.ttf'),
  'PlusJakartaSans-SemiBold': require('../../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  'PlusJakartaSans-Bold': require('../../assets/fonts/PlusJakartaSans-Bold.ttf'),
  'PlusJakartaSans-ExtraBold': require('../../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  'PlusJakartaSans-Light': require('../../assets/fonts/PlusJakartaSans-Light.ttf'),
  'PlusJakartaSans-ExtraLight': require('../../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
  'PlusJakartaSans-Italic': require('../../assets/fonts/PlusJakartaSans-Italic.ttf'),
  'PlusJakartaSans-MediumItalic': require('../../assets/fonts/PlusJakartaSans-MediumItalic.ttf'),
  'PlusJakartaSans-SemiBoldItalic': require('../../assets/fonts/PlusJakartaSans-SemiBoldItalic.ttf'),
  'PlusJakartaSans-BoldItalic': require('../../assets/fonts/PlusJakartaSans-BoldItalic.ttf'),
  'PlusJakartaSans-ExtraBoldItalic': require('../../assets/fonts/PlusJakartaSans-ExtraBoldItalic.ttf'),
  'PlusJakartaSans-LightItalic': require('../../assets/fonts/PlusJakartaSans-LightItalic.ttf'),
  'PlusJakartaSans-ExtraLightItalic': require('../../assets/fonts/PlusJakartaSans-ExtraLightItalic.ttf'),
};

export type FontWeight = keyof typeof fonts;
