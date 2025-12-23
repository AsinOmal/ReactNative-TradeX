import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts } from "../src/config/fonts";
import { useAuth } from "../src/context/AuthContext";
import { updateDisplayName } from "../src/services/authService";
import { fontScale, scale } from "../src/utils/scaling";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const POST_SIGNUP_ONBOARDING_KEY =
  "@tradex_post_signup_onboarding_complete";

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  isWelcome?: boolean;
  isNameInput?: boolean;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "0",
    icon: "person",
    gradientColors: ["#059669", "#047857"], // Green gradient
    title: "What's your name?",
    subtitle: "Let's personalize your experience",
    description: "",
    isNameInput: true,
  },
  {
    id: "1",
    icon: "bar-chart",
    gradientColors: ["#2563EB", "#1D4ED8"], // Blue gradient
    title: "Track Performance",
    subtitle: "Every Trade Counts",
    description:
      "Log your monthly P&L and watch your progress through intuitive charts.",
  },
  {
    id: "2",
    icon: "trophy",
    gradientColors: ["#D97706", "#B45309"], // Amber gradient
    title: "Celebrate Wins",
    subtitle: "Build Momentum",
    description:
      "Track streaks and stay motivated on your path to profitability.",
  },
];

export default function PostSignupOnboarding() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleFinish = async () => {
    await AsyncStorage.setItem(POST_SIGNUP_ONBOARDING_KEY, "true");
    router.replace("/welcome-back");
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;

    setIsSavingName(true);
    Keyboard.dismiss();

    try {
      await updateDisplayName(displayName.trim());
      await refreshUser();
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } catch (error) {
      console.log("Failed to save name:", error);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleNext = () => {
    const currentSlide = SLIDES[currentIndex];

    if (currentSlide.isNameInput) {
      handleSaveName();
      return;
    }

    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const iconScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const contentOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: "clamp",
    });

    // Name input slide
    if (item.isNameInput) {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: SCREEN_WIDTH, flex: 1 }}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: scale(32) }}
          >
            {/* 3D Icon Card */}
            <Animated.View
              style={{
                marginBottom: scale(40),
                transform: [{ scale: iconScale }],
              }}
            >
              <View
                style={{
                  width: scale(100),
                  height: scale(100),
                  borderRadius: scale(28),
                  backgroundColor: "rgba(255,255,255,0.25)",
                  justifyContent: "center",
                  alignItems: "center",
                  // 3D Shadow
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Ionicons name={item.icon} size={scale(48)} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: contentOpacity,
                transform: [{ translateY }],
                alignItems: "center",
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: fontScale(32),
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: scale(8),
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: fontScale(16),
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                  marginBottom: scale(40),
                }}
              >
                {item.subtitle}
              </Text>

              {/* Name Input */}
              <View
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: scale(16),
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <TextInput
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: fontScale(20),
                      color: "#FFFFFF",
                      paddingVertical: scale(18),
                      paddingHorizontal: scale(20),
                      textAlign: "center",
                    }}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    onSubmitEditing={handleSaveName}
                    returnKeyType="done"
                  />
                </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      );
    }

    // Regular slide (original design)
    return (
      <View
        style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: scale(32) }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          {/* 3D Icon Card */}
          <Animated.View
            style={{
              marginBottom: scale(40),
              transform: [{ scale: iconScale }],
            }}
          >
            <View
              style={{
                width: scale(100),
                height: scale(100),
                borderRadius: scale(28),
                backgroundColor: "rgba(255,255,255,0.25)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <Ionicons name={item.icon} size={scale(48)} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY }],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: fontScale(32),
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: scale(8),
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: fontScale(17),
                color: "rgba(255,255,255,0.9)",
                textAlign: "center",
                marginBottom: scale(16),
              }}
            >
              {item.subtitle}
            </Text>

            {item.description && (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: fontScale(15),
                  color: "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  lineHeight: fontScale(24),
                  maxWidth: "90%",
                }}
              >
                {item.description}
              </Text>
            )}
          </Animated.View>
        </View>
      </View>
    );
  };

  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isNameSlide = currentSlide.isNameInput;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient
        colors={currentSlide.gradientColors}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: scale(24),
              paddingTop: scale(8),
              paddingBottom: scale(16),
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: fontScale(20),
                color: "#FFFFFF",
              }}
            >
              TradeX
            </Text>

            {!isLastSlide && !isNameSlide && (
              <TouchableOpacity
                onPress={handleSkip}
                style={{
                  paddingVertical: scale(8),
                  paddingHorizontal: scale(16),
                  borderRadius: scale(20),
                  backgroundColor: "rgba(255,255,255,0.2)",
                  marginRight: scale(8),
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: fontScale(14),
                    color: "#FFFFFF",
                  }}
                >
                  Skip
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Slides */}
          <Animated.FlatList
            ref={flatListRef}
            data={SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEnabled={!isNameSlide}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          />

          {/* Bottom Controls */}
          <View
            style={{ paddingHorizontal: scale(32), paddingBottom: scale(24) }}
          >
            {/* Progress Dots */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: scale(24),
                gap: scale(8),
              }}
            >
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: currentIndex === index ? scale(24) : scale(8),
                    height: scale(8),
                    borderRadius: scale(4),
                    backgroundColor:
                      currentIndex === index
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.9}
              disabled={isNameSlide && !displayName.trim()}
              style={{
                backgroundColor:
                  isNameSlide && !displayName.trim()
                    ? "rgba(255,255,255,0.3)"
                    : "#FFFFFF",
                paddingVertical: scale(18),
                borderRadius: scale(16),
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isNameSlide && !displayName.trim() ? 0 : 0.2,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: fontScale(18),
                  color:
                    isNameSlide && !displayName.trim()
                      ? "rgba(0,0,0,0.4)"
                      : currentSlide.gradientColors[0],
                }}
              >
                {isSavingName
                  ? "Saving..."
                  : isLastSlide
                  ? "Let's Begin"
                  : "Continue"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
}
