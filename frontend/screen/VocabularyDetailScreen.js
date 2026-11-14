import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getJapaneseWordDefinition,
  getMandarinWordDefinition,
  getUserSettings,
  vocabularyLanguage,
} from "../util/http";
import { useTheme } from "../theme/ThemeContext";

export default function VocabularyDetailScreen({ navigation, route }) {
  const { theme, backendUserId } = useTheme();
  const { word } = route.params;
  const [definition, setDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadDefinition() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const selectedLanguage = vocabularyLanguage(await getUserSettings(backendUserId ?? 1));
        const result = selectedLanguage === "Japanese"
          ? await getJapaneseWordDefinition(word)
          : await getMandarinWordDefinition(word);
        if (isCurrent) {
          setLanguage(selectedLanguage);
          setDefinition(result);
        }
      } catch (error) {
        if (isCurrent) setErrorMessage("Definition unavailable.");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDefinition();
    return () => {
      isCurrent = false;
    };
  }, [word, backendUserId]);

  const japaneseEntry = language === "Japanese" ? definition?.entries?.[0] : null;
  const definitions = language === "Japanese"
    ? definition?.entries?.flatMap((entry) =>
        entry.senses.map((sense) =>
          [sense.category, sense.meanings.join("; ")].filter(Boolean).join(": "),
        ),
      )
    : definition?.definitions;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Vocabulary
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.word, { color: theme.colors.text }]}>{word}</Text>
        {isLoading ? (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Looking up meaning...
          </Text>
        ) : errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : (
          <>
            <Text
              style={[
                styles.alternateWords,
                { color: theme.colors.textSecondary },
              ]}
            >
              {language === "Japanese"
                ? japaneseEntry?.writtenForms?.join(", ")
                : definition?.traditional === definition?.simplified
                ? definition?.simplified
                : `${definition?.traditional || ""} / ${definition?.simplified || ""}`}
            </Text>
            <View style={styles.pronunciation}>
              <Text style={styles.ipa}>
                {language === "Japanese"
                  ? japaneseEntry?.readings?.join(", ") || "No reading available"
                  : definition?.formattedPinyin || "No pinyin"}
              </Text>
            </View>
            <View style={styles.category}>
              <Text style={styles.categoryText}>
                {definition?.partOfSpeech || "DICTIONARY"}
              </Text>
            </View>
            {definitions?.length ? (
              definitions.map((meaning, index) => (
                <Text
                  key={`${meaning}-${index}`}
                  style={[styles.definition, { color: theme.colors.text }]}
                >
                  {`${index + 1}. ${meaning}`}
                </Text>
              ))
            ) : (
              <Text style={[styles.definition, { color: theme.colors.text }]}>
                No definition available.
              </Text>
            )}
          </>
        )}
      </ScrollView>
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
  back: { fontSize: 32 },
  title: { fontSize: 16, fontWeight: "900" },
  headerSpacer: { width: 24 },
  content: { padding: 24, paddingBottom: 40 },
  word: { fontSize: 48, fontWeight: "900" },
  alternateWords: { marginTop: 8, fontSize: 17 },
  pronunciation: { marginTop: 22 },
  ipa: {
    alignSelf: "flex-start",
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
  definition: { fontSize: 17, lineHeight: 26, marginTop: 14 },
  message: { marginTop: 28, fontSize: 16 },
  error: { marginTop: 28, color: "#B42318", fontSize: 16 },
});
