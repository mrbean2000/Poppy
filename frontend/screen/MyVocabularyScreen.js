import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Speech from "expo-speech";
import {
  getMandarinWordDefinition,
  getUserVocabulary,
  updateVocabularyFavorite,
} from "../util/http";
import { useTheme } from "../theme/ThemeContext";

const filters = ["All", "Learning", "Mastered", "Favorites"];
const USER_ID = 1;

export default function MyVocabularyScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [vocabulary, setVocabulary] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const favoriteUpdatesRef = useRef(new Set());
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardDefinition, setCardDefinition] = useState(null);
  const [isDefinitionLoading, setIsDefinitionLoading] = useState(false);
  const [definitionError, setDefinitionError] = useState(null);
  const hasLoadedVocabularyRef = useRef(false);
  const cardIndexRef = useRef(0);
  const cardTransitionRef = useRef(false);
  const cardPosition = useRef(new Animated.ValueXY()).current;
  const cardFlip = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      const hasLoadedVocabulary = hasLoadedVocabularyRef.current;

      async function loadVocabulary() {
        try {
          if (!hasLoadedVocabulary) setIsLoading(true);
          setErrorMessage(null);
          const entries = await getUserVocabulary(USER_ID);
          if (isCurrent) {
            hasLoadedVocabularyRef.current = true;
            setVocabulary(entries);
            setFavorites(
              entries
                .filter((entry) => entry.favorite)
                .map((entry) => entry.word),
            );
          }
        } catch (error) {
          if (isCurrent) {
            if (hasLoadedVocabulary) {
              Alert.alert("Favorites could not be refreshed", error.message);
            } else {
              setErrorMessage(error.message);
            }
          }
        } finally {
          if (isCurrent && !hasLoadedVocabulary) setIsLoading(false);
        }
      }

      loadVocabulary();
      return () => {
        isCurrent = false;
      };
    }, []),
  );

  const filteredVocabulary = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return vocabulary.filter((entry) => {
      const matchesSearch = entry.word.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Learning" && entry.statusLevel < 4) ||
        (selectedFilter === "Mastered" && entry.statusLevel === 4) ||
        (selectedFilter === "Favorites" && favorites.includes(entry.word));

      return matchesSearch && matchesFilter;
    });
  }, [favorites, searchQuery, selectedFilter, vocabulary]);

  const filteredVocabularyRef = useRef(filteredVocabulary);
  filteredVocabularyRef.current = filteredVocabulary;

  const masteredCount = vocabulary.filter(
    (entry) => entry.statusLevel === 4,
  ).length;

  useEffect(() => {
    cardIndexRef.current = 0;
    setCardIndex(0);
    resetCard();
  }, [filteredVocabulary.length, searchQuery, selectedFilter]);

  function resetCard() {
    cardTransitionRef.current = false;
    setIsCardFlipped(false);
    setCardDefinition(null);
    setDefinitionError(null);
    cardPosition.setValue({ x: 0, y: 0 });
    cardFlip.setValue(0);
  }

  async function flipCard() {
    if (isCardFlipped) {
      Animated.spring(cardFlip, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setIsCardFlipped(false));
      return;
    }

    setIsCardFlipped(true);
    setDefinitionError(null);
    Animated.spring(cardFlip, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (cardDefinition || isDefinitionLoading) return;

    const currentWord =
      filteredVocabularyRef.current[cardIndexRef.current].word;

    try {
      setIsDefinitionLoading(true);
      const definition = await getMandarinWordDefinition(currentWord);
      const activeWord =
        filteredVocabularyRef.current[cardIndexRef.current]?.word;
      if (activeWord === currentWord) setCardDefinition(definition);
    } catch {
      const activeWord =
        filteredVocabularyRef.current[cardIndexRef.current]?.word;
      if (activeWord === currentWord)
        setDefinitionError("Definition unavailable.");
    } finally {
      setIsDefinitionLoading(false);
    }
  }

  async function toggleFavorite(word) {
    if (favoriteUpdatesRef.current.has(word)) return;

    const wasFavorite = favorites.includes(word);
    const shouldFavorite = !wasFavorite;
    favoriteUpdatesRef.current.add(word);
    setFavorites((current) =>
      shouldFavorite
        ? [...current, word]
        : current.filter((favorite) => favorite !== word),
    );

    try {
      const updatedEntry = await updateVocabularyFavorite(
        USER_ID,
        word,
        shouldFavorite,
      );
      setFavorites((current) => {
        const currentlyFavorite = current.includes(word);
        if (updatedEntry.favorite === currentlyFavorite) return current;
        return updatedEntry.favorite
          ? [...current, word]
          : current.filter((favorite) => favorite !== word);
      });
    } catch (error) {
      setFavorites((current) =>
        wasFavorite
          ? current.includes(word)
            ? current
            : [...current, word]
          : current.filter((favorite) => favorite !== word),
      );
      Alert.alert("Favorite not saved", error.message);
    } finally {
      favoriteUpdatesRef.current.delete(word);
    }
  }

  async function speakVocabularyEntry(entry) {
    const definitions = Array.isArray(entry.definitions)
      ? entry.definitions.join(". ")
      : entry.definitions || "No definitions available";

    try {
      await Speech.stop();
      Speech.speak(entry.word, {
        language: "zh-CN",
        onDone: () =>
          Speech.speak(definitions, {
            language: "en-US",
            onError: (error) =>
              console.warn("Failed to read vocabulary definitions:", error),
          }),
        onError: (error) =>
          console.warn("Failed to read vocabulary word:", error),
      });
    } catch (error) {
      console.warn("Failed to start vocabulary speech:", error);
    }
  }

  function moveCard(swipeDirection) {
    if (cardTransitionRef.current) return;

    const nextIndex = cardIndexRef.current + (swipeDirection < 0 ? 1 : -1);
    const currentVocabulary = filteredVocabularyRef.current;

    cardPosition.stopAnimation();

    if (nextIndex < 0 || nextIndex >= currentVocabulary.length) {
      Animated.spring(cardPosition, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
      return;
    }

    cardTransitionRef.current = true;
    Animated.timing(cardPosition, {
      toValue: { x: swipeDirection * 500, y: 0 },
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        cardTransitionRef.current = false;
        return;
      }

      cardIndexRef.current = nextIndex;
      setCardIndex(nextIndex);
      resetCard();
    });
  }

  const cardPanResponder = useRef(
    PanResponder.create({
      onPanResponderGrant: () => {
        cardPosition.stopAnimation();
      },
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        cardPosition.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) >= 80) {
          moveCard(gestureState.dx > 0 ? 1 : -1);
          return;
        }

        Animated.spring(cardPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        Animated.spring(cardPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const currentEntry = filteredVocabulary[cardIndex];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: theme.colors.text }]}>‹</Text>
        </TouchableOpacity>

        {!isLoading && !errorMessage && currentEntry && (
          <>
            <Animated.View
              {...cardPanResponder.panHandlers}
              style={[
                styles.vocabularyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  transform: [
                    { translateX: cardPosition.x },
                    {
                      scaleY: cardFlip.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={flipCard}
                accessibilityRole="button"
                accessibilityLabel={`${isCardFlipped ? "Show word" : "Show English definition for"} ${currentEntry.word}`}
                style={styles.cardFaceContainer}
              >
                <Animated.View
                  style={[
                    styles.cardFace,
                    {
                      opacity: cardFlip.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0, 0],
                      }),
                    },
                  ]}
                >
                  <Text style={[styles.cardWord, { color: theme.colors.text }]}>
                    {currentEntry.word}
                  </Text>
                  {currentEntry.pinyin && (
                    <Text style={styles.cardPinyin}>{currentEntry.pinyin}</Text>
                  )}
                </Animated.View>
                <Animated.View
                  style={[
                    styles.cardFace,
                    styles.cardBack,
                    {
                      opacity: cardFlip.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0, 1],
                      }),
                    },
                  ]}
                >
                  {isDefinitionLoading ? (
                    <Text
                      style={[
                        styles.definitionText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Looking up meaning...
                    </Text>
                  ) : definitionError ? (
                    <Text style={styles.definitionText}>{definitionError}</Text>
                  ) : cardDefinition?.definitions?.length ? (
                    cardDefinition.definitions.map((meaning, index) => (
                      <Text
                        key={`${meaning}-${index}`}
                        style={[
                          styles.definitionText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {`${index + 1}. ${meaning}`}
                      </Text>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.definitionText,
                        { color: theme.colors.text },
                      ]}
                    >
                      No definition available.
                    </Text>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
            <ScrollView
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardPagination}
              style={styles.cardPaginationViewport}
            >
              {filteredVocabulary.slice(0, 10).map((entry, index) => (
                <TouchableOpacity
                  key={entry.word}
                  onPress={() => {
                    const currentIndex = cardIndexRef.current;
                    if (index !== currentIndex) {
                      moveCard(index > currentIndex ? -1 : 1);
                    }
                  }}
                  style={[
                    styles.paginationDot,
                    index === cardIndex && styles.paginationDotActive,
                    index === 8 && styles.paginationDotNinth,
                    index === 9 && styles.paginationDotLast,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Show vocabulary ${index + 1}`}
                />
              ))}
            </ScrollView>
            <View style={styles.vocabularyMetaRow}>
              <Text
                style={[styles.vocabularyMeta, { color: theme.colors.text }]}
              >
                Alex{"  "}
              </Text>
              <Text
                style={[styles.vocabularyMeta, { color: theme.colors.text }]}
              >
                {filteredVocabulary.length} terms
              </Text>
            </View>
            <TouchableOpacity
              style={styles.flashcardButton}
              onPress={() =>
                navigation.navigate("Flashcards", {
                  filter: selectedFilter,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open ${selectedFilter.toLowerCase()} flashcards`}
            >
              <Text style={styles.flashcardButtonText}>Flashcards</Text>
            </TouchableOpacity>
          </>
        )}

        <View
          style={[
            styles.viewSwitch,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        ></View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
              Your Progress
            </Text>
            <TouchableOpacity
              style={[
                styles.progressInfoButton,
                { backgroundColor: theme.colors.bluePastel },
              ]}
              onPress={() =>
                Alert.alert(
                  "Your Progress",
                  "Total words is the number of words in your vocabulary. Still learning counts words not yet mastered. Mastered counts words marked as mastered.",
                )
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="About your progress"
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={17}
                color={theme.colors.blueDark}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Total words"
              value={vocabulary.length}
              color="#1CB0F6"
              theme={theme}
            />
            <StatCard
              label="Still learning"
              value={vocabulary.length - masteredCount}
              color="#FF9600"
              theme={theme}
            />
            <StatCard
              label="Mastered"
              value={masteredCount}
              color={theme.colors.primary}
              theme={theme}
            />
          </View>
        </View>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search vocabulary"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filter,
                { borderColor: theme.colors.border },
                selectedFilter === filter && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: theme.colors.textSecondary },
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Loading vocabulary...
          </Text>
        )}
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        {!isLoading && !errorMessage && filteredVocabulary.length === 0 && (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            No words match this view yet.
          </Text>
        )}

        <Text style={[styles.termsTitle, { color: theme.colors.text }]}>
          Terms
        </Text>

        {filteredVocabulary.map((entry) => {
          return (
            <View
              key={entry.word}
              style={[
                styles.wordCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.wordInfo}>
                <Text style={[styles.word, { color: theme.colors.text }]}>
                  {entry.word}
                </Text>
                {(entry.pinyin || entry.definitions?.length > 0) && (
                  <Text style={styles.pinyin}>
                    {[
                      entry.pinyin,
                      Array.isArray(entry.definitions)
                        ? entry.definitions.join(", ")
                        : entry.definitions,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.speakerButton,
                  { backgroundColor: theme.colors.bluePastel },
                ]}
                onPress={() => speakVocabularyEntry(entry)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Read ${entry.word} and its definitions aloud`}
              >
                <MaterialCommunityIcons
                  name="volume-high"
                  size={20}
                  color={theme.colors.blueDark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(entry.word)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={
                  favorites.includes(entry.word)
                    ? `Remove ${entry.word} from favorites`
                    : `Add ${entry.word} to favorites`
                }
                accessibilityState={{
                  selected: favorites.includes(entry.word),
                }}
              >
                <MaterialCommunityIcons
                  name={
                    favorites.includes(entry.word) ? "star" : "star-outline"
                  }
                  size={22}
                  color={favorites.includes(entry.word) ? "#F5A623" : "#94A3B8"}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, theme }) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backIcon: { fontSize: 38, lineHeight: 38, fontWeight: "300" },
  title: { fontSize: 28, fontWeight: "900" },
  viewSwitch: {
    alignSelf: "flex-end",
    flexDirection: "row",
    marginTop: 14,
    padding: 3,
    borderWidth: 1,
    borderRadius: 999,
  },
  viewOption: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  viewOptionText: { fontSize: 12, fontWeight: "800" },
  viewOptionTextActive: { color: "#FFFFFF" },
  subtitle: { marginTop: 5, fontSize: 14 },
  progressSection: { marginTop: 22 },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTitle: { fontSize: 18, fontWeight: "900" },
  progressInfoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  termsTitle: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "900",
  },
  statCard: {
    flex: 1,
    minHeight: 104,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  statDot: { width: 9, height: 9, borderRadius: 5, marginBottom: 8 },
  statValue: { fontSize: 25, fontWeight: "900" },
  statLabel: { fontSize: 11, marginTop: 2 },
  searchBox: {
    height: 50,
    marginTop: 22,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
  },
  searchIcon: { color: "#64748B", fontSize: 26, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filters: { gap: 8, paddingVertical: 18 },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 999,
  },
  filterActive: { backgroundColor: "#172033", borderColor: "#172033" },
  filterText: { fontSize: 13, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  wordCard: {
    minHeight: 74,
    marginBottom: 10,
    padding: 15,
    paddingRight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
  },
  wordInfo: { flex: 1, marginRight: 12 },
  speakerButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 54,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  word: { fontSize: 24, fontWeight: "800" },
  cardPaginationViewport: {
    alignSelf: "stretch",
    marginTop: 18,
    maxHeight: 28,
  },
  cardPagination: {
    minWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  vocabularyMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 0,
    paddingHorizontal: 8,
  },
  vocabularyMeta: { fontSize: 18, fontWeight: "400" },
  flashcardButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1CB0F6",
  },
  flashcardButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#62677F",
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  paginationDotNinth: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  paginationDotLast: {
    width: 5,
    height: 5,
    borderRadius: 4,
  },
  vocabularyCard: {
    minHeight: 260,
    marginTop: 14,
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
  cardFaceContainer: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 210,
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
    backfaceVisibility: "hidden",
  },
  cardBack: { paddingHorizontal: 8 },
  cardHint: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 28,
  },
  cardBackLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 18,
    textTransform: "uppercase",
  },
  definitionText: {
    fontSize: 17,
    lineHeight: 25,
    marginTop: 8,
    textAlign: "center",
  },
  cardWord: {
    fontSize: 30,
    fontWeight: "90",
    textAlign: "center",
    paddingTop: 50,
  },
  cardPinyin: {
    color: "#087FB9",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  cardStatus: {
    marginTop: 28,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  cardStatusText: { fontSize: 12, fontWeight: "900" },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    marginTop: 32,
  },
  cardFavorite: { color: "#94A3B8", fontSize: 28 },
  definitionLink: { fontSize: 15, fontWeight: "800" },
  swipeHint: { marginTop: 16, textAlign: "center", fontSize: 13 },
  pinyin: {
    color: "#087FB9",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  wordMeta: { fontSize: 12, marginTop: 4 },
  wordRight: { alignItems: "flex-end", gap: 8 },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
  },
  favorite: { color: "#94A3B8", fontSize: 22 },
  favoriteActive: { color: "#FF4F81" },
  message: { paddingVertical: 28, textAlign: "center" },
  error: { paddingVertical: 20, color: "#B42318" },
});
