import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Image,
  ImageBackground,
  Switch,
} from "react-native";
import * as Speech from "expo-speech";
import { setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AudioController from "../components/AudioController";
import VocabularyModal from "../components/VocabularyModal";
import { useTheme } from "../theme/ThemeContext";
import {
  getPassageById,
  getSegmentedPassageWithPinyinById,
  getStoryLike,
  updateStoryLike,
  updateLastReadPassage,
  recordPassageCompletion,
} from "../util/http";

// Memoized so opening the modal doesn't re-render every word of the passage.
const WordToken = memo(function WordToken({
  entry,
  isSpoken,
  showPinyin,
  isSegmented,
  textColor,
  onWordPress,
  index,
  onLayoutY,
}) {
  return (
    <TouchableOpacity
      onLayout={(event) => onLayoutY(index, event.nativeEvent.layout.y)}
      style={[
        styles.wordWithPinyin,
        entry.statusLevel && styles[`wordStatus${entry.statusLevel}`],
        isSpoken && styles.spokenWord,
      ]}
      onPress={() => onWordPress(entry.word)}
      disabled={!isSegmented}
    >
      {showPinyin && <Text style={styles.pinyinText}>{entry.pinyin}</Text>}
      <Text style={[styles.normalText, { color: textColor }]}>
        {entry.word}
      </Text>
    </TouchableOpacity>
  );
});

export default function ReaderScreen({ navigation, route }) {
  const { theme, isDarkMode, backendUserId } = useTheme();
  const [selectedWord, setSelectedWord] = useState(null);
  const [passage, setPassage] = useState(null);
  const [segmentedPassage, setSegmentedPassage] = useState(null);
  const [isSegmented, setIsSegmented] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const { id, title, imageUrl, userId: routeUserId = 1 } = route.params;
  const userId = backendUserId ?? routeUserId;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [paragraphLayout, setParagraphLayout] = useState(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [spokenSentenceIndex, setSpokenSentenceIndex] = useState(null);
  // Non-whitespace character position of the word being spoken; null until the
  // platform reports word boundaries (then sentence highlighting is the fallback).
  const [spokenCharPos, setSpokenCharPos] = useState(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [isAudioControllerVisible, setIsAudioControllerVisible] =
    useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const speechSession = useRef(0);
  const scrollViewRef = useRef(null);
  const wordLayoutY = useRef({});
  const lastScrolledWord = useRef(null);

  const handleWordLayout = useCallback((index, y) => {
    wordLayoutY.current[index] = y;
  }, []);

  useEffect(() => {
    if (!isReadingAloud) lastScrolledWord.current = null;
    if (!isReadingAloud || !isAutoScrollEnabled || !segmentedPassage) return;
    if (!paragraphLayout) return;

    let spokenIndex = -1;
    if (spokenCharPos !== null) {
      let consumed = 0;
      spokenIndex = segmentedPassage.findIndex((entry) => {
        consumed += entry.word.replace(/\s/g, "").length;
        return consumed > spokenCharPos;
      });
    } else if (spokenSentenceIndex !== null) {
      spokenIndex = getWordSentenceIndexes().indexOf(spokenSentenceIndex);
    }

    const wordY = wordLayoutY.current[spokenIndex];
    if (wordY === undefined || lastScrolledWord.current === spokenIndex) return;
    lastScrolledWord.current = spokenIndex;

    // Keep the spoken word about a third of the way down the viewport.
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, paragraphLayout.y + wordY - scrollViewHeight / 3),
      animated: true,
    });
  }, [spokenCharPos, spokenSentenceIndex, isReadingAloud, isAutoScrollEnabled]);
  const speechVoice = useRef(undefined);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const chineseVoices = voices.filter((voice) =>
          /^zh[-_]cn$/i.test(voice.language),
        );
        // Enhanced/Premium voices sound far more natural than the default one.
        const rank = (voice) =>
          voice.quality === Speech.VoiceQuality.Enhanced ? 1 : 0;
        chineseVoices.sort((a, b) => rank(b) - rank(a));
        speechVoice.current = chineseVoices[0]?.identifier;
      })
      .catch(() => {});
  }, []);
  const passageRef = useRef("");
  const modeAnim = useRef(new Animated.Value(0)).current;
  const [modeLayouts, setModeLayouts] = useState({});

  useEffect(() => {
    Animated.spring(modeAnim, {
      toValue: isSegmented ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
  }, [isSegmented, modeAnim]);

  const openVocabularyModal = useCallback((word) => {
    setSelectedWord(word);
  }, []);

  const closeVocabularyModal = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleWordLookedUp = useCallback((word, statusLevel) => {
    if (!statusLevel) return;
    setSegmentedPassage((current) =>
      current?.some((entry) => entry.word === word && !entry.statusLevel)
        ? current.map((entry) =>
            entry.word === word && !entry.statusLevel
              ? { ...entry, statusLevel }
              : entry,
          )
        : current,
    );
  }, []);

  function handleScroll(event) {
    if (!paragraphLayout || !scrollViewHeight) return;

    const scrollOffset = event.nativeEvent.contentOffset.y;
    const scrollableParagraphHeight = paragraphLayout.height - scrollViewHeight;

    if (scrollableParagraphHeight <= 0) {
      setReadingProgress(1);
      return;
    }

    const paragraphProgress =
      (scrollOffset - paragraphLayout.y) / scrollableParagraphHeight;
    setReadingProgress(Math.max(0, Math.min(1, paragraphProgress)));
  }

  async function fetchPassageById(id) {
    if (passage) return;

    try {
      setIsLoading(true);
      const fetchedPassage = await getPassageById(id);
      setPassage(fetchedPassage.passage);
      setSegmentedPassage(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSegementedPassageById(id) {
    if (segmentedPassage) return segmentedPassage;

    try {
      setIsLoading(true);

      const fetchedSegmented = await getSegmentedPassageWithPinyinById(
        id,
        userId,
      );

      setSegmentedPassage(fetchedSegmented);
      return fetchedSegmented;
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handlePinyinToggle(value) {
    Haptics.selectionAsync().catch(() => {});
    setShowPinyin(value);

    if (value) {
      fetchSegementedPassageById(id);
    }
  }

  function splitIntoSentences(text) {
    return (text?.match(/[^。！？!?\n]+[。！？!?]*/g) || []).filter((sentence) =>
      sentence.trim(),
    );
  }

  async function getSentences() {
    let text = passage;
    if (!text) {
      try {
        text = (await getPassageById(id)).passage;
        setPassage(text);
      } catch (error) {
        setErrorMessage(error.message);
        return [];
      }
    }
    passageRef.current = text;
    return getSentenceRanges(text);
  }

  function getSentenceRanges(text) {
    return [...(text || "").matchAll(/[^。！？!?\n]+[。！？!?]*/g)]
      .filter((match) => match[0].trim())
      .map((match) => ({ start: match.index, end: match.index + match[0].length }));
  }

  // The passage is spoken as one continuous utterance so there are no gaps
  // between sentences. It is only chunked when it exceeds the platform limit.
  function speakSentenceAt(sentences, index, sessionId, rate = speechRate) {
    if (sessionId !== speechSession.current || index >= sentences.length) {
      if (sessionId === speechSession.current) {
        setIsReadingAloud(false);
        setSpokenSentenceIndex(null);
        setSpokenCharPos(null);
      }
      return;
    }

    const maxChunkLength = 3900;
    const chunkStart = sentences[index].start;
    let endIndex = index;
    while (
      endIndex + 1 < sentences.length &&
      sentences[endIndex + 1].end - chunkStart <= maxChunkLength
    ) {
      endIndex += 1;
    }
    const chunkText = passageRef.current.slice(
      chunkStart,
      sentences[endIndex].end,
    );

    setSpokenSentenceIndex(index);
    setSpokenCharPos(null);
    Speech.speak(chunkText, {
      language: "zh-CN",
      voice: speechVoice.current,
      pitch: 1,
      rate,
      // Boundary events are only emitted on some platforms (iOS).
      onBoundary: ({ charIndex }) => {
        if (sessionId !== speechSession.current) return;
        const position = chunkStart + charIndex;
        setSpokenCharPos(
          passageRef.current.slice(0, position).replace(/\s/g, "").length,
        );
        let current = index;
        while (
          current < endIndex &&
          sentences[current + 1].start <= position
        ) {
          current += 1;
        }
        setSpokenSentenceIndex(current);
      },
      onDone: () => speakSentenceAt(sentences, endIndex + 1, sessionId, rate),
      onStopped: () => {
        if (sessionId === speechSession.current) {
          setIsReadingAloud(false);
        }
      },
      onError: () => {
        if (sessionId === speechSession.current) {
          setIsReadingAloud(false);
          setSpokenSentenceIndex(null);
          setSpokenCharPos(null);
          setErrorMessage("Unable to read this passage aloud.");
        }
      },
    });
  }

  // Maps each segmented word to the sentence containing it by counting
  // non-whitespace characters, so the spoken sentence can be highlighted.
  function getWordSentenceIndexes() {
    if (!segmentedPassage || !passage) return [];

    const sentenceEnds = [];
    let total = 0;
    splitIntoSentences(passage).forEach((sentence) => {
      total += sentence.replace(/\s/g, "").length;
      sentenceEnds.push(total);
    });

    let consumed = 0;
    let sentenceIndex = 0;
    return segmentedPassage.map((entry) => {
      const index = sentenceIndex;
      consumed += entry.word.replace(/\s/g, "").length;
      while (
        sentenceIndex < sentenceEnds.length - 1 &&
        consumed >= sentenceEnds[sentenceIndex]
      ) {
        sentenceIndex += 1;
      }
      return index;
    });
  }

  async function handleReadAloud() {
    if (isReadingAloud) {
      await pauseReadingAloud();
      return;
    }

    const sentences = await getSentences();
    if (!sentences.length) return;

    setIsSegmented(true);
    fetchSegementedPassageById(id);

    // iOS mutes speech when the silent switch is on unless this is enabled
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

    speechSession.current += 1;
    setIsReadingAloud(true);
    speakSentenceAt(sentences, spokenSentenceIndex ?? 0, speechSession.current);
  }

  async function stopReadingAloud() {
    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(false);
    setSpokenSentenceIndex(null);
    setSpokenCharPos(null);
  }

  async function pauseReadingAloud() {
    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(false);
  }

  async function seekSpeech(offset) {
    const sentences = await getSentences();
    if (!sentences.length) return;

    const currentIndex = spokenSentenceIndex ?? 0;
    const nextIndex = Math.max(
      0,
      Math.min(sentences.length - 1, currentIndex + offset),
    );

    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(true);
    speakSentenceAt(sentences, nextIndex, speechSession.current);
  }

  function getSpeechProgress() {
    const count = splitIntoSentences(passage).length;
    if (!count || spokenSentenceIndex === null) return 0;

    return ((spokenSentenceIndex + 1) / count) * 100;
  }

  function getSpeechTime() {
    const count = splitIntoSentences(passage).length;
    if (!count || spokenSentenceIndex === null) {
      return { elapsed: "0:00", remaining: "-0:00" };
    }

    const elapsedSeconds = Math.round(
      ((spokenSentenceIndex + 1) / count) * 600,
    );
    const remainingSeconds = Math.max(0, 600 - elapsedSeconds);

    const formatTime = (seconds) =>
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

    return {
      elapsed: formatTime(elapsedSeconds),
      remaining: `-${formatTime(remainingSeconds)}`,
    };
  }

  function handleSpeechProgressPress(event) {
    const count = splitIntoSentences(passage).length;
    if (!count) return;

    const progressWidth = event.nativeEvent.locationX;
    const progressTarget = Math.max(0, Math.min(1, progressWidth));
    const targetIndex = Math.round(progressTarget * (count - 1));

    seekSpeech(targetIndex - (spokenSentenceIndex ?? 0));
  }

  function handleSpeechPlayPress() {
    handleReadAloud();
  }

  function handleSpeechSkip(offset) {
    seekSpeech(offset);
  }

  function handleSpeechRatePress() {
    const speechRates = [0.5, 0.75, 1, 1.25, 1.5];
    const currentRateIndex = speechRates.indexOf(speechRate);
    const nextRate = speechRates[(currentRateIndex + 1) % speechRates.length];

    handleSpeechRateSelect(nextRate);
  }

  async function handleSpeechRateSelect(nextRate) {
    setSpeechRate(nextRate);

    if (!isReadingAloud || !passage) return;

    const sentences = getSentenceRanges(passage);
    speechSession.current += 1;
    await Speech.stop();
    speakSentenceAt(
      sentences,
      spokenSentenceIndex ?? 0,
      speechSession.current,
      nextRate,
    );
  }

  async function fetchStoryLike(likeUserId, postId) {
    try {
      const likeData = await getStoryLike(likeUserId, postId);
      setIsLiked(Boolean(likeData.like));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleLikePress() {
    const nextLike = !isLiked;
    const likeUserId = backendUserId ?? userId;

    setIsLiked(nextLike);

    try {
      setIsUpdatingLike(true);
      const likeData = await updateStoryLike(likeUserId, id, nextLike);
      setIsLiked(Boolean(likeData.like));
    } catch (error) {
      setIsLiked(!nextLike);
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingLike(false);
    }
  }

  useEffect(() => {
    fetchPassageById(id);
  }, [id]);

  useEffect(() => {
    const likeUserId = backendUserId ?? userId;
    if (!likeUserId) return;
    fetchStoryLike(likeUserId, id);
  }, [id, backendUserId, userId]);

  useEffect(() => {
    const progressUserId = backendUserId ?? userId;
    if (!progressUserId) return;
    updateLastReadPassage(progressUserId, id).catch(() => {});
  }, [id, backendUserId, userId]);

  // One completion per visit; reopening the passage allows another.
  const completionRecorded = useRef(false);

  useEffect(() => {
    completionRecorded.current = false;
  }, [id]);

  useEffect(() => {
    const completionUserId = backendUserId ?? userId;
    if (readingProgress < 1 || !passage || !completionUserId) return;
    if (completionRecorded.current) return;

    completionRecorded.current = true;
    recordPassageCompletion(completionUserId, id).catch(() => {
      completionRecorded.current = false;
    });
  }, [readingProgress, passage, id, backendUserId, userId]);

  useEffect(() => {
    return () => {
      speechSession.current += 1;
      Speech.stop();
    };
  }, []);

  return (
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
        style={[
          selectedWord === null ? styles.container : styles.containerGrey,
          { backgroundColor: "transparent" },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            onPress={
              title?.length > 16
                ? () => setIsTitleExpanded((expanded) => !expanded)
                : undefined
            }
            accessibilityRole={title?.length > 16 ? "button" : undefined}
            accessibilityLabel={title}
          >
            {title?.length > 16 && !isTitleExpanded
              ? `${title.slice(0, 16)}...`
              : title}
          </Text>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={handleLikePress}
            disabled={isUpdatingLike}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? "Unlike story" : "Like story"}
          >
            <Text
              style={[
                styles.bookmark,
                { color: theme.colors.text },
                isLiked && styles.bookmarkLiked,
              ]}
            >
              {isLiked ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${readingProgress * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(readingProgress * 100)}%
          </Text>
          <TouchableOpacity
            style={styles.audioToggleButton}
            onPress={() =>
              setIsAudioControllerVisible((isVisible) => !isVisible)
            }
            accessibilityRole="button"
            accessibilityLabel={
              isAudioControllerVisible
                ? "Hide reading controls"
                : "Show reading controls"
            }
            accessibilityState={{ expanded: isAudioControllerVisible }}
          >
            <MaterialCommunityIcons
              name="headphones"
              size={20}
              color={isAudioControllerVisible ? "#1766B1" : "#64748B"}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          alwaysBounceVertical={true}
          onLayout={(event) =>
            setScrollViewHeight(event.nativeEvent.layout.height)
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroImage}>
            <Image
              source={
                imageUrl
                  ? { uri: imageUrl }
                  : require("../assets/images/masot/poppy_raincoat.jpeg")
              }
              style={imageUrl ? styles.storyImage : styles.avatarImage}
            />
          </View>

          <View style={styles.textModeControl}>
            <View
              style={[
                styles.modeButtonsGroup,
                !isDarkMode && { backgroundColor: theme.colors.surface },
              ]}
            >
              {modeLayouts.original && modeLayouts.learning && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.modeIndicator,
                    {
                      left: modeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          modeLayouts.original.x,
                          modeLayouts.learning.x,
                        ],
                      }),
                      width: modeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          modeLayouts.original.width,
                          modeLayouts.learning.width,
                        ],
                      }),
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={[
                  styles.textModeButton,
                  !modeLayouts.original &&
                    !isSegmented &&
                    styles.textModeButtonActive,
                ]}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setModeLayouts((current) => ({
                    ...current,
                    original: { x, width },
                  }));
                }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  fetchPassageById(id);
                  setIsSegmented(false);
                }}
              >
                <Text
                  style={[
                    styles.textModeLabel,
                    !isSegmented && styles.textModeLabelActive,
                    !isDarkMode && { color: theme.colors.text },
                  ]}
                >
                  Original
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.textModeButton,
                  !modeLayouts.learning &&
                    isSegmented &&
                    styles.textModeButtonActive,
                ]}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setModeLayouts((current) => ({
                    ...current,
                    learning: { x, width },
                  }));
                }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  fetchSegementedPassageById(id);
                  setIsSegmented(true);
                }}
                // onPress={() => segmentedPassage && setIsSegmented(true)}
                disabled={isSegmented}
              >
                <Text
                  style={[
                    styles.textModeLabel,
                    isSegmented && styles.textModeLabelActive,
                    !segmentedPassage && styles.textModeLabelDisabled,
                    !isDarkMode && { color: theme.colors.text },
                  ]}
                >
                  Learning Mode
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.pinyinToggle,
                !isDarkMode && {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.textModeLabelPinyin,
                  !isDarkMode && { color: theme.colors.text },
                ]}
              >
                Pinyin
              </Text>
              <Switch
                value={showPinyin}
                onValueChange={handlePinyinToggle}
                trackColor={{
                  false: isDarkMode ? "#4E6159" : theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View
            style={styles.paragraphContainer}
            onLayout={(event) => setParagraphLayout(event.nativeEvent.layout)}
          >
            <View
              style={[
                styles.wordRow,
                { backgroundColor: isDarkMode ? "#000000" : "#FFF4E6" },
              ]}
            >
              {(isSegmented || showPinyin || isReadingAloud) &&
              segmentedPassage ? (
                (() => {
                  const wordSentenceIndexes = getWordSentenceIndexes();
                  let consumed = 0;
                  return segmentedPassage.map((entry, index) => {
                    const wordStart = consumed;
                    consumed += entry.word.replace(/\s/g, "").length;
                    if (entry.word === "\n") {
                      return (
                        <View
                          key={`break-${index}`}
                          style={{ width: "100%", height: 14 }}
                        />
                      );
                    }
                    const isSpoken =
                      spokenCharPos !== null
                        ? spokenCharPos >= wordStart && spokenCharPos < consumed
                        : spokenSentenceIndex !== null &&
                          wordSentenceIndexes[index] === spokenSentenceIndex;
                    return (
                      <WordToken
                        key={`${entry.word}-${index}`}
                        entry={entry}
                        isSpoken={isSpoken}
                        showPinyin={showPinyin}
                        isSegmented={isSegmented}
                        textColor={theme.colors.text}
                        onWordPress={openVocabularyModal}
                        index={index}
                        onLayoutY={handleWordLayout}
                      />
                    );
                  });
                })()
              ) : (
                <Text style={[styles.normalText, { color: theme.colors.text }]}>
                  {passage || "Loading..."}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
        {isAudioControllerVisible && (
          <AudioController
            isReadingAloud={isReadingAloud}
            speechRate={speechRate}
            theme={theme}
            onSkip={handleSpeechSkip}
            onPlayPress={handleSpeechPlayPress}
            onRatePress={handleSpeechRatePress}
            isAutoScrollEnabled={isAutoScrollEnabled}
            onAutoScrollToggle={() => {
              lastScrolledWord.current = null;
              setIsAutoScrollEnabled((enabled) => !enabled);
            }}
          />
        )}
        {selectedWord && (
          <VocabularyModal
            word={selectedWord}
            userId={userId}
            onClose={closeVocabularyModal}
            onLookup={handleWordLookedUp}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  containerGrey: {
    flex: 1,
    backgroundColor: "#fcfafa10",
  },

  header: {
    minHeight: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 48,
    height: 48,
    marginLeft: -12,
    justifyContent: "center",
    alignItems: "center",
  },

  likeButton: {
    width: 48,
    height: 48,
    marginRight: -12,
    justifyContent: "center",
    alignItems: "center",
  },

  back: {
    fontSize: 32,
    color: "#172033",
  },
  title: {
    flex: 1,
    marginHorizontal: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: "#172033",
  },
  bookmark: {
    fontSize: 25,
    color: "#172033",
  },
  bookmarkLiked: {
    color: "#FF4F81",
  },
  progressContainer: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  progressText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  audioToggleButton: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#E7EEF8",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },

  heroImage: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 10,

    resizeMode: "cover",
  },

  paragraphContainer: {
    gap: 13,
  },

  textModeControl: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },

  modeButtonsGroup: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#1E2925",
  },

  textModeButton: {
    minWidth: 105,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  textModeButtonActive: {
    backgroundColor: "#F6C945",
    shadowColor: "#172033",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  modeIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 10,
    backgroundColor: "#F6C945",
    shadowColor: "#172033",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  pinyinToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 6,
    paddingTop: 9,
    paddingBottom: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1E2925",
    backgroundColor: "#1E2925",
    gap: 4,
  },

  speechProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#B7BFCC",
    position: "relative",
  },

  speechProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#1766B1",
  },

  speechProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  speechTimeLabel: {
    minWidth: 34,
    color: "#4B5563",
    fontSize: 11,
    fontWeight: "500",
  },

  speechProgressThumb: {
    position: "absolute",
    top: -5,
    width: 13,
    height: 13,
    marginLeft: -6,
    borderRadius: 7,
    backgroundColor: "#1766B1",
  },

  textModeLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  textModeLabelActive: {
    color: "#1E2925",
  },

  textModeLabelDisabled: {
    color: "#FFFFFF",
  },

  textModeLabelPinyin: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  wordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    borderRadius: 16,
    padding: 14,
    paddingBottom: 22,
    marginHorizontal: -12,
  },

  wordWithPinyin: {
    alignItems: "center",
    marginRight: 5,
    marginBottom: 8,
  },

  spokenWord: {
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: "#BEE7F7",
  },

  wordStatus1: {
    backgroundColor: "#44be0f",
    color: "#087FB9",
    borderRadius: 10,
  },

  wordStatus2: {
    backgroundColor: "#0d6ec9",
    color: "#087FB9",
    borderRadius: 10,
  },

  wordStatus3: {
    backgroundColor: "#7b52a4",
    color: "#087FB9",
    borderRadius: 10,
  },

  wordStatus4: {
    backgroundColor: "#ca24ae",
    color: "#087FB9",
    borderRadius: 10,
  },

  pinyinText: {
    minHeight: 18,
    color: "#087FB9",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },

  normalText: {
    fontSize: 19,
    lineHeight: 32,
    color: "#172033",
  },
});
