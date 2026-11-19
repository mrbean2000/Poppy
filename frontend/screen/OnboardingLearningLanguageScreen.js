import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getAllLanguages } from "../util/http";
import useOnboardingSwipeBackToLogin from "../util/useOnboardingSwipeBackToLogin";
import { useTheme } from "../theme/ThemeContext";
import { useOnboardingSelections } from "../context/OnboardingSelectionContext";

export default function OnboardingLearningLanguageScreen({ navigation }) {
  const runAllowedNavigation = useOnboardingSwipeBackToLogin(navigation);
  const { theme } = useTheme();
  const { selections, setSelection } = useOnboardingSelections();
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(
    selections.nativeLanguage,
  );
  const [nativeLanguage, setNativeLanguage] = useState(
    selections.nativeLanguage,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;
  const backPressScale = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (currentStep !== 1 || selections.nativeLanguage) return;

    const englishLanguages = languages.filter((language) =>
      /english/i.test(language.language ?? ""),
    );
    const defaultLanguage =
      englishLanguages.find((language) => {
        const label = `${language.language} ${language.countryFlag ?? ""}`;
        return (
          /united states|\busa?\b/i.test(label) || label.includes("🇺🇸")
        );
      }) ?? (englishLanguages.length === 1 ? englishLanguages[0] : null);

    if (!defaultLanguage) return;

    setSelectedLanguage(defaultLanguage);
    setNativeLanguage(defaultLanguage);
    setSelection("nativeLanguage", defaultLanguage);
  }, [
    currentStep,
    languages,
    selections.nativeLanguage,
    setSelection,
  ]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setErrorMessage(null);

    getAllLanguages()
      .then((availableLanguages) => {
        if (isCurrent) setLanguages(availableLanguages);
      })
      .catch((error) => {
        if (isCurrent) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  function transitionContent(nextStep, nextSelection, onComplete) {
    if (isTransitioning) return;

    setIsTransitioning(true);
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
      if (onComplete) {
        onComplete();
        return;
      }

      setSelectedLanguage(nextSelection);
      setCurrentStep(nextStep);
      contentOffset.setValue(20);
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
      ]).start(() => setIsTransitioning(false));
    });
  }

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

  function continueToSignUp() {
    if (currentStep === 1) {
      setNativeLanguage(selectedLanguage);
      transitionContent(2, selections.learningLanguage);
      return;
    }

    navigation.navigate("OnboardingDailyReadingGoalScreen", {
      selectedLearningLanguage: selectedLanguage,
      nativeLanguage,
    });
  }

  function goBack() {
    if (isTransitioning) return;

    animateBackPressIn();

    if (currentStep === 2) {
      setTimeout(() => transitionContent(1, nativeLanguage), 110);
      return;
    }

    setTimeout(
      () =>
        transitionContent(null, null, () =>
          runAllowedNavigation(() => navigation.goBack()),
        ),
      110,
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Animated.View
            style={{ transform: [{ scale: backPressScale }] }}
          >
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            onPressIn={animateBackPressIn}
            onPressOut={animateBackPressOut}
            accessibilityRole="button"
            accessibilityLabel={
              currentStep === 2 ? "Back to native language" : "Go back"
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          </Animated.View>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel={`Onboarding step ${currentStep} of 7`}
            accessibilityValue={{ min: 0, max: 7, now: currentStep }}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: currentStep === 1 ? "14.29%" : "28.57%",
                },
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
            accessibilityLabel="Bubbles"
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
              {currentStep === 1
                ? "What’s your native language?\nWe’ll use it to help you learn new languages."
                : "Which language would you like to learn?"}
            </Text>
          </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
        <Text style={styles.heading}>
          {currentStep === 1
            ? "My native language is..."
            : "I want to learn..."}
        </Text>

        {isLoading ? (
          <View style={styles.messageContainer}>
            <ActivityIndicator size="large" color="#1ED760" />
            <Text style={styles.messageText}>
              Loading languages...
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.messageContainer}>
            <Text style={[styles.messageText, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setRetryCount((count) => count + 1)}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : languages.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {currentStep === 1
                ? "No languages are available yet."
                : "No languages are available to learn yet."}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.languageList}
            contentContainerStyle={styles.languageListContent}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((language) => {
              const isSelected = selectedLanguage?.id === language.id;

              return (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageRow,
                    isSelected && styles.languageRowSelected,
                  ]}
                  onPress={() =>
                    {
                      const nextSelection =
                        selectedLanguage?.id === language.id
                          ? null
                          : language;
                      setSelectedLanguage(nextSelection);
                      setSelection(
                        currentStep === 1
                          ? "nativeLanguage"
                          : "learningLanguage",
                        nextSelection,
                      );
                    }
                  }
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Select ${language.language} as ${
                    currentStep === 1
                      ? "your native language"
                      : "the language you want to learn"
                  }`}
                >
                  <Text style={styles.languageFlag}>
                    {language.countryFlag}
                  </Text>
                  <Text style={styles.languageName}>{language.language}</Text>
                  {isSelected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={19}
                      color="#000000"
                      style={styles.selectionCheck}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedLanguage ||
                isLoading ||
                Boolean(errorMessage) ||
                isTransitioning) && styles.continueDisabled,
            ]}
            onPress={continueToSignUp}
            disabled={
              !selectedLanguage ||
              isLoading ||
              Boolean(errorMessage) ||
              isTransitioning
            }
            accessibilityRole="button"
            accessibilityLabel={
              currentStep === 1
                ? "Continue to choose a language to learn"
                : "Continue to set your goals"
            }
          >
            <Text style={styles.continueText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000000" },
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#727272",
  },
  content: {
    flex: 1,
  },
  speechBubbleAnimated: {
    flex: 1,
  },
  progressTrack: {
    flex: 1,
    height: 18,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#333333",
  },
  progressFill: {
    width: "14.29%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#1ED760",
  },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 12,
    marginTop: 0,
    marginBottom: 8,
    minHeight: 224,
  },
  mascot: {
    width: "40%",
    height: 225,
    marginTop: 10,
  },
  speechBubble: {
    flex: 1,
    position: "relative",
    minHeight: 176,
    justifyContent: "center",
    marginLeft: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#727272",
    borderRadius: 28,
    backgroundColor: "#181818",
  },
  speechBubbleTail: {
    position: "absolute",
    left: -13,
    top: "48%",
    width: 23,
    height: 23,
    backgroundColor: "#181818",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#727272",
    transform: [{ rotate: "45deg" }],
  },
  speechBubbleText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 22,
  },
  heading: {
    marginHorizontal: 22,
    marginBottom: 12,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  languageList: { flex: 1 },
  languageListContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  languageRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#727272",
    borderRadius: 22,
    backgroundColor: "#181818",
  },
  languageRowSelected: {
    borderColor: "#1ED760",
    backgroundColor: "#173B27",
  },
  languageFlag: {
    width: 58,
    fontSize: 32,
  },
  languageName: {
    flex: 1,
    marginLeft: 10,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  selectionCheck: {
    width: 34,
    height: 34,
    lineHeight: 34,
    textAlign: "center",
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#1ED760",
  },
  messageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  messageText: {
    marginTop: 12,
    color: "#B3B3B3",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryText: {
    marginTop: 16,
    color: "#1ED760",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
  },
  continueButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#1ED760",
  },
  continueDisabled: { opacity: 0.45 },
  continueText: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
