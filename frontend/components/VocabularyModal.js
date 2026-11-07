import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getMandarinWordDefinition,
  recordVocabularyLookup,
} from "../util/http";
import { useTheme } from "../theme/ThemeContext";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SLIDE_IN_MS = 240;

export default function VocabularyModal({
  word,
  userId = 1,
  onClose,
  onLookup,
}) {
  const { theme, isDarkMode } = useTheme();
  const colors = theme.colors;
  const [definition, setDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const closingRef = useRef(false);
  const touchingMeanings = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  // Wait for the slide-in to finish so the lookup's state updates don't cause jank.
  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setErrorMessage(null);
    setDefinition(null);

    const timer = setTimeout(async () => {
      const [dictionaryResult, lookupResult] = await Promise.allSettled([
        getMandarinWordDefinition(word),
        recordVocabularyLookup(userId, word),
      ]);

      if (lookupResult.status === "fulfilled") {
        onLookup?.(word, lookupResult.value?.statusLevel);
      }

      if (!isCurrent) return;

      if (dictionaryResult.status === "fulfilled") {
        setDefinition(dictionaryResult.value);
      } else {
        setErrorMessage("Definition unavailable.");
      }
      setIsLoading(false);
    }, SLIDE_IN_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [userId, word]);

  const closeSheet = useRef(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        !closingRef.current &&
        !touchingMeanings.current &&
        gestureState.dy > 5 &&
        gestureState.dy > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.8) {
          closeSheet();
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: translateY.interpolate({
              inputRange: [0, SCREEN_HEIGHT],
              outputRange: [0.45, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDarkMode ? "#000000" : "#FFF4E6",
            borderColor: colors.border,
            shadowColor: isDarkMode ? "#000000" : "#172033",
          },
          { transform: [{ translateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragZone}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>
        <TouchableOpacity
          style={[styles.close, { backgroundColor: colors.surface }]}
          onPress={closeSheet}
          hitSlop={8}
          accessibilityLabel="Close"
        >
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>
            ×
          </Text>
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={[styles.word, { color: colors.text }]}>{word}</Text>
          {definition && definition.traditional !== definition.simplified && (
            <Text
              style={[styles.alternateWords, { color: colors.textSecondary }]}
            >
              {`${definition.traditional} / ${definition.simplified}`}
            </Text>
          )}
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.primary }]}>
              <Text style={[styles.chipText, { color: colors.primaryText }]}>
                {definition?.formattedPinyin ||
                  (isLoading ? "Looking up..." : "No pinyin")}
              </Text>
            </View>
            <View
              style={[styles.chip, { backgroundColor: colors.greenPastel }]}
            >
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {(definition?.partOfSpeech || "DICTIONARY").toUpperCase()}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.definitionsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ScrollView
              style={styles.meaningsScroll}
              showsVerticalScrollIndicator={false}
              onTouchStart={() => {
                touchingMeanings.current = true;
              }}
              onTouchEnd={() => {
                touchingMeanings.current = false;
              }}
              onTouchCancel={() => {
                touchingMeanings.current = false;
              }}
            >
              {isLoading ? (
                <Text style={[styles.definition, { color: colors.textSecondary }]}>
                  Looking up meaning...
                </Text>
              ) : definition?.definitions?.length ? (
                definition.definitions.map((meaning, index) => (
                  <View key={`${meaning}-${index}`} style={styles.definitionRow}>
                    <View
                      style={[
                        styles.indexBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[styles.indexText, { color: colors.primaryText }]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[styles.definition, { color: colors.text, flex: 1 }]}
                    >
                      {meaning}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.definition, { color: colors.textSecondary }]}>
                  {errorMessage}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    maxHeight: "80%",
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  content: { flexShrink: 1, paddingBottom: 32 },
  dragZone: {
    paddingTop: 4,
    paddingBottom: 12,
    marginTop: -4,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
  },
  word: { fontSize: 38, fontWeight: "900", marginTop: 12, paddingRight: 48 },
  close: {
    position: "absolute",
    right: 16,
    top: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeText: { fontSize: 24, lineHeight: 28 },
  alternateWords: { marginTop: 4, fontSize: 16 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { fontSize: 15, fontWeight: "800" },
  categoryText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  definitionsCard: {
    marginTop: 18,
    flexShrink: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  meaningsScroll: { flexShrink: 1 },
  definitionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  indexText: { fontSize: 12, fontWeight: "900" },
  definition: { fontSize: 17, lineHeight: 25, paddingVertical: 4 },
});
