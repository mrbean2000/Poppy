import { useCallback, useRef } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import useOnboardingSwipeBackToLogin from "../util/useOnboardingSwipeBackToLogin";

const benefits = [
  {
    icon: "book-open-page-variant-outline",
    iconColor: "#A95DDA",
    iconBackground: "#F2E3FF",
    title: "Read with confidence",
    description: "Enjoy stories and articles in your learning language",
  },
  {
    icon: "headphones",
    iconColor: "#1295D8",
    iconBackground: "#DDF4FF",
    title: "Listen at a much higher level",
    description: "Understand more and follow along with greater ease",
  },
  {
    icon: "cards-outline",
    iconColor: "#E57E00",
    iconBackground: "#FFF0D6",
    title: "Grow your vocabulary",
    description: "Learn useful words and practical everyday phrases",
  },
];

export default function OnboardingThreeMonthBenefitsScreen({
  navigation,
  route,
}) {
  const runAllowedNavigation = useOnboardingSwipeBackToLogin(navigation);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;
  const isTransitioning = useRef(false);

  useFocusEffect(
    useCallback(() => {
      contentOpacity.setValue(0);
      contentOffset.setValue(20);

      const animation = Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(contentOffset, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);

      animation.start();

      return () => animation.stop();
    }, [contentOffset, contentOpacity]),
  );

  function goBack() {
    runAllowedNavigation(() => navigation.goBack());
  }

  function continueToSignUp() {
    if (isTransitioning.current) return;

    isTransitioning.current = true;
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(contentOffset, {
        toValue: -20,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start(() => {
      runAllowedNavigation(() =>
        navigation.navigate("CreateAccount", {
          selectedLearningLanguage: route.params?.selectedLearningLanguage,
          nativeLanguage: route.params?.nativeLanguage,
          dailyReadingGoal: route.params?.dailyReadingGoal,
          dailyListeningGoal: route.params?.dailyListeningGoal,
          practiceRemindersEnabled: route.params?.practiceRemindersEnabled,
        }),
      );
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../assets/images/masot/backgroundimagequestion.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
        accessible={false}
      />
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back to reminder settings"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#203B32"
            />
          </TouchableOpacity>
          <View
            style={[styles.progressTrack, { backgroundColor: "#DDD4C4" }]}
            accessibilityRole="progressbar"
            accessibilityLabel="Onboarding step 7 of 7"
            accessibilityValue={{ min: 0, max: 7, now: 7 }}
          >
            <View
              style={[
                styles.progressFill,
                { width: "100%", backgroundColor: "#FFD044" },
              ]}
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.contentAnimated,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
          <View style={styles.prompt}>
            <Image
              source={require("../assets/images/masot/poppy_passingexam.png")}
              style={styles.mascot}
              resizeMode="contain"
              fadeDuration={0}
              accessibilityLabel="Poppy cheering you on"
            />
            <View style={styles.speechBubbleAnimated}>
              <View style={styles.speechBubble}>
                <View style={styles.speechBubbleTail} />
                <Text style={styles.speechBubbleText}>
                  Here's what you can achieve in 3 months!
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: benefit.iconBackground },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={benefit.icon}
                    size={28}
                    color={benefit.iconColor}
                  />
                </View>
                <View style={styles.benefitCopy}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={continueToSignUp}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F1E8" },
  backgroundImage: { ...StyleSheet.absoluteFill },
  screen: { flex: 1, backgroundColor: "transparent" },
  contentAnimated: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFCF5",
    borderWidth: 2,
    borderColor: "#F9D96F",
    elevation: 3,
  },
  progressTrack: {
    flex: 1,
    height: 18,
    overflow: "hidden",
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 12,
    minHeight: 224,
  },
  mascot: {
    width: "40%",
    height: 225,
    marginTop: 10,
  },
  speechBubbleAnimated: {
    flex: 1,
  },
  speechBubble: {
    position: "relative",
    minHeight: 176,
    justifyContent: "center",
    marginLeft: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 4,
    borderColor: "#F9D96F",
    borderRadius: 28,
    backgroundColor: "#FFFCF5",
  },
  speechBubbleTail: {
    position: "absolute",
    left: -13,
    top: "48%",
    width: 23,
    height: 23,
    backgroundColor: "#FFFCF5",
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: "#F9D96F",
    transform: [{ rotate: "45deg" }],
  },
  speechBubbleText: {
    color: "#203B32",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  benefits: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 18,
    marginHorizontal: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    borderWidth: 3,
    borderColor: "#F9D96F",
    borderRadius: 28,
    backgroundColor: "#FFFCF5",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  benefitCopy: {
    flex: 1,
    gap: 4,
  },
  benefitTitle: {
    color: "#172A24",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
  },
  benefitDescription: {
    color: "#77736E",
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    flexShrink: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  continueButton: {
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    borderBottomWidth: 4,
    borderBottomColor: "#DFAE24",
    backgroundColor: "#FFD044",
  },
  continueButtonText: {
    color: "#203B32",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
});
