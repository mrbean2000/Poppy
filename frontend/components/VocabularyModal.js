import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
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

export default function VocabularyModal({ word, userId = 1, onClose }) {
  const { theme } = useTheme();
  const [definition, setDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isCurrent = true;

    async function loadDefinition() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setDefinition(null);
        const [dictionaryResult] = await Promise.allSettled([
          getMandarinWordDefinition(word),
          recordVocabularyLookup(userId, word),
        ]);

        if (!isCurrent) return;

        if (dictionaryResult.status === "fulfilled") {
          setDefinition(dictionaryResult.value);
        } else {
          setErrorMessage("Definition unavailable.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDefinition();

    return () => {
      isCurrent = false;
    };
  }, [userId, word]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(onClose);
          return;
        }

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
              inputRange: [0, 500],
              outputRange: [0.45, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
          { transform: [{ translateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.word, { color: theme.colors.text }]}>
            {word}
          </Text>
          {definition && (
            <Text
              style={[
                styles.alternateWords,
                { color: theme.colors.textSecondary },
              ]}
            >
              {definition.traditional === definition.simplified
                ? definition.simplified
                : `${definition.traditional} / ${definition.simplified}`}
            </Text>
          )}
          <View style={styles.pronunciation}>
            <Text style={styles.ipa}>
              {definition?.formattedPinyin ||
                (isLoading ? "Looking up..." : "No pinyin")}
            </Text>
          </View>
          <View style={styles.category}>
            <Text style={styles.categoryText}>
              {definition?.partOfSpeech || "DICTIONARY"}
            </Text>
          </View>
          {isLoading ? (
            <Text style={[styles.definition, { color: theme.colors.text }]}>
              Looking up meaning...
            </Text>
          ) : definition?.definitions?.length ? (
            definition.definitions.map((meaning, index) => (
              <Text
                key={`${meaning}-${index}`}
                style={[styles.definition, { color: theme.colors.text }]}
              >
                {`${index + 1}. ${meaning}`}
              </Text>
            ))
          ) : (
            <Text style={[styles.definition, { color: theme.colors.text }]}>
              {errorMessage}
            </Text>
          )}
        </ScrollView>
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    width: "100%",
    borderWidth: 1,
    shadowColor: "#172033",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  scrollContent: { paddingBottom: 20 },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 15,
  },
  word: { fontSize: 36, fontWeight: "900", marginTop: 20 },
  close: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  closeText: { fontSize: 24, color: "#6B7280" },
  alternateWords: { marginTop: 4, fontSize: 16 },
  pronunciation: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  ipa: {
    backgroundColor: "#DDF4FF",
    color: "#087FB9",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: "700",
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: "#E5F5D5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 20,
  },
  categoryText: { color: "#4C8C00", fontSize: 11, fontWeight: "900" },
  definition: { fontSize: 17, lineHeight: 26, marginTop: 10 },
});
