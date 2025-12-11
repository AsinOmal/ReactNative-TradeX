import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Swiper from 'react-native-swiper';
import { fonts } from '../src/config/fonts';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  textColor: string;
}

const onboarding: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Track\nYour Trades',
    subtitle: 'with ease',
    description: 'Record your monthly P&L and keep all trading data organized.',
    icon: 'trending-up',
    bgColor: '#10B95F', // Green
    textColor: '#FFFFFF',
  },
  {
    id: 2,
    title: 'Analyze\n& Grow',
    subtitle: 'your portfolio',
    description: 'Beautiful charts and analytics to understand your patterns.',
    icon: 'bar-chart',
    bgColor: '#1E1E1E', // Dark
    textColor: '#FFFFFF',
  },
  {
    id: 3,
    title: 'Export\n& Share',
    subtitle: 'your reports',
    description: 'Generate professional PDF reports and CSV exports.',
    icon: 'document-text',
    bgColor: '#FFB800', // Gold/Yellow
    textColor: '#1E1E1E',
  },
];

const STORAGE_KEY = '@tradex_onboarding_complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const isLastSlide = activeIndex === onboarding.length - 1;
  const currentSlide = onboarding[activeIndex];
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      router.replace('/auth/welcome');
    } catch (e) {
      console.error('Failed to save onboarding status:', e);
      router.replace('/auth/welcome');
    }
  };
  
  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      if (Platform.OS === 'web') {
        setActiveIndex(prev => Math.min(prev + 1, onboarding.length - 1));
      }
      swiperRef.current?.scrollBy(1, true);
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle={currentSlide.textColor === '#FFFFFF' ? 'light-content' : 'dark-content'} />
      
      <Swiper
        ref={swiperRef}
        loop={false}
        index={activeIndex}
        showsPagination={false}
        onIndexChanged={(index) => setActiveIndex(index)}
        scrollEnabled={true}
        showsButtons={false}
      >
        {onboarding.map((item) => (
          <View key={item.id} style={[styles.slide, { backgroundColor: item.bgColor }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={completeOnboarding}>
                <Text style={[styles.skipText, { color: item.textColor, opacity: 0.7 }]}>Skip</Text>
              </TouchableOpacity>
            </View>
            
            {/* Visual Area */}
            <View style={styles.visualArea}>
              <View style={[styles.iconCircle, { backgroundColor: item.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}>
                <Ionicons name={item.icon} size={100} color={item.textColor} />
              </View>
            </View>
            
            {/* Content Area */}
            <View style={styles.contentArea}>
              <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: item.textColor, opacity: 0.7 }]}>{item.subtitle}</Text>
              <Text style={[styles.description, { color: item.textColor, opacity: 0.6 }]}>{item.description}</Text>
            </View>
          </View>
        ))}
      </Swiper>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {/* Dots & Label */}
        <View style={styles.dotsContainer}>
          <View style={styles.dotsRow}>
            {onboarding.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : styles.dotInactive
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Next Button */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            { backgroundColor: currentSlide.textColor === '#FFFFFF' ? '#FFFFFF' : '#1E1E1E' }
          ]} 
          onPress={handleNext}
        >
          <Ionicons 
            name={isLastSlide ? 'checkmark' : 'chevron-forward'} 
            size={24} 
            color={currentSlide.textColor === '#FFFFFF' ? currentSlide.bgColor : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  visualArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: {
    paddingHorizontal: 32,
    paddingBottom: 140,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    marginBottom: 12,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 280,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'column',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
