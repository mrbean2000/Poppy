import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  AppState,
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
import { useFocusEffect } from "@react-navigation/native";
import AudioController from "../components/AudioController";
import VocabularyModal from "../components/VocabularyModal";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { recordRecentArticle } from "../util/recentHistory";
import { saveArticleProgress } from "../util/articleProgress";
import {
  getPassageById,
  getUserSettings,
  getSegmentedPassageWithPinyinById,
  getSegementedPassageWithFuriganaById,
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
  const { theme, isDarkMode, backendUserId, isThemeLoading } = useTheme();
  const { user } = useAuth();
  const [selectedWord, setSelectedWord] = useState(null);
  const [passage, setPassage] = useState(null);
  const [loadedLanguage, setLoadedLanguage] = useState(null);
  const [segmentedPassage, setSegmentedPassage] = useState(null);
  const [isSegmented, setIsSegmented] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const { id, title, imageUrl, userId: routeUserId = 1 } = route.params;
  const { readingLanguage, readingLanguageId } = route.params;
  const userId = backendUserId ?? routeUserId;
  const settingsUserId = backendUserId ?? route.params?.userId;
  const targetLanguage =
    loadedLanguage?.id === id && loadedLanguage.userId === settingsUserId
      ? loadedLanguage.language
      : null;
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [likeLoadError, setLikeLoadError] = useState(false);
  const [likeRetry, setLikeRetry] = useState(0);
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
  const segmentationRequestRef = useRef(0);
  const likeRequestRef = useRef(0);
  const scrollViewRef = useRef(null);
  const wordLayoutY = useRef({});
  const lastScrolledWord = useRef(null);
  const articleProgressRef = useRef(null);

  const flushArticleProgress = useCallback((pending) => {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.timer = null;
    saveArticleProgress(
      pending.userId,
      pending.languageId,
      pending.articleId,
      pending.progress,
    ).catch((error) => {
      Alert.alert("Reading progress", error.message);
    });
  }, []);

  useEffect(() => {
    if (!user?.uid || !targetLanguage || !passage) return undefined;
    const pending = {
      userId: user.uid,
      languageId: loadedLanguage.languageId,
      articleId: id,
      progress: 0,
      timer: null,
    };
    articleProgressRef.current = pending;
    pending.timer = setTimeout(() => flushArticleProgress(pending), 800);
    return () => {
      flushArticleProgress(pending);
      if (articleProgressRef.current === pending) articleProgressRef.current = null;
    };
  }, [user?.uid, id, targetLanguage, loadedLanguage?.languageId, passage, flushArticleProgress]);

  useFocusEffect(
    useCallback(() => () => {
      flushArticleProgress(articleProgressRef.current);
    }, [flushArticleProgress]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flushArticleProgress(articleProgressRef.current);
    });
    return () => subscription.remove();
  }, [flushArticleProgress]);

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
    if (!paragraphLayout || paragraphLayout.height <= 0 || !scrollViewHeight) return;

    const scrollOffset = event.nativeEvent.contentOffset.y;
    const scrollableParagraphHeight = paragraphLayout.height - scrollViewHeight;
    const paragraphProgress =
      scrollableParagraphHeight <= 0
        ? (scrollOffset + scrollViewHeight - paragraphLayout.y) / paragraphLayout.height
        : (scrollOffset - paragraphLayout.y) / scrollableParagraphHeight;
    const progress = Math.max(0, Math.min(1, paragraphProgress));
    setReadingProgress(progress);

    const pending = articleProgressRef.current;
    if (
      pending &&
      pending.articleId === id &&
      pending.userId === user?.uid &&
      pending.languageId === loadedLanguage?.languageId &&
      progress > pending.progress
    ) {
      pending.progress = progress;
      clearTimeout(pending.timer);
      pending.timer = setTimeout(() => flushArticleProgress(pending), 800);
    }
  }

  async function fetchPassageById(id) {
    if (passage) return;

    try {
      setIsLoading(true);
      if (!targetLanguage) throw new Error("Target language is not available.");
      const fetchedPassage = await getPassageById(id, targetLanguage);
      setPassage(fetchedPassage.passage);
      setSegmentedPassage(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSegementedPassageById(id) {
    if (!targetLanguage) return;
    if (segmentedPassage) return segmentedPassage;

    const requestId = ++segmentationRequestRef.current;
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const fetchedSegmented =
        targetLanguage === "Japanese"
          ? await getSegementedPassageWithFuriganaById(id, userId)
          : await getSegmentedPassageWithPinyinById(id, userId);

      if (requestId === segmentationRequestRef.current) {
        setSegmentedPassage(fetchedSegmented);
      }
      return fetchedSegmented;
    } catch (error) {
      if (requestId === segmentationRequestRef.current) {
        setErrorMessage(error.message);
        if (targetLanguage === "Japanese") {
          setShowPinyin(false);
          setIsSegmented(false);
        }
      }
    } finally {
      if (requestId === segmentationRequestRef.current) {
        setIsLoading(false);
      }
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
    return (text?.match(/[^。！？!?\n]+[。！？!?]*/g) || []).filter(
      (sentence) => sentence.trim(),
    );
  }

  async function getSentences() {
    if (!targetLanguage) return [];
    let text = passage;
    if (!text) {
      try {
        if (!targetLanguage)
          throw new Error("Target language is not available.");
        text = (await getPassageById(id, targetLanguage)).passage;
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
      .map((match) => ({
        start: match.index,
        end: match.index + match[0].length,
      }));
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
      language:
        targetLanguage === "Japanese"
          ? "ja-JP"
          : targetLanguage === "Korean"
            ? "ko-KR"
            : "zh-CN",
      voice: targetLanguage === "Chinese" ? speechVoice.current : undefined,
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
        while (current < endIndex && sentences[current + 1].start <= position) {
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

    if (targetLanguage === "Chinese") {
      setIsSegmented(true);
      fetchSegementedPassageById(id);
    }

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

  async function handleLikePress() {
    const nextLike = !isLiked;
    const likeUserId = backendUserId ?? userId;
    const requestId = likeRequestRef.current;

    setIsLiked(nextLike);

    try {
      setIsUpdatingLike(true);
      const likeData = await updateStoryLike(
        likeUserId,
        id,
        nextLike,
        targetLanguage,
      );
      if (requestId === likeRequestRef.current)
        setIsLiked(Boolean(likeData.like));
    } catch (error) {
      if (requestId === likeRequestRef.current) {
        setIsLiked(!nextLike);
        setErrorMessage(error.message);
      }
    } finally {
      if (requestId === likeRequestRef.current) setIsUpdatingLike(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadPassage() {
      setLoadedLanguage(null);
      setPassage(null);
      setSegmentedPassage(null);
      setIsSegmented(false);
      setShowPinyin(false);
      setIsLiked(false);
      setReadingProgress(0);
      setErrorMessage(null);
      setIsLoading(true);

      try {
        if (!settingsUserId) {
          if (isThemeLoading) return;
          throw new Error(
            "Unable to load your target language without a user profile.",
          );
        }
        const settings = await getUserSettings(settingsUserId);
        const selectedLanguage = readingLanguage ?? settings?.targetlanguage ?? "";
        const languageId = readingLanguageId ?? settings?.targetlanguageid;
        let language;
        if (/japanese/i.test(selectedLanguage)) {
          language = "Japanese";
        } else if (/korean/i.test(selectedLanguage)) {
          language = "Korean";
        } else if (/chinese|mandarin/i.test(selectedLanguage)) {
          language = "Chinese";
        } else {
          throw new Error(
            "Reading passages is only available for Chinese, Japanese and Korean.",
          );
        }
        if (
          !Number.isInteger(languageId) ||
          languageId <= 0
        ) {
          throw new Error("Your target language does not have a valid ID.");
        }
        const fetchedPassage = await getPassageById(id, language);
        if (!isCurrent) return;
        setLoadedLanguage({
          id,
          userId: settingsUserId,
          language,
          languageId,
        });
        setPassage(fetchedPassage.passage);
      } catch (error) {
        if (isCurrent) setErrorMessage(error.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadPassage();
    return () => {
      isCurrent = false;
      segmentationRequestRef.current += 1;
    };
  }, [id, settingsUserId, isThemeLoading, readingLanguage, readingLanguageId]);

  useEffect(() => {
    const likeUserId = backendUserId ?? userId;
    const requestId = ++likeRequestRef.current;
    setIsUpdatingLike(false);
    setIsLiked(false);
    setLikeLoadError(false);
    if (!likeUserId || !targetLanguage) {
      setIsLoadingLike(false);
      return;
    }
    setIsLoadingLike(true);
    getStoryLike(likeUserId, id, targetLanguage)
      .then((likeData) => {
        if (requestId === likeRequestRef.current)
          setIsLiked(Boolean(likeData.like));
      })
      .catch((error) => {
        if (requestId === likeRequestRef.current) {
          setLikeLoadError(true);
          setErrorMessage(error.message);
        }
      })
      .finally(() => {
        if (requestId === likeRequestRef.current) setIsLoadingLike(false);
      });
    return () => {
      likeRequestRef.current += 1;
    };
  }, [id, backendUserId, userId, targetLanguage, likeRetry]);

  useEffect(() => {
    const progressUserId = backendUserId ?? userId;
    if (!progressUserId || !targetLanguage) return;
    updateLastReadPassage(progressUserId, id, loadedLanguage.languageId).catch(
      (error) => setErrorMessage(error.message),
    );
    recordRecentArticle(user?.uid, {
      id,
      languageId: loadedLanguage.languageId,
      language: targetLanguage,
      title,
      imageUrl,
    }).catch((error) => {
      console.warn("Unable to save recent article:", error);
      Alert.alert("Recent articles", error.message);
    });
  }, [id, backendUserId, userId, targetLanguage, loadedLanguage?.languageId, user?.uid, title, imageUrl]);

  // One completion per visit; reopening the passage allows another.
  const completionRecorded = useRef(false);

  useEffect(() => {
    completionRecorded.current = false;
  }, [id]);

  useEffect(() => {
    const completionUserId = backendUserId ?? userId;
    if (
      targetLanguage !== "Chinese" ||
      readingProgress < 1 ||
      !passage ||
      !completionUserId
    )
      return;
    if (completionRecorded.current) return;

    completionRecorded.current = true;
    recordPassageCompletion(completionUserId, id).catch(() => {
      completionRecorded.current = false;
    });
  }, [readingProgress, passage, id, backendUserId, userId, targetLanguage]);

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
          {targetLanguage && (
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLikePress}
              disabled={isUpdatingLike || isLoadingLike || likeLoadError}
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
          )}
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

          {targetLanguage && targetLanguage !== "Korean" && (
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
                  disabled={isSegmented}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSegmented }}
                >
                  <Text
                    style={[
                      styles.textModeLabel,
                      isSegmented && styles.textModeLabelActive,
                      targetLanguage === "Chinese" &&
                        !segmentedPassage &&
                        styles.textModeLabelDisabled,
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
                  {targetLanguage === "Japanese" ? "Furigana" : "Pinyin"}
                </Text>
                <Switch
                  value={showPinyin}
                  onValueChange={handlePinyinToggle}
                  accessibilityLabel={
                    targetLanguage === "Japanese" ? "Furigana" : "Pinyin"
                  }
                  trackColor={{
                    false: isDarkMode ? "#4E6159" : theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {errorMessage && (
            <Text
              accessibilityRole="alert"
              style={{ color: theme.colors.text }}
            >
              {errorMessage}
            </Text>
          )}
          {likeLoadError && (
            <TouchableOpacity
              onPress={() => {
                setErrorMessage(null);
                setLikeRetry((attempt) => attempt + 1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading like status"
            >
              <Text style={{ color: theme.colors.text }}>
                Retry loading like status
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={styles.paragraphContainer}
            onLayout={(event) => setParagraphLayout(event.nativeEvent.layout)}
          >
            <View
              style={[
                styles.wordRow,
                targetLanguage === "Japanese" &&
                  (isSegmented || showPinyin) &&
                  segmentedPassage &&
                  styles.japaneseWordRow,
                { backgroundColor: isDarkMode ? "#000000" : "#FFF4E6" },
              ]}
            >
              {targetLanguage === "Japanese" &&
              (isSegmented || showPinyin) &&
              segmentedPassage ? (
                segmentedPassage.flatMap((entry, index) =>
                  entry.word
                    .split(/(\r\n|\r|\n)/)
                    .filter(Boolean)
                    .map((part, partIndex) =>
                      /^[\r\n]+$/.test(part) ? (
                        <View
                          key={`${index}-${partIndex}`}
                          style={{ width: "100%", height: 14 }}
                        />
                      ) : (
                        <TouchableOpacity
                          key={`${index}-${partIndex}`}
                          style={[
                            styles.japaneseWord,
                            isSegmented &&
                              !/^\s+$/.test(part) &&
                              styles.japaneseLearningWord,
                            isSegmented &&
                              entry.statusLevel &&
                              styles[`wordStatus${entry.statusLevel}`],
                          ]}
                          onPress={() => openVocabularyModal(part)}
                          disabled={!isSegmented || !/[\p{L}\p{N}]/u.test(part)}
                          accessibilityRole="button"
                          accessibilityLabel={`Look up ${part}`}
                        >
                          {showPinyin && (
                            <Text style={styles.pinyinText}>
                              {entry.furigana ?? ""}
                            </Text>
                          )}
                          <Text
                            style={[
                              styles.normalText,
                              { color: theme.colors.text },
                            ]}
                          >
                            {part}
                          </Text>
                        </TouchableOpacity>
                      ),
                    ),
                )
              ) : targetLanguage === "Chinese" &&
                (isSegmented || showPinyin || isReadingAloud) &&
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
                  {targetLanguage && passage
                    ? passage
                    : isLoading
                      ? "Loading..."
                      : ""}
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
            language={targetLanguage}
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

  japaneseWordRow: {
    gap: 0,
  },

  japaneseWord: {
    alignItems: "center",
    marginBottom: 8,
  },

  japaneseLearningWord: {
    marginRight: 5,
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
