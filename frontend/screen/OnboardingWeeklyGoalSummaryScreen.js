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

export default function OnboardingWeeklyGoalSummaryScreen({
  navigation,
  route,
}) {
  const runAllowedNavigation = useOnboardingSwipeBackToLogin(navigation);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;

  const dailyReadingGoal = Number(route.params?.dailyReadingGoal) || 0;
  const dailyListeningGoal = Number(route.params?.dailyListeningGoal) || 0;
  const weeklyReadingGoal = dailyReadingGoal * 7;
  const weeklyListeningGoal = dailyListeningGoal * 7;
  const weeklyListeningHours = Math.floor(weeklyListeningGoal / 60);
  const weeklyListeningMinutes = weeklyListeningGoal % 60;
  const weeklyListeningLabel =
    weeklyListeningGoal >= 60
      ? `${weeklyListeningHours} ${
          weeklyListeningHours === 1 ? "hour" : "hours"
        }${
          weeklyListeningMinutes > 0
            ? ` ${weeklyListeningMinutes} ${
                weeklyListeningMinutes === 1 ? "minute" : "minutes"
              }`
            : ""
        }`
      : `${weeklyListeningGoal} ${weeklyListeningGoal === 1 ? "minute" : "minutes"}`;

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

  function continueToReminder() {
    navigation.navigate("OnboardingReminderScreen", {
      selectedLearningLanguage: route.params?.selectedLearningLanguage,
      nativeLanguage: route.params?.nativeLanguage,
      dailyReadingGoal: route.params?.dailyReadingGoal,
      dailyListeningGoal: route.params?.dailyListeningGoal,
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
            accessibilityLabel="Back to daily listening goal"
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
            accessibilityLabel="Onboarding step 5 of 7"
            accessibilityValue={{ min: 0, max: 7, now: 5 }}
          >
            <View
              style={[
                styles.progressFill,
                { width: "71.43%", backgroundColor: "#FFD044" },
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
              source={require("../assets/images/masot/poppy_trophy.png")}
              style={styles.mascot}
              resizeMode="contain"
              fadeDuration={0}
              accessibilityLabel="Poppy reading a book"
            />
            <View style={styles.speechBubbleAnimated}>
              <View style={styles.speechBubble}>
                <View style={styles.speechBubbleTail} />
                <Text
                  style={styles.speechBubbleText}
                  accessibilityLabel={
                    weeklyReadingGoal > 0 && weeklyListeningGoal > 0
                      ? `That’s ${weeklyReadingGoal} articles and ${weeklyListeningLabel} in your first week!`
                      : weeklyReadingGoal > 0
                        ? `That’s ${weeklyReadingGoal} articles in your first week!`
                        : weeklyListeningGoal > 0
                          ? `That’s a listening goal of ${weeklyListeningLabel} in your first week!`
                          : "You’re ready to learn at your own pace!"
                  }
                >
                {weeklyReadingGoal > 0 && weeklyListeningGoal > 0 ? (
                  <>
                    That’s{" "}
                    <Text style={styles.highlight}>
                      {weeklyReadingGoal} articles
                    </Text>{" "}
                    and{" "}
                    <Text style={styles.highlight}>{weeklyListeningLabel}</Text>{" "}
                    in your first week!
                  </>
                ) : weeklyReadingGoal > 0 ? (
                  <>
                    That’s{" "}
                    <Text style={styles.highlight}>
                      {weeklyReadingGoal} articles
                    </Text>{" "}
                    in your first week!
                  </>
                ) : weeklyListeningGoal > 0 ? (
                  <>
                    That’s a listening goal of{" "}
                    <Text style={styles.highlight}>{weeklyListeningLabel}</Text>{" "}
                    in your first week!
                  </>
                ) : (
                  <>You’re ready to learn at your own pace!</>
                )}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: "#FFD044",
                  borderBottomColor: "#DFAE24",
                },
              ]}
              onPress={continueToReminder}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text style={[styles.continueButtonText, { color: "#203B32" }]}>
                CONTINUE
              </Text>
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
    marginTop: 0,
    marginBottom: 0,
    minHeight: 224,
  },
  mascot: {
    width: "44%",
    height: 245,
    marginTop: 10,
  },
  speechBubbleAnimated: { flex: 1 },
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
  highlight: {
    color: "#FFD044",
    fontWeight: "900",
  },
  footer: {
    flex: 1,
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
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
});
