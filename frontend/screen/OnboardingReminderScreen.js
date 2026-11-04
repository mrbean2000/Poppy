import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import useOnboardingSwipeBackToLogin from "../util/useOnboardingSwipeBackToLogin";

export default function OnboardingReminderScreen({ navigation, route }) {
  const runAllowedNavigation = useOnboardingSwipeBackToLogin(navigation);
  const { theme } = useTheme();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;

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

  async function requestPracticeReminder() {
    setIsRequestingPermission(true);
    setErrorMessage(null);

    try {
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }

      if (permission.status !== "granted" && !permission.canAskAgain) {
        Alert.alert(
          "Notifications are turned off",
          "To receive practice reminders, enable notifications for Poppy in your device settings.",
          [
            {
              text: "Not now",
              onPress: () => continueToBenefits(false),
            },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch((error) => {
                  setErrorMessage(
                    error.message || "Unable to open notification settings.",
                  );
                });
              },
            },
          ],
        );
        return;
      }

      continueToBenefits(permission.status === "granted");
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to request notification access.",
      );
    } finally {
      setIsRequestingPermission(false);
    }
  }

  function continueToBenefits(practiceRemindersEnabled) {
    navigation.navigate("OnboardingThreeMonthBenefitsScreen", {
      selectedLearningLanguage: route.params?.selectedLearningLanguage,
      nativeLanguage: route.params?.nativeLanguage,
      dailyReadingGoal: route.params?.dailyReadingGoal,
      dailyListeningGoal: route.params?.dailyListeningGoal,
      practiceRemindersEnabled,
    });
  }

  function goBack() {
    runAllowedNavigation(() => navigation.goBack());
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
            accessibilityLabel="Back to weekly goal summary"
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
            accessibilityLabel="Onboarding step 6 of 7"
            accessibilityValue={{ min: 0, max: 7, now: 6 }}
          >
            <View
              style={[
                styles.progressFill,
                { width: "85.71%", backgroundColor: "#FFD044" },
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
              source={require("../assets/images/masot/poppy_notification.png")}
              style={styles.mascot}
              resizeMode="contain"
              fadeDuration={0}
              accessibilityLabel="Poppy reading a book"
            />
            <View style={styles.speechBubbleAnimated}>
              <View style={styles.speechBubble}>
                <View style={styles.speechBubbleTail} />
                <Text style={styles.speechBubbleText}>
                  I’ll remind you to practice so it becomes a habit!
                </Text>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <Text style={[styles.errorMessage, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.reminderButton,
                {
                  backgroundColor: "#FFD044",
                  borderBottomColor: "#DFAE24",
                },
                isRequestingPermission && styles.disabledButton,
              ]}
              onPress={requestPracticeReminder}
              disabled={isRequestingPermission}
              accessibilityRole="button"
              accessibilityLabel="Remind me to practice"
            >
              <Text style={[styles.reminderButtonText, { color: "#203B32" }]}>
                REMIND ME TO PRACTICE
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
    width: "100%",
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
  errorMessage: {
    marginHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    flex: 1,
    flexShrink: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  reminderButton: {
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    borderBottomWidth: 4,
  },
  disabledButton: { opacity: 0.5 },
  reminderButtonText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
});
