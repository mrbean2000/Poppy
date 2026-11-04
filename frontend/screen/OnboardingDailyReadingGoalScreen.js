import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useOnboardingSelections } from "../context/OnboardingSelectionContext";
import useOnboardingSwipeBackToLogin from "../util/useOnboardingSwipeBackToLogin";

const dailyGoals = [
  { articles: 0, level: "None" },
  { articles: 1, level: "Casual" },
  { articles: 2, level: "Regular" },
  { articles: 4, level: "Serious" },
  { articles: 8, level: "Book Worm" },
];

export default function OnboardingDailyReadingGoalScreen({
  navigation,
  route,
}) {
  const runAllowedNavigation = useOnboardingSwipeBackToLogin(navigation);
  const { theme } = useTheme();
  const { selections, setSelection } = useOnboardingSelections();
  const [selectedArticles, setSelectedArticles] = useState(
    selections.dailyReadingGoal ?? 1,
  );
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;
  const backPressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
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
    ]).start();
  }, [contentOffset, contentOpacity]);

  function animateBackPressIn() {
    Animated.spring(backPressScale, {
      toValue: 0.86,
      speed: 28,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }

  function animateBackPressOut() {
    Animated.spring(backPressScale, {
      toValue: 1,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }

  function transitionContent(onComplete) {
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
    ]).start(onComplete);
  }

  function goBack() {
    animateBackPressIn();
    setTimeout(
      () =>
        transitionContent(() =>
          runAllowedNavigation(() => navigation.goBack()),
        ),
      110,
    );
  }

  function commitDailyGoal() {
    navigation.navigate("OnboardingDailyListeningGoalScreen", {
      selectedLearningLanguage: route.params?.selectedLearningLanguage,
      nativeLanguage: route.params?.nativeLanguage,
      dailyReadingGoal: selectedArticles ?? undefined,
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
          <Animated.View style={{ transform: [{ scale: backPressScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              onPressIn={animateBackPressIn}
              onPressOut={animateBackPressOut}
              accessibilityRole="button"
              accessibilityLabel="Back to native language"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color="#203B32"
              />
            </TouchableOpacity>
          </Animated.View>
          <View
            style={[styles.progressTrack, { backgroundColor: "#DDD4C4" }]}
            accessibilityRole="progressbar"
            accessibilityLabel="Onboarding step 3 of 7"
            accessibilityValue={{ min: 0, max: 7, now: 3 }}
          >
            <View
              style={[
                styles.progressFill,
                { width: "42.86%", backgroundColor: "#FFD044" },
              ]}
            />
          </View>
        </View>

        <View style={styles.prompt}>
          <Image
            source={require("../assets/images/masot/poppy_raincoatquestion.png")}
            style={styles.mascot}
            resizeMode="contain"
            fadeDuration={0}
            accessibilityLabel="Poppy encouraging your learning"
          />
          <Animated.View
            style={[
              styles.speechBubbleAnimated,
              {
                opacity: contentOpacity,
                transform: [{ translateX: contentOffset }],
              },
            ]}
          >
            <View style={styles.speechBubble}>
              <View style={styles.speechBubbleTail} />
              <Text style={styles.speechBubbleText}>
                What’s your daily reading goal?
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.goalListAnimated,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
          <ScrollView
            style={styles.goalList}
            contentContainerStyle={styles.goalListContent}
            showsVerticalScrollIndicator={false}
          >
            {dailyGoals.map((goal) => {
              const isSelected = selectedArticles === goal.articles;

              return (
                <TouchableOpacity
                  key={goal.articles}
                  style={[
                    styles.goalOption,
                    {
                      backgroundColor: isSelected
                        ? "rgba(255, 244, 202, 0.96)"
                        : "rgba(255, 253, 248, 0.96)",
                      borderColor: isSelected ? "#F6C938" : "#EAE4D9",
                    },
                    isSelected && styles.goalOptionSelected,
                  ]}
                  onPress={() => {
                    const nextArticles =
                      selectedArticles === goal.articles
                        ? null
                        : goal.articles;
                    setSelectedArticles(nextArticles);
                    setSelection("dailyReadingGoal", nextArticles);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${goal.articles} articles per day, ${goal.level}`}
                >
                  <Text
                    style={[
                      styles.goalMinutes,
                      {
                        color: isSelected ? "#203B32" : "#203B32",
                      },
                    ]}
                  >
                    {goal.articles} article / day
                  </Text>
                  <Text
                    style={[
                      styles.goalLevel,
                      {
                        color: isSelected ? "#203B32" : "#203B32",
                      },
                    ]}
                  >
                    {goal.level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.commitButton,
              {
                backgroundColor:
                  selectedArticles === null ? "#D8D0C2" : "#FFD044",
                borderBottomColor:
                  selectedArticles === null ? "#BDB3A3" : "#DFAE24",
              },
            ]}
            onPress={commitDailyGoal}
            disabled={selectedArticles === null}
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedArticles === null }}
            accessibilityLabel="I'm committed"
          >
            <Text
              style={[
                styles.commitButtonText,
                { color: selectedArticles === null ? "#80796F" : "#203B32" },
              ]}
            >
              I'M COMMITTED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F1E8" },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  screen: { flex: 1, backgroundColor: "transparent" },
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
    backgroundColor: "#DDD4C4",
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
  goalListAnimated: {
    flex: 1,
  },
  goalList: {
    flex: 1,
  },
  goalListContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
    gap: 10,
  },
  goalOption: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#EAE4D9",
    borderRadius: 22,
    backgroundColor: "rgba(255, 253, 248, 0.96)",
    shadowColor: "#5B4932",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  goalOptionSelected: {
    borderColor: "#F6C938",
    backgroundColor: "rgba(255, 244, 202, 0.96)",
  },
  goalMinutes: {
    fontSize: 20,
    fontWeight: "900",
  },
  goalLevel: {
    fontSize: 16,
  },
  footer: {
    flexShrink: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  commitButton: {
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    borderBottomWidth: 4,
  },
  commitButtonText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
});
