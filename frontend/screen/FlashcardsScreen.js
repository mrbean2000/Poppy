import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import {
  getUserVocabulary,
  updateVocabularyFavorite,
  updateVocabularyStatus,
} from "../util/http";
import { useTheme } from "../theme/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const USER_ID = 1;
const SWIPE_DISTANCE = 80;

export default function FlashcardsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [vocabulary, setVocabulary] = useState([]);
  const flipProgress = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isClosePressed, setIsClosePressed] = useState(false);
  const [isGearPressed, setIsGearPressed] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isEnglishFront, setIsEnglishFront] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const vocabularyRef = useRef(vocabulary);
  const originalVocabularyOrder = useRef([]);
  const currentIndexRef = useRef(currentIndex);
  const isEnglishFrontRef = useRef(isEnglishFront);
  const isAutoPlayingRef = useRef(false);
  const autoPlaySessionRef = useRef(0);
  const favoriteUpdatesRef = useRef(new Set());
  vocabularyRef.current = vocabulary;
  currentIndexRef.current = currentIndex;
  isEnglishFrontRef.current = isEnglishFront;

  useEffect(() => {
    let isCurrent = true;

    async function loadVocabulary() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const allEntries = await getUserVocabulary(USER_ID);
        const filter = route.params?.filter;
        const entries =
          filter === "Learning"
            ? allEntries.filter((entry) => entry.statusLevel < 4)
            : filter === "Mastered"
              ? allEntries.filter((entry) => entry.statusLevel === 4)
              : filter === "Favorites"
                ? allEntries.filter((entry) => entry.favorite)
                : allEntries;
        if (isCurrent) {
          originalVocabularyOrder.current = entries.map((entry) => entry.word);
          setVocabulary(entries);
        }
      } catch (error) {
        if (isCurrent) setErrorMessage(error.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadVocabulary();
    return () => {
      isCurrent = false;
    };
  }, [route.params?.filter]);

  useEffect(
    () => () => {
      autoPlaySessionRef.current += 1;
      isAutoPlayingRef.current = false;
      Speech.stop().catch((error) =>
        console.warn("Failed to stop flashcard playback:", error),
      );
    },
    [],
  );

  function cancelAutoPlay() {
    if (!isAutoPlayingRef.current) return;

    autoPlaySessionRef.current += 1;
    isAutoPlayingRef.current = false;
    setIsAutoPlaying(false);
    position.stopAnimation();
    position.setValue({ x: 0, y: 0 });
    Speech.stop().catch((error) =>
      console.warn("Failed to stop flashcard playback:", error),
    );
  }

  function showPrevCard(swipeDirection) {
    cancelAutoPlay();
    setIsSwipingRight(false);
    setIsSwipingLeft(false);
    const nextIndex = currentIndexRef.current + swipeDirection;
    if (nextIndex < 0 || nextIndex >= vocabularyRef.current.length) {
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
      return;
    }

    position.stopAnimation();
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setIsDeckComplete(false);
    setIsFlipped(false);
    flipProgress.setValue(0);

    requestAnimationFrame(() => {
      position.setValue({ x: -500, y: 0 });
      Animated.timing(position, {
        toValue: { x: 0, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }

  function handleShuffleChange(shouldShuffle) {
    cancelAutoPlay();
    setIsShuffleEnabled(shouldShuffle);
    const entriesByWord = new Map(
      vocabularyRef.current.map((entry) => [entry.word, entry]),
    );

    if (shouldShuffle) {
      const shuffledEntries = [...vocabularyRef.current];
      for (let index = shuffledEntries.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledEntries[index], shuffledEntries[randomIndex]] = [
          shuffledEntries[randomIndex],
          shuffledEntries[index],
        ];
      }
      setVocabulary(shuffledEntries);
    } else {
      setVocabulary(
        originalVocabularyOrder.current
          .map((word) => entriesByWord.get(word))
          .filter(Boolean),
      );
    }

    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setIsDeckComplete(false);
    setIsFlipped(false);
    flipProgress.setValue(0);
    position.setValue({ x: 0, y: 0 });
  }

  function restartFlashcards() {
    cancelAutoPlay();
    position.stopAnimation();
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setIsDeckComplete(false);
    setIsFlipped(false);
    setIsSwipingRight(false);
    setIsSwipingLeft(false);
    flipProgress.stopAnimation();
    flipProgress.setValue(0);
    position.setValue({ x: 0, y: 0 });
    setIsSettingsVisible(false);
  }

  function showNextCard(swipeDirection) {
    cancelAutoPlay();
    setIsSwipingRight(swipeDirection > 0);
    setIsSwipingLeft(swipeDirection < 0);
    const currentEntry = vocabularyRef.current[currentIndexRef.current];

    if (currentEntry) {
      const nextStatusLevel = swipeDirection > 0 ? 4 : 0;
      const previousStatusLevel = currentEntry.statusLevel;

      setVocabulary((entries) =>
        entries.map((vocabularyEntry) =>
          vocabularyEntry.word === currentEntry.word
            ? { ...vocabularyEntry, statusLevel: nextStatusLevel }
            : vocabularyEntry,
        ),
      );

      updateVocabularyStatus(USER_ID, currentEntry.word, nextStatusLevel).catch(
        (error) => {
          console.warn("Failed to update vocabulary status:", error);
          setVocabulary((entries) =>
            entries.map((vocabularyEntry) =>
              vocabularyEntry.word === currentEntry.word &&
              vocabularyEntry.statusLevel === nextStatusLevel
                ? { ...vocabularyEntry, statusLevel: previousStatusLevel }
                : vocabularyEntry,
            ),
          );
        },
      );
    }

    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < 0 || nextIndex >= vocabularyRef.current.length) {
      Animated.timing(position, {
        toValue: { x: swipeDirection * 500, y: 0 },
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        position.setValue({ x: 0, y: 0 });
        setIsDeckComplete(true);
        setIsSwipingRight(false);
        setIsSwipingLeft(false);
      });
      return;
    }

    Animated.timing(position, {
      toValue: { x: swipeDirection * 500, y: 0 },
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      flipProgress.setValue(0);
      position.setValue({ x: 0, y: 0 });
      setIsSwipingRight(false);
      setIsSwipingLeft(false);
    });
  }

  async function toggleFavorite(cardEntry) {
    if (favoriteUpdatesRef.current.has(cardEntry.word)) return;

    const previousFavorite = Boolean(cardEntry.favorite);
    const shouldFavorite = !previousFavorite;
    favoriteUpdatesRef.current.add(cardEntry.word);
    setVocabulary((entries) =>
      entries.map((vocabularyEntry) =>
        vocabularyEntry.word === cardEntry.word
          ? { ...vocabularyEntry, favorite: shouldFavorite }
          : vocabularyEntry,
      ),
    );

    try {
      const updatedEntry = await updateVocabularyFavorite(
        USER_ID,
        cardEntry.word,
        shouldFavorite,
      );
      setVocabulary((entries) =>
        entries.map((vocabularyEntry) =>
          vocabularyEntry.word === cardEntry.word
            ? { ...vocabularyEntry, favorite: updatedEntry.favorite }
            : vocabularyEntry,
        ),
      );
    } catch (error) {
      setVocabulary((entries) =>
        entries.map((vocabularyEntry) =>
          vocabularyEntry.word === cardEntry.word
            ? { ...vocabularyEntry, favorite: previousFavorite }
            : vocabularyEntry,
        ),
      );
      Alert.alert("Favorite not saved", error.message);
    } finally {
      favoriteUpdatesRef.current.delete(cardEntry.word);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy)) > 8,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.max(Math.abs(gestureState.dx), Math.abs(gestureState.dy)) > 8,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
        setIsSwipingRight(gestureState.dx > 0);
        setIsSwipingLeft(gestureState.dx < 0);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) >= SWIPE_DISTANCE) {
          cancelAutoPlay();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          showNextCard(gestureState.dx > 0 ? 1 : -1);
          return;
        }

        setIsSwipingRight(false);
        setIsSwipingLeft(false);
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        setIsSwipingRight(false);
        setIsSwipingLeft(false);
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const entry = vocabulary[currentIndex];
  const learnedCount = vocabulary.filter(
    (vocabularyEntry) => vocabularyEntry.statusLevel === 4,
  ).length;
  const learningCount = vocabulary.length - learnedCount;
  const rotation = position.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });
  const knowOpacity = position.x.interpolate({
    inputRange: [0, 30, SWIPE_DISTANCE, 500],
    outputRange: [0, 0.5, 1, 0],
    extrapolate: "clamp",
  });
  const stillLearningOpacity = position.x.interpolate({
    inputRange: [-500, -SWIPE_DISTANCE, -30, 0],
    outputRange: [0, 1, 0.5, 0],
    extrapolate: "clamp",
  });
  const leftIncrementOpacity = position.x.interpolate({
    inputRange: [-500, -SWIPE_DISTANCE, 0],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });
  const rightIncrementOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_DISTANCE, 500],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });
  const learningCountOpacity = position.x.interpolate({
    inputRange: [-SWIPE_DISTANCE, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const learnedCountOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_DISTANCE],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const wordOpacity = position.x.interpolate({
    inputRange: [-SWIPE_DISTANCE, 0, SWIPE_DISTANCE],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });
  const cardRotation = flipProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const frontFaceOpacity = flipProgress.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backFaceOpacity = flipProgress.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: [0, 0, 1, 1],
  });

  function flipCard() {
    cancelAutoPlay();
    const nextIsFlipped = !isFlipped;
    setIsFlipped(nextIsFlipped);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.timing(flipProgress, {
      toValue: nextIsFlipped ? 1 : 0,
      duration: 325,
      useNativeDriver: true,
    }).start();
  }

  function handleFrontLanguageChange(showEnglish) {
    cancelAutoPlay();
    setIsEnglishFront(showEnglish);
    setIsFlipped(false);
    flipProgress.stopAnimation();
    flipProgress.setValue(0);
  }

  async function speakDisplayedContent() {
    if (!entry) return;

    cancelAutoPlay();
    const backText = [
      entry.pinyin || "No pinyin available",
      Array.isArray(entry.definitions)
        ? entry.definitions.join(". ")
        : entry.definitions || "No definitions available",
    ].join(". ");
    const isEnglishFace = isEnglishFront ? !isFlipped : isFlipped;

    try {
      await Speech.stop();
      Speech.speak(isEnglishFace ? backText : entry.word, {
        language: isEnglishFace ? "en-US" : "zh-CN",
        onError: (error) =>
          console.warn("Failed to read flashcard aloud:", error),
      });
    } catch (error) {
      console.warn("Failed to read flashcard aloud:", error);
    }
  }

  function finishAutoPlay(session) {
    if (autoPlaySessionRef.current !== session) return;

    autoPlaySessionRef.current += 1;
    isAutoPlayingRef.current = false;
    setIsAutoPlaying(false);
  }

  function playCardSequence(index, session) {
    if (autoPlaySessionRef.current !== session || !isAutoPlayingRef.current) {
      return;
    }

    const card = vocabularyRef.current[index];
    if (!card) {
      finishAutoPlay(session);
      return;
    }

    const englishFront = isEnglishFrontRef.current;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setIsFlipped(englishFront);
    flipProgress.stopAnimation();
    flipProgress.setValue(englishFront ? 1 : 0);
    position.stopAnimation();
    position.setValue({ x: 0, y: 0 });

    const definitions =
      Array.isArray(card.definitions) && card.definitions.length > 0
        ? card.definitions.join(". ")
        : card.definitions || "No definitions available";
    const backText = [card.pinyin || "No pinyin available", definitions].join(
      ". ",
    );

    function readDefinitions() {
      if (autoPlaySessionRef.current !== session || !isAutoPlayingRef.current) {
        return;
      }

      const definitionFace = !isEnglishFrontRef.current;
      setIsFlipped(definitionFace);
      Animated.timing(flipProgress, {
        toValue: definitionFace ? 1 : 0,
        duration: 325,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (
          !finished ||
          autoPlaySessionRef.current !== session ||
          !isAutoPlayingRef.current
        ) {
          return;
        }

        try {
          Speech.speak(backText, {
            language: "en-US",
            onDone: () => {
              if (
                autoPlaySessionRef.current !== session ||
                !isAutoPlayingRef.current
              ) {
                return;
              }

              const nextIndex = index + 1;
              if (nextIndex >= vocabularyRef.current.length) {
                setIsDeckComplete(true);
                finishAutoPlay(session);
                return;
              }

              Animated.timing(position, {
                toValue: { x: 500, y: 0 },
                duration: 180,
                useNativeDriver: true,
              }).start(({ finished: advanceFinished }) => {
                if (
                  !advanceFinished ||
                  autoPlaySessionRef.current !== session ||
                  !isAutoPlayingRef.current
                ) {
                  return;
                }

                position.setValue({ x: 0, y: 0 });
                playCardSequence(nextIndex, session);
              });
            },
            onError: (error) => {
              console.warn(
                "Failed to read flashcard definitions aloud:",
                error,
              );
              finishAutoPlay(session);
            },
          });
        } catch (error) {
          console.warn("Failed to read flashcard definitions aloud:", error);
          finishAutoPlay(session);
        }
      });
    }

    try {
      Speech.speak(card.word, {
        language: "zh-CN",
        onDone: readDefinitions,
        onError: (error) => {
          console.warn("Failed to read flashcard word aloud:", error);
          finishAutoPlay(session);
        },
      });
    } catch (error) {
      console.warn("Failed to read flashcard word aloud:", error);
      finishAutoPlay(session);
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlayingRef.current) {
      cancelAutoPlay();
      return;
    }

    if (!vocabularyRef.current.length) return;

    const session = autoPlaySessionRef.current + 1;
    autoPlaySessionRef.current = session;
    isAutoPlayingRef.current = true;
    setIsAutoPlaying(true);
    Speech.stop()
      .then(() => {
        if (
          autoPlaySessionRef.current === session &&
          isAutoPlayingRef.current
        ) {
          playCardSequence(currentIndexRef.current, session);
        }
      })
      .catch((error) => {
        console.warn("Failed to start flashcard playback:", error);
        finishAutoPlay(session);
      });
  }

  function renderSpeakerButton() {
    return (
      <TouchableOpacity
        style={[
          styles.speakerButton,
          { backgroundColor: theme.colors.bluePastel },
        ]}
        onPress={speakDisplayedContent}
        accessibilityRole="button"
        accessibilityLabel={
          isEnglishFace
            ? "Read pinyin and definitions aloud"
            : "Read word aloud"
        }
      >
        <MaterialCommunityIcons
          name="volume-high"
          size={22}
          color={theme.colors.blueDark}
        />
      </TouchableOpacity>
    );
  }

  function renderFavoriteButton() {
    if (!entry) return null;

    return (
      <TouchableOpacity
        style={[
          styles.favoriteButton,
          { backgroundColor: theme.colors.bluePastel },
        ]}
        onPress={() => toggleFavorite(entry)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          entry.favorite
            ? `Remove ${entry.word} from favorites`
            : `Add ${entry.word} to favorites`
        }
        accessibilityState={{ selected: Boolean(entry.favorite) }}
      >
        <MaterialCommunityIcons
          name={entry.favorite ? "star" : "star-outline"}
          size={20}
          color={entry.favorite ? "#F5A623" : theme.colors.blueDark}
        />
      </TouchableOpacity>
    );
  }

  function renderDefinitions() {
    return (
      <Animated.View
        style={[styles.definitionContent, { opacity: wordOpacity }]}
      >
        <Text style={[styles.pinyin, { color: theme.colors.blueDark }]}>
          {entry.pinyin || "No pinyin available"}
        </Text>
        {Array.isArray(entry.definitions) && entry.definitions.length > 0 ? (
          <View>
            {entry.definitions.map((definition, index) => (
              <Text
                key={`${entry.word}-${index}`}
                style={[styles.pinyin, { color: theme.colors.text }]}
              >
                {`${index + 1}. ${definition}`}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={[styles.details, { color: theme.colors.text }]}>
            {entry.definitions || "No definitions available"}
          </Text>
        )}
      </Animated.View>
    );
  }

  function renderWord() {
    return (
      <Animated.Text
        style={[
          styles.word,
          { color: theme.colors.text, opacity: wordOpacity },
        ]}
      >
        {entry.word}
      </Animated.Text>
    );
  }

  const isEnglishFace = isEnglishFront ? !isFlipped : isFlipped;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          onPressIn={() => setIsClosePressed(true)}
          onPressOut={() => setIsClosePressed(false)}
          style={[
            styles.closeButton,
            {
              borderColor: theme.colors.border,
              backgroundColor: isClosePressed
                ? theme.colors.bluePastel
                : theme.colors.surface,
            },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={[styles.back, { color: theme.colors.text }]}>x</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {vocabulary.length
            ? `${currentIndex + 1} / ${vocabulary.length}`
            : "Your vocabulary"}
        </Text>
        <TouchableOpacity
          style={[
            styles.gearIcon,
            {
              borderColor: theme.colors.border,
              backgroundColor:
                isGearPressed || isSettingsVisible
                  ? theme.colors.bluePastel
                  : theme.colors.surface,
            },
          ]}
          onPress={() => {
            cancelAutoPlay();
            setIsSettingsVisible(true);
          }}
          onPressIn={() => setIsGearPressed(true)}
          onPressOut={() => setIsGearPressed(false)}
          activeOpacity={1}
          accessibilityRole="button"
          accessible
          accessibilityLabel="Settings"
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Loading vocabulary...
          </Text>
        ) : errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : !entry ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            No vocabulary to review yet.
          </Text>
        ) : (
          <>
            <View style={styles.progressFullBleed}>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.colors.border },
                ]}
                accessibilityRole="progressbar"
                accessibilityLabel="Flashcard progress"
                accessibilityValue={{
                  min: 0,
                  max: vocabulary.length,
                  now: currentIndex + 1,
                  text: `${currentIndex + 1} of ${vocabulary.length}`,
                }}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${((currentIndex + 1) / vocabulary.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressAccents}>
                <View
                  style={styles.progressAccentGroup}
                  accessible
                  accessibilityLabel={`Still learning: ${learningCount}`}
                >
                  <View
                    style={[
                      styles.progressSemicircle,
                      styles.progressSemicircleLeft,
                      { borderColor: theme.colors.orangeDark },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.progressSemicircleFill,
                        {
                          backgroundColor: theme.colors.orangeDark,
                          opacity: leftIncrementOpacity,
                        },
                      ]}
                    />
                  </View>
                  <Animated.Text
                    style={[
                      styles.progressCount,
                      {
                        color: theme.colors.orangeDark,
                        opacity: learningCountOpacity,
                      },
                    ]}
                  >
                    {learningCount}
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      styles.progressIncrement,
                      {
                        color: theme.colors.primaryText,
                        opacity: leftIncrementOpacity,
                      },
                    ]}
                  >
                    +1
                  </Animated.Text>
                </View>
                <View
                  style={styles.progressAccentGroup}
                  accessible
                  accessibilityLabel={`Learned: ${learnedCount}`}
                >
                  <View
                    style={[
                      styles.progressSemicircle,
                      styles.progressSemicircleRight,
                      { borderColor: theme.colors.primary },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.progressSemicircleFill,
                        {
                          backgroundColor: theme.colors.primary,
                          opacity: isAutoPlaying ? 0 : rightIncrementOpacity,
                        },
                      ]}
                    />
                  </View>
                  <Animated.Text
                    style={[
                      styles.progressCount,
                      {
                        color: theme.colors.primaryDark,
                        opacity: isAutoPlaying ? 1 : learnedCountOpacity,
                      },
                    ]}
                  >
                    {learnedCount}
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      styles.progressIncrement,
                      {
                        color: theme.colors.primaryText,
                        opacity: isAutoPlaying ? 0 : rightIncrementOpacity,
                      },
                    ]}
                  >
                    +1
                  </Animated.Text>
                </View>
              </View>
            </View>
            {isDeckComplete ? (
              <View
                style={[
                  styles.card,
                  styles.completionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityRole="summary"
                accessibilityLabel="Nice work! Now let's try some practice questions in Learn."
              >
                <Text
                  style={[
                    styles.completionTitle,
                    { color: theme.colors.primaryDark },
                  ]}
                >
                  Nice work!
                </Text>
                <Text
                  style={[
                    styles.completionMessage,
                    { color: theme.colors.text },
                  ]}
                >
                  Now let&apos;s try some practice questions in Learn.
                </Text>
              </View>
            ) : (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSwipingRight
                      ? theme.colors.primaryDark
                      : isSwipingLeft
                        ? theme.colors.orangeDark
                        : theme.colors.border,
                    transform: [
                      { perspective: 1000 },
                      { translateX: position.x },
                      { translateY: position.y },
                      { rotate: rotation },
                      { rotateY: cardRotation },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={flipCard}
                  style={styles.cardFaces}
                  accessibilityRole="button"
                  accessibilityLabel={`Flip ${entry.word} flashcard`}
                  accessibilityState={{ selected: isFlipped }}
                >
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      backgroundColor: theme.colors.surface,
                      opacity: frontFaceOpacity,
                    },
                  ]}
                >
                  {renderSpeakerButton()}
                  {renderFavoriteButton()}
                  <View style={styles.wordContainer}>
                    <View style={styles.swipeLabels}>
                      <Animated.Text
                        style={[
                          styles.knowLabel,
                          {
                            color: theme.colors.primaryDark,
                            opacity: knowOpacity,
                          },
                        ]}
                      >
                        Know
                      </Animated.Text>
                      <Animated.Text
                        style={[
                          styles.knowLabel,
                          {
                            color: theme.colors.orangeDark,
                            opacity: stillLearningOpacity,
                          },
                        ]}
                      >
                        Still Learning
                      </Animated.Text>
                    </View>
                    {isEnglishFront ? renderDefinitions() : renderWord()}
                  </View>
                </Animated.View>
                <Animated.View
                  style={[
                    styles.cardFace,
                    styles.cardFaceBack,
                    {
                      backgroundColor: theme.colors.surface,
                      opacity: backFaceOpacity,
                    },
                  ]}
                >
                  {renderSpeakerButton()}
                  {renderFavoriteButton()}
                  <View style={styles.swipeLabels}>
                    <Animated.Text
                      style={[
                        styles.knowLabel,
                        {
                          color: theme.colors.primaryDark,
                          opacity: knowOpacity,
                        },
                      ]}
                    >
                      Know
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.knowLabel,
                        {
                          color: theme.colors.orangeDark,
                          opacity: stillLearningOpacity,
                        },
                      ]}
                    >
                      Still Learning
                    </Animated.Text>
                  </View>
                  {isEnglishFront ? renderWord() : renderDefinitions()}
                </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            )}
            <View style={styles.cardNavigationButtons}>
              <TouchableOpacity
                style={[
                  styles.previousCardButton,
                  {
                    backgroundColor:
                      currentIndex === 0
                        ? theme.colors.border
                        : theme.colors.bluePastel,
                  },
                ]}
                onPress={() => showPrevCard(-1)}
                disabled={currentIndex === 0}
                accessibilityRole="button"
                accessibilityLabel="Go to previous card"
              >
                <MaterialCommunityIcons
                  name="arrow-u-left-top"
                  size={22}
                  color={
                    currentIndex === 0
                      ? theme.colors.textSecondary
                      : theme.colors.blueDark
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.autoPlayButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={toggleAutoPlay}
                accessibilityRole="button"
                accessibilityLabel={
                  isAutoPlaying
                    ? "Stop flashcard playback"
                    : "Play flashcards aloud"
                }
                accessibilityState={{ selected: isAutoPlaying }}
              >
                <MaterialCommunityIcons
                  name={isAutoPlaying ? "stop" : "play"}
                  size={24}
                  color={theme.colors.primaryText}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={isSettingsVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <View style={styles.settingsModal}>
          <Pressable
            style={styles.settingsBackdrop}
            onPress={() => setIsSettingsVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close settings panel"
          />
          <View
            style={[
              styles.settingsSheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.settingsHeader}>
              <Text
                style={[styles.settingsTitle, { color: theme.colors.text }]}
              >
                Options
              </Text>
              <TouchableOpacity
                style={[
                  styles.settingsCloseButton,
                  { backgroundColor: theme.colors.bluePastel },
                ]}
                onPress={() => setIsSettingsVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={theme.colors.blueDark}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.settingsSection}>
              <View
                style={[
                  styles.settingsGroup,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.settingsSectionTitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  General
                </Text>
                <View style={styles.settingsGroupDivider} />
                <View style={styles.settingsOption}>
                  <View style={styles.settingsOptionText}>
                    <Text
                      style={[
                        styles.settingsOptionTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      Shuffle cards
                    </Text>
                  </View>
                  <Switch
                    value={isShuffleEnabled}
                    onValueChange={handleShuffleChange}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor={theme.colors.surface}
                    accessibilityLabel="Shuffle cards"
                  />
                </View>
              </View>
              <View style={styles.settingsSection}>
                <View
                  style={[
                    styles.settingsGroup,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.settingsSectionTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Card orientation
                  </Text>
                  <View style={styles.settingsGroupDivider} />
                  <View style={styles.settingsOption}>
                    <View style={styles.settingsOptionText}>
                      <Text
                        style={[
                          styles.settingsOptionTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Front
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.orientationControl,
                        { backgroundColor: theme.colors.border },
                      ]}
                      onPress={() => handleFrontLanguageChange(!isEnglishFront)}
                      activeOpacity={0.9}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: isEnglishFront }}
                      accessibilityLabel="Front card language"
                    >
                      <View
                        style={[
                          styles.orientationSegment,
                          !isEnglishFront && {
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.orientationLabel,
                            {
                              color: isEnglishFront
                                ? theme.colors.textSecondary
                                : theme.colors.primaryText,
                            },
                          ]}
                        >
                          Chinese
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.orientationSegment,
                          isEnglishFront && {
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.orientationLabel,
                            {
                              color: isEnglishFront
                                ? theme.colors.primaryText
                                : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          English
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.restartButton,
                { borderColor: theme.colors.danger },
              ]}
              onPress={restartFlashcards}
              accessibilityRole="button"
              accessibilityLabel="Restart flashcards"
            >
              <Text
                style={[
                  styles.restartButtonText,
                  { color: theme.colors.danger },
                ]}
              >
                Restart Flashcards
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    width: 30,
    height: 30,
    fontSize: 20,
    textAlign: "center",
    textAlignVertical: "center",
  },
  title: { fontSize: 18, fontWeight: "900" },
  gearIcon: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsModal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  settingsSheet: {
    height: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  settingsHeader: {
    position: "relative",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  settingsSection: {
    marginTop: 28,
  },
  restartButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 14,
  },
  restartButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  settingsGroup: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsGroupDivider: {
    height: 1,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "rgba(128, 128, 128, 0.25)",
  },
  settingsOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsOptionText: {
    flex: 1,
    marginRight: 12,
  },
  orientationControl: {
    flexDirection: "row",
    alignItems: "center",
    width: 184,
    height: 48,
    padding: 4,
    borderRadius: 24,
  },
  orientationSegment: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  orientationLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  settingsOptionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  settingsOptionDescription: {
    marginTop: 4,
    fontSize: 12,
  },
  settingsCloseButton: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    overflow: "hidden",
  },
  progressFullBleed: {
    alignSelf: "stretch",
    marginHorizontal: -20,
    marginTop: 0,
  },
  progressFill: {
    height: "100%",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  progressAccents: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressAccentGroup: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCount: {
    position: "absolute",
    top: 5,
    right: 10,
    bottom: 0,
    left: 5,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
  },
  progressIncrement: {
    position: "absolute",
    top: 5,
    right: 10,
    bottom: 0,
    left: 5,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
  },
  progressSemicircle: {
    width: 40,
    height: 40,
    position: "absolute",
    overflow: "hidden",
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  progressSemicircleFill: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  progressSemicircleLeft: {
    marginLeft: -9,
    transform: [{ rotate: "270deg" }],
  },
  progressSemicircleRight: {
    marginRight: -9,
    transform: [{ rotate: "90deg" }],
  },
  card: {
    height: "80%",
    width: "100%",
    minHeight: 390,
    marginTop: 20,
    padding: 24,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#172033",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  completionCard: {
    paddingHorizontal: 32,
  },
  completionTitle: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  completionMessage: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
  },
  cardFaces: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardNavigationButtons: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginLeft: 20,
    marginRight: 4,
  },
  previousCardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  autoPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFace: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  speakerButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFaceBack: {
    transform: [{ rotateY: "180deg" }],
  },
  definitionContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHint: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 28,
  },
  wordContainer: { alignItems: "center" },
  swipeLabels: {
    height: 44,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  knowLabel: {
    position: "absolute",
    fontSize: 30,
    fontWeight: "900",
  },
  word: { fontSize: 56, fontWeight: "900", textAlign: "center" },
  pinyin: { color: "#087FB9", fontSize: 18, fontWeight: "700", marginTop: 12 },
  status: {
    marginTop: 28,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusText: { color: "#087FB9", fontSize: 12, fontWeight: "900" },
  details: { marginTop: 34, fontSize: 15, fontWeight: "800" },
  helper: { marginTop: 20, fontSize: 13, textAlign: "center" },
  message: { marginTop: 80, fontSize: 16, textAlign: "center" },
  error: { marginTop: 80, color: "#B42318", fontSize: 16, textAlign: "center" },
});
