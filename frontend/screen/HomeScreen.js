// src/screens/HomeScreen.js

import {
  Animated,
  BackHandler,
  PanResponder,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getLastReadPassageByUserId,
  getRandomQuote,
  getTodayCompletedCount,
  getUserProfileByFirebaseUid,
  getUserVocabulary,
  getUserSettings,
  recordLoginStreak,
} from "../util/http";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useOnboardingSelections } from "../context/OnboardingSelectionContext";
import { useTheme } from "../theme/ThemeContext";
import HomeRecentPanel from "../components/HomeRecentPanel";
import { HomePanelContext } from "../context/HomePanelContext";
import { getProfilePictureSource } from "../util/profilePictures";
import { useHomeWalkthrough, useWalkthroughScreen, WalkthroughStep, WalkthroughTouchable } from "../context/HomeWalkthroughContext";

const fallbackPassageImages = [
  require("../assets/images/masot/poppy_superman.png"),
  require("../assets/images/masot/poppy_wonderwoman.png"),
  require("../assets/images/masot/poppy_batman.png"),
];

export default function HomeScreen({ navigation, route }) {
  const { isDarkMode, theme } = useTheme();
  const { user } = useAuth();
  const { selections } = useOnboardingSelections();
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lastReadPassage, setLastReadPassage] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [fallbackPassageImage] = useState(
    () =>
      fallbackPassageImages[
        Math.floor(Math.random() * fallbackPassageImages.length)
      ],
  );
  const [vocabularyCount, setVocabularyCount] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [loginStreak, setLoginStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const dailyGoal = settings?.dailyReadingGoal ?? 10;
  const goalPercent =
    dailyGoal > 0
      ? Math.min(100, Math.round((completedToday / dailyGoal) * 100))
      : 0;
  const profileIdRef = useRef(null);
  const lastReadRequestRef = useRef(0);
  const scrollRef = useRef(null);
  const autoWalkthroughAttempted = useRef(false);
  const focused = useIsFocused();
  const { begin, interruptions, foreground, active: walkthroughActive } = useHomeWalkthrough();
  const { track, trackContainer } = useWalkthroughScreen("Home", scrollRef);
  const { width } = useWindowDimensions();
  const panelWidth = width * 0.8;
  const panelOffset = useRef(new Animated.Value(0)).current;
  const setGlobalPanelOpen = useContext(HomePanelContext);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelOpenRef = useRef(false);

  const setPanelVisible = useCallback((visible) => {
    panelOpenRef.current = visible;
    setPanelOpen(visible);
    setGlobalPanelOpen(visible);
    Animated.timing(panelOffset, {
      toValue: visible ? panelWidth : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [panelOffset, panelWidth, setGlobalPanelOpen]);

  const panelResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      focused &&
      !walkthroughActive &&
      gesture.numberActiveTouches === 1 &&
      Math.abs(gesture.dx) > 15 &&
      Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5 &&
      (panelOpenRef.current ? gesture.dx < 0 : gesture.dx > 0),
    onPanResponderGrant: () => panelOffset.stopAnimation(),
    onPanResponderMove: (_, gesture) => {
      const start = panelOpenRef.current ? panelWidth : 0;
      panelOffset.setValue(Math.max(0, Math.min(panelWidth, start + gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      const start = panelOpenRef.current ? panelWidth : 0;
      const position = Math.max(0, Math.min(panelWidth, start + gesture.dx));
      setPanelVisible(
        Math.abs(gesture.vx) > 0.5 ? gesture.vx > 0 : position > panelWidth / 2,
      );
    },
    onPanResponderTerminate: () => setPanelVisible(panelOpenRef.current),
  }), [focused, walkthroughActive, panelOffset, panelWidth, setPanelVisible]);

  useEffect(() => {
    if (!focused || walkthroughActive) setPanelVisible(false);
  }, [focused, walkthroughActive, setPanelVisible]);

  useEffect(() => {
    if (panelOpenRef.current) panelOffset.setValue(panelWidth);
  }, [panelOffset, panelWidth]);

  useEffect(() => () => setGlobalPanelOpen(false), [setGlobalPanelOpen]);

  useEffect(() => {
    if (!focused || !panelOpen) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setPanelVisible(false);
      return true;
    });
    return () => subscription.remove();
  }, [focused, panelOpen, setPanelVisible]);

  useEffect(() => {
    if (interruptions > 0) autoWalkthroughAttempted.current = false;
  }, [interruptions]);

  useEffect(() => {
    if (!focused || !foreground || !settings?.user_id) return;
    if (route.params?.replayWalkthrough) {
      if (typeof settings.homeWalkthroughCompleted !== "boolean") {
        setErrorMessage("Walkthrough settings are unavailable. Update the backend and try again.");
        navigation.setParams({ replayWalkthrough: false });
        return;
      }
      if (begin(settings.user_id, settings.homeWalkthroughCompleted === true)) {
        autoWalkthroughAttempted.current = true;
        navigation.setParams({ replayWalkthrough: false });
      }
    } else if (settings.homeWalkthroughCompleted === false && !autoWalkthroughAttempted.current) {
      autoWalkthroughAttempted.current = begin(settings.user_id, false);
    }
  }, [begin, focused, foreground, interruptions, navigation, route.params?.replayWalkthrough, settings]);

  useEffect(() => {
    let active = true;
    setQuoteLoading(true);
    setQuoteError(null);
    getRandomQuote()
      .then((result) => {
        if (active) setQuote(result);
      })
      .catch((error) => {
        if (active) setQuoteError(error.message);
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [quoteAttempt]);

  async function fetchUserSettings(userId) {
    try {
      setIsLoading(true);
      const userSettings = await getUserSettings(userId);
      console.log(userSettings);
      setSettings(userSettings);
      setProfileLoadFailed(false);
      return userSettings;
    } catch (error) {
      setErrorMessage(error.message);
      setProfileLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLastReadPassage(userId, targetLanguageId) {
    const requestId = ++lastReadRequestRef.current;
    setLastReadPassage(null);
    try {
      const passage = await getLastReadPassageByUserId(
        userId,
        targetLanguageId,
      );
      if (requestId === lastReadRequestRef.current) setLastReadPassage(passage);
    } catch (error) {
      if (requestId === lastReadRequestRef.current)
        setErrorMessage(error.message);
    }
  }

  async function fetchSettingsAndLastReadPassage(userId) {
    const userSettings = await fetchUserSettings(userId);
    await fetchLastReadPassage(userId, userSettings?.targetlanguageid);
  }

  async function fetchCompletedToday(userId) {
    try {
      setCompletedToday(await getTodayCompletedCount(userId));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function fetchLoginStreak(firebaseUid) {
    try {
      const streak = await recordLoginStreak(firebaseUid);
      setLoginStreak(streak.currentStreak);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function fetchVocabularyCount(userId) {
    try {
      const vocabulary = await getUserVocabulary(userId);
      setVocabularyCount(Array.isArray(vocabulary) ? vocabulary.length : 0);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    async function loadUserData() {
      try {
        const profile = await getUserProfileByFirebaseUid(user.uid);
        if (!active) return;
        if (!profile?.id) {
          throw new Error("Your profile does not have a database user ID.");
        }
        setProfile({ uid: user.uid, data: profile });
        profileIdRef.current = profile.id;
        fetchSettingsAndLastReadPassage(profile.id);
        fetchCompletedToday(profile.id);
        fetchVocabularyCount(profile.id);
        fetchLoginStreak(user.uid);
      } catch (error) {
        if (!active) return;
        setErrorMessage(error.message);
        setProfileLoadFailed(true);
      }
    }

    loadUserData();
    return () => {
      active = false;
    };
  }, [user?.uid, profileLoadAttempt]);

  // Refresh "Continue Reading" whenever Home regains focus (e.g. after the reader).
  useFocusEffect(
    useCallback(() => {
      if (profileIdRef.current) {
        fetchSettingsAndLastReadPassage(profileIdRef.current);
        fetchCompletedToday(profileIdRef.current);
        fetchVocabularyCount(profileIdRef.current);
      }
    }, []),
  );

  return (
    <View style={styles.container} {...panelResponder.panHandlers}>
      <HomeRecentPanel
        visible={panelOpen && focused}
        width={panelWidth}
        user={user}
        profile={profile?.uid === user?.uid ? profile.data : null}
        profilePictureUrl={settings?.profilePictureUrl}
        onClose={() => setPanelVisible(false)}
        navigation={navigation}
      />
      <Animated.View style={[styles.container, { transform: [{ translateX: panelOffset }] }]}>
    <ImageBackground
      source={
        isDarkMode
          ? require("../assets/images/masot/backgroundimagequestion_darkmode.png")
          : require("../assets/images/masot/backgroundimagequestion.png")
      }
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}

          <View style={styles.header} onLayout={trackContainer("header")}>
            <TouchableOpacity
              onPress={() => setPanelVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Open recent history"
            >
              <MaterialCommunityIcons name="menu" size={26} color={theme.colors.text} />
            </TouchableOpacity>
            <WalkthroughStep name="profile">
              <WalkthroughTouchable
                style={styles.avatar}
                onLayout={track("profile", "header")}
                onPress={() => navigation.navigate("ProfilePicture")}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                <Image
                  source={getProfilePictureSource(settings?.profilePictureUrl)}
                  style={styles.profileImage}
                />
              </WalkthroughTouchable>
            </WalkthroughStep>
            <View style={styles.greetingBlock}>
              <Text style={[styles.greeting, { color: theme.colors.text }]}>
                Welcome back
              </Text>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                Ready to learn?
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <Text style={[styles.errorMessage, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
          {profileLoadFailed ? (
            <TouchableOpacity
              onPress={() => {
                setErrorMessage(null);
                setProfileLoadFailed(false);
                setProfileLoadAttempt((attempt) => attempt + 1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading profile and settings"
            >
              <Text style={{ color: theme.colors.text, marginBottom: 12, fontWeight: "700" }}>
                Retry loading profile and settings
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Daily Goal */}

          <View
            style={[
              styles.goalCard,
              {
                backgroundColor: isDarkMode ? "#f0e6d8" : "#FFF4E6",
              },
            ]}
          >
            <View style={styles.goalHeader}>
              <View style={styles.goalSummary}>
                <Image
                  source={require("../assets/icons/target-icon.png")}
                  style={styles.goalIcon}
                  resizeMode="contain"
                  accessibilityLabel="Daily goal target"
                />
                <View>
                  <Text style={[styles.goalTitle, { color: "#000000" }]}>
                    Daily Goal
                  </Text>

                  <Text style={[styles.goalProgress, { color: "#000000" }]}>
                    {completedToday} / {dailyGoal} passages
                  </Text>
                </View>
              </View>

              <View style={styles.streakHeader}>
                <Text style={styles.fire}>🔥</Text>
                <Text style={[styles.streak, { color: "#000000" }]}>
                  {loginStreak} day streak
                </Text>
              </View>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${goalPercent}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.streakRow}>
              <Text
                style={[
                  styles.progressPercent,
                  { color: theme.colors.primary },
                ]}
              >
                {goalPercent}%
              </Text>
            </View>
          </View>

          {/* Language selector */}

          <WalkthroughStep name="language">
          <WalkthroughTouchable
            onLayout={track("language")}
            style={[
              styles.languageSelector,
              {
                backgroundColor: isDarkMode ? "#f0e6d8" : "#FFF4E6",
              },
            ]}
            onPress={() =>
              navigation.navigate("Settings", {
                userSettings: settings,
                setSettings: setSettings,
              })
            }
          >
            <Text style={styles.flag}>{settings?.nativeLanguageFlag}</Text>

            <Text style={[styles.language, { color: "#000000" }]}>
              {settings?.nativelanguage}
            </Text>

            <Text style={[styles.arrow, { color: "#000000" }]}>→</Text>

            <Text style={styles.flag}>{settings?.targetLanguageFlag}</Text>

            <Text style={[styles.language, { color: "#000000" }]}>
              {settings?.targetlanguage}
            </Text>

            <Text
              style={[
                styles.chevron,
                { color: isDarkMode ? "#FFF4E6" : "#000000" },
              ]}
            >
              ›
            </Text>
          </WalkthroughTouchable>
          </WalkthroughStep>

          {/* Continue Reading */}

          <View style={styles.sectionHeader} onLayout={trackContainer("storiesHeader")}>
            <View style={styles.sectionTitleGroup}>
              <Image
                source={require("../assets/icons/book-icon.png")}
                style={styles.quickIconImage}
                resizeMode="contain"
                accessibilityLabel="Book"
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFCF5" : "#172033" },
                ]}
              >
                Continue Reading
              </Text>
            </View>

            <WalkthroughStep name="stories">
            <WalkthroughTouchable onLayout={track("stories", "storiesHeader")} onPress={() => navigation.navigate("Stories")}>
              <Text style={styles.seeAll}>See all ›</Text>
            </WalkthroughTouchable>
            </WalkthroughStep>
          </View>

          <TouchableOpacity
            style={[
              styles.articleCard,
              { backgroundColor: isDarkMode ? "#f0e6d8" : "#FFF4E6" },
            ]}
            onPress={() => {
              if (!lastReadPassage) {
                navigation.navigate("Import");
                return;
              }

              navigation.navigate("Reader", {
                id: lastReadPassage.id,
                title: lastReadPassage.title,
                imageUrl: lastReadPassage.imageUrl,
              });
            }}
          >
            <View style={styles.image}>
              <Image
                source={
                  lastReadPassage?.imageUrl
                    ? { uri: lastReadPassage.imageUrl }
                    : fallbackPassageImage
                }
                style={
                  lastReadPassage?.imageUrl
                    ? styles.storyImage
                    : styles.avatarImage
                }
              />
            </View>

            <View style={styles.articleInfo}>
              <Text style={[styles.articleTitle, { color: "#000000" }]}>
                {lastReadPassage?.title ?? "No story in progress"}
              </Text>

              <Text style={[styles.articleMeta, { color: "#4B5563" }]}>
                {lastReadPassage
                  ? "Continue where you left off"
                  : "Start reading a story"}
              </Text>
            </View>

            <View style={styles.playButton}>
              <MaterialCommunityIcons
                name={lastReadPassage ? "arrow-right" : "plus"}
                size={27}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}

          <View style={styles.grid} onLayout={trackContainer("grid")}>
            <WalkthroughStep name="vocabulary">
            <WalkthroughTouchable
              onLayout={track("vocabulary", "grid")}
              style={[styles.quickCard, { backgroundColor: "#FAC048" }]}
              onPress={() => navigation.navigate("Vocabulary")}
            >
              <Image
                source={require("../assets/icons/book-icon.png")}
                style={styles.quickIconImage}
                resizeMode="contain"
                accessibilityLabel="Book"
              />

              <Text style={[styles.quickTitle, { color: "#000000" }]}>
                My Vocabulary
              </Text>

              <Text style={[styles.quickSubtitle, { color: "#000000" }]}>
                {vocabularyCount} {vocabularyCount === 1 ? "word" : "words"}
              </Text>
            </WalkthroughTouchable>
            </WalkthroughStep>

            <WalkthroughStep name="flashcards">
            <WalkthroughTouchable
              onLayout={track("flashcards", "grid")}
              style={[
                styles.quickCard,
                styles.quickCardCentered,
                { backgroundColor: "#DDB8F3" },
              ]}
              onPress={() => navigation.navigate("Flashcards")}
            >
              <View style={styles.quickTitleRow}>
                <Image
                  source={require("../assets/icons/flashcard-icon.png")}
                  style={styles.quickIconImage}
                  resizeMode="contain"
                  accessibilityLabel="Flashcards"
                />
                <View style={styles.quickTextBlock}>
                  <Text
                    style={[
                      styles.quickTitle,
                      styles.flashcardsTitle,
                      { color: "#000000" },
                    ]}
                  >
                    Flashcards
                  </Text>
                  {/* <Text style={[styles.quickSubtitle, { color: "#231e1e" }]}>
                    12 due
                  </Text> */}
                </View>
              </View>
            </WalkthroughTouchable>
            </WalkthroughStep>

            <WalkthroughStep name="settings">
            <WalkthroughTouchable
              onLayout={track("settings", "grid")}
              style={[
                styles.quickCard,
                styles.quickCardCentered,
                { backgroundColor: "#93DFA1" },
              ]}
              onPress={() =>
                navigation.navigate("Settings", {
                  userSettings: settings,
                  setSettings: setSettings,
                })
              }
            >
              <View style={styles.quickTitleRow}>
                <Text style={styles.quickTitleEmoji}>⚙️</Text>
                <Text style={[styles.quickTitle, { color: "#000000" }]}>
                  Settings
                </Text>
              </View>
            </WalkthroughTouchable>
            </WalkthroughStep>

            <WalkthroughStep name="podcast">
            <WalkthroughTouchable
              onLayout={track("podcast", "grid")}
              style={[
                styles.quickCard,
                styles.quickCardCentered,
                { backgroundColor: "#FDA96C" },
              ]}
              onPress={() => navigation.navigate("Podcast")}
              accessibilityRole="button"
              accessibilityLabel="Open podcast search"
            >
              <View style={styles.quickTitleRow}>
                <Text style={styles.quickTitleEmoji}>🎙️</Text>
                <View style={styles.quickTextBlock}>
                  <Text style={[styles.quickTitle, { color: "#000000" }]}>
                    Podcast (Beta)
                  </Text>
                  <Text style={[styles.quickSubtitle, { color: "#000000" }]}>
                    Listen and learn
                  </Text>
                </View>
              </View>
            </WalkthroughTouchable>
            </WalkthroughStep>
          </View>

          <View
            style={[
              styles.quoteCard,
              { backgroundColor: isDarkMode ? "#f0e6d8" : "#FFF4E6" },
            ]}
          >
            <Text style={styles.quoteHeading}>A little inspiration</Text>
            {quoteLoading ? (
              <Text style={styles.quoteText}>Loading quote...</Text>
            ) : quoteError ? (
              <>
                <Text style={styles.quoteError}>{quoteError}</Text>
                <TouchableOpacity
                  onPress={() => setQuoteAttempt((attempt) => attempt + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading quote"
                >
                  <Text style={styles.quoteRetry}>Try again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.quoteText}>{quote?.quote}</Text>
                <Text style={styles.quoteAuthor}>— {quote?.quoter}</Text>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
        {panelOpen ? (
          <TouchableOpacity
            style={styles.panelBackdrop}
            activeOpacity={1}
            onPress={() => setPanelVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close recent panel"
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },

  greetingBlock: {
    flex: 1,
  },

  errorMessage: {
    marginBottom: 12,
  },

  quoteCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
  },
  quoteHeading: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "900",
  },
  quoteText: {
    color: "#172033",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  quoteAuthor: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  quoteError: {
    color: "#8B1E1E",
    fontSize: 14,
    marginTop: 8,
  },
  quoteRetry: {
    color: "#075BE8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: "cover",
  },

  greeting: {
    fontSize: 16,
    fontWeight: "600",
  },

  name: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFD044",
    backgroundColor: "#FFFCF5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarText: {
    fontSize: 26,
  },

  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "cover",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  goalCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  goalSummary: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalIcon: {
    width: 42,
    height: 42,
    marginRight: 10,
  },

  goalTitle: {
    fontSize: 20,
    fontWeight: "900",
  },

  goalProgress: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },

  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  fire: {
    fontSize: 27,
    marginRight: 8,
  },

  progressBackground: {
    height: 16,
    borderRadius: 999,
    backgroundColor: "#DDD4C4",
    overflow: "hidden",
    marginTop: 16,
  },

  progressFill: {
    width: "50%",
    height: "100%",
    borderRadius: 999,
  },

  streakRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },

  streak: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },

  progressPercent: {
    fontSize: 13,
    fontWeight: "800",
  },

  languageSelector: {
    minHeight: 62,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 28,
  },

  flag: {
    fontSize: 20,
  },

  language: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
    color: "#172033",
  },

  arrow: {
    fontSize: 18,
    marginHorizontal: 12,
    color: "#000000",
  },

  chevron: {
    marginLeft: "auto",
    fontSize: 23,
    color: "#000000",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    paddingHorizontal: 2,
  },

  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFCF5",
  },

  seeAll: {
    color: "#FFD044",
    fontSize: 20,
    fontWeight: "800",
  },

  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 140,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 22,
    padding: 10,
  },

  image: {
    width: 132,
    height: 116,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5F5D5",
  },

  articleInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 2,
    paddingRight: 42,
  },

  articleType: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "#C9E5FF",
    color: "#1764A0",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
  },

  articleTitle: {
    fontSize: 18,
    lineHeight: 19,
    fontWeight: "900",
  },

  articleMeta: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    color: "#6B7280",
  },

  playButton: {
    position: "absolute",
    right: 14,
    top: "50%",
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#075BE8",
    alignItems: "center",
    justifyContent: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  quickCard: {
    width: "48%",
    minHeight: 132,
    borderRadius: 22,
    padding: 16,
  },

  quickCardCentered: {
    justifyContent: "center",
  },

  quickIcon: {
    fontSize: 30,
    marginBottom: 12,
  },

  quickTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  quickTitleEmoji: {
    fontSize: 28,
    marginRight: 8,
  },

  quickTextBlock: {
    flex: 1,
  },

  quickIconImage: {
    width: 40,
    height: 40,
  },

  quickTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#172033",
  },

  flashcardsTitle: {
    fontSize: 16,
  },

  quickSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  keepGoingImage: {
    height: 100,
    width: 500,
  },
});
