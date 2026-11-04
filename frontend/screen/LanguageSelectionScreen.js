import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllLanguages } from "../util/http";
import { useTheme } from "../theme/ThemeContext";

export default function LanguageSelectionScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [languages, setLanguages] = useState([]);
  const [currentSelection, setCurrentSelection] = useState(
    route.params.selectedLanguage,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const { onSelect } = route.params;

  function selectLanguage(language) {
    setCurrentSelection(language);
    onSelect(language);
    navigation.goBack();
  }

  async function fetchAllLanguages() {
    try {
      setIsLoading(true);
      const allLanguages = await getAllLanguages();
      setLanguages(allLanguages);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAllLanguages();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Native Language
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.list, { backgroundColor: theme.colors.surface }]}>
          {languages.map((language) => {
            const isSelected = currentSelection?.id === language.id;

            return (
              <TouchableOpacity
                key={language.countryFlag}
                style={styles.languageRow}
                onPress={() => selectLanguage(language)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{language.countryFlag}</Text>
                <Text
                  style={[styles.languageName, { color: theme.colors.text }]}
                >
                  {language.language}
                </Text>
                {isSelected && (
                  <Text style={[styles.checkmark, { color: theme.colors.primary }]}>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  back: {
    fontSize: 32,
    lineHeight: 32,
    color: "#172033",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#172033",
  },
  headerSpacer: {
    width: 24,
  },
  list: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  languageRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },
  flag: {
    width: 35,
    fontSize: 22,
  },
  languageName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#172033",
  },
  checkmark: {
    fontSize: 22,
    fontWeight: "800",
  },
});
