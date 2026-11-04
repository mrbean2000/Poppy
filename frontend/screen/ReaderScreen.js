import { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Image,
  Switch,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AudioController from "../components/AudioController";
import VocabularyModal from "../components/VocabularyModal";
import { useTheme } from "../theme/ThemeContext";
import {
  getPassageById,
  getSegmentedPassageWithPinyinById,
  getStoryLike,
  updateStoryLike,
} from "../util/http";

export default function ReaderScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [selectedWord, setSelectedWord] = useState(null);
  const [passage, setPassage] = useState(null);
  const [segmentedPassage, setSegmentedPassage] = useState(null);
  const [isSegmented, setIsSegmented] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const { id, title, imageUrl, userId = 1 } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [paragraphLayout, setParagraphLayout] = useState(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [spokenWordIndex, setSpokenWordIndex] = useState(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [isAudioControllerVisible, setIsAudioControllerVisible] =
    useState(false);
  const speechSession = useRef(0);

  function openVocabularyModal(word) {
    setSelectedWord(word);
  }

  function closeVocabularyModal() {
    setSelectedWord(null);
  }

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
    setShowPinyin(value);

    if (value) {
      fetchSegementedPassageById(id);
    }
  }

  function speakWordAt(words, index, sessionId, rate = speechRate) {
    if (sessionId !== speechSession.current || index >= words.length) {
      if (sessionId === speechSession.current) {
        setIsReadingAloud(false);
        setSpokenWordIndex(null);
      }
      return;
    }

    setSpokenWordIndex(index);
    Speech.speak(words[index].word, {
      language: "zh-CN",
      rate,
      onDone: () => speakWordAt(words, index + 1, sessionId),
      onStopped: () => {
        if (sessionId === speechSession.current) {
          setIsReadingAloud(false);
          setSpokenWordIndex(null);
        }
      },
      onError: () => {
        if (sessionId === speechSession.current) {
          setIsReadingAloud(false);
          setSpokenWordIndex(null);
          setErrorMessage("Unable to read this passage aloud.");
        }
      },
    });
  }

  async function handleReadAloud() {
    if (isReadingAloud) {
      await pauseReadingAloud();
      return;
    }

    const words = segmentedPassage || (await fetchSegementedPassageById(id));
    if (!words?.length) return;

    speechSession.current += 1;
    setIsReadingAloud(true);
    speakWordAt(words, spokenWordIndex ?? 0, speechSession.current);
  }

  async function stopReadingAloud() {
    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(false);
    setSpokenWordIndex(null);
  }

  async function pauseReadingAloud() {
    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(false);
  }

  async function seekSpeech(offset) {
    const words = segmentedPassage || (await fetchSegementedPassageById(id));
    if (!words?.length) return;

    const currentIndex = spokenWordIndex ?? 0;
    const nextIndex = Math.max(
      0,
      Math.min(words.length - 1, currentIndex + offset),
    );

    speechSession.current += 1;
    await Speech.stop();
    setIsReadingAloud(true);
    speakWordAt(words, nextIndex, speechSession.current);
  }

  function getSpeechProgress() {
    if (!segmentedPassage?.length || spokenWordIndex === null) return 0;

    return ((spokenWordIndex + 1) / segmentedPassage.length) * 100;
  }

  function getSpeechTime() {
    if (!segmentedPassage?.length || spokenWordIndex === null) {
      return { elapsed: "0:00", remaining: "-0:00" };
    }

    const elapsedSeconds = Math.round(
      ((spokenWordIndex + 1) / segmentedPassage.length) * 600,
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
    if (!segmentedPassage?.length) return;

    const progressWidth = event.nativeEvent.locationX;
    const progressTarget = Math.max(0, Math.min(1, progressWidth));
    const targetIndex = Math.round(
      progressTarget * (segmentedPassage.length - 1),
    );

    seekSpeech(targetIndex - (spokenWordIndex ?? 0));
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

    if (!isReadingAloud || !segmentedPassage?.length) return;

    speechSession.current += 1;
    await Speech.stop();
    speakWordAt(
      segmentedPassage,
      spokenWordIndex ?? 0,
      speechSession.current,
      nextRate,
    );
  }

  async function fetchStoryLike(postId) {
    try {
      const likeData = await getStoryLike(postId);
      setIsLiked(Boolean(likeData.like));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleLikePress() {
    const nextLike = !isLiked;

    setIsLiked(nextLike);

    try {
      setIsUpdatingLike(true);
      const likeData = await updateStoryLike(id, nextLike);
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
    fetchStoryLike(id);
  }, [id]);

  useEffect(() => {
    return () => {
      speechSession.current += 1;
      Speech.stop();
    };
  }, []);

  return (
    <SafeAreaView
      style={[
        selectedWord === null ? styles.container : styles.containerGrey,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title?.length > 23 ? `${title.slice(0, 23)}...` : title}
        </Text>
        <TouchableOpacity
          onPress={handleLikePress}
          disabled={isUpdatingLike}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? "Unlike story" : "Like story"}
        >
          <Text style={[styles.bookmark, isLiked && styles.bookmarkLiked]}>
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
          onPress={() => setIsAudioControllerVisible((isVisible) => !isVisible)}
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
          <View style={styles.modeButtonsGroup}>
            <TouchableOpacity
              style={[
                styles.textModeButton,
                !isSegmented && styles.textModeButtonActive,
              ]}
              onPress={() => {
                fetchPassageById(id);
                setIsSegmented(false);
              }}
            >
              <Text
                style={[
                  styles.textModeLabel,
                  !isSegmented && styles.textModeLabelActive,
                ]}
              >
                Original
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.textModeButton,
                isSegmented && styles.textModeButtonActive,
              ]}
              onPress={() => {
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
                ]}
              >
                Learning Mode
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pinyinToggle}>
            <Text style={styles.textModeLabelPinyin}>Pinyin</Text>
            <Switch
              value={showPinyin}
              onValueChange={handlePinyinToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.greenPastel,
              }}
              thumbColor={
                showPinyin ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </View>
        </View>

        <View
          style={styles.paragraphContainer}
          onLayout={(event) => setParagraphLayout(event.nativeEvent.layout)}
        >
          <View style={styles.wordRow}>
            {(isSegmented || showPinyin || isReadingAloud) &&
            segmentedPassage ? (
              segmentedPassage.map((entry, index) => (
                <TouchableOpacity
                  key={`${entry.word}-${index}`}
                  style={[
                    styles.wordWithPinyin,
                    entry.statusLevel &&
                      styles[`wordStatus${entry.statusLevel}`],
                    spokenWordIndex === index && styles.spokenWord,
                  ]}
                  onPress={() => openVocabularyModal(entry.word)}
                  disabled={!isSegmented}
                >
                  {showPinyin && (
                    <Text style={styles.pinyinText}>{entry.pinyin}</Text>
                  )}
                  <Text
                    style={[styles.normalText, { color: theme.colors.text }]}
                  >
                    {entry.word}
                  </Text>
                </TouchableOpacity>
              ))
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
        />
      )}
      {selectedWord && (
        <VocabularyModal
          word={selectedWord}
          userId={userId}
          onClose={closeVocabularyModal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  containerGrey: {
    flex: 1,
    backgroundColor: "#fcfafa10",
  },

  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },

  modeButtonsGroup: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#4e6174",
  },

  textModeButton: {
    minWidth: 105,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 10,
  },

  textModeButtonActive: {
    backgroundColor: "#FFFFFF",
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
    borderColor: "#000000",
    backgroundColor: "#F4FAFD",
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
    color: "#087FB9",
  },

  textModeLabelDisabled: {
    color: "#FFFFFF",
  },

  textModeLabelPinyin: {
    color: "#087FB9",
    fontSize: 13,
    fontWeight: "800",
  },

  wordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
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
