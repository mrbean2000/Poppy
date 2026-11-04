import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { createPassage } from "../util/http";

export default function ImportUrlScreen({ navigation }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const urlInputRef = useRef(null);

  async function handleImport() {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      urlInputRef.current?.focus();
      return;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Unsupported protocol");
      }
    } catch {
      Alert.alert("Invalid URL", "Please enter a valid http or https URL.");
      return;
    }

    try {
      setIsSubmitting(true);
      const createdPassage = await createPassage(trimmedUrl);
      const importedPassage =
        createdPassage.data.passage ?? createdPassage.data.passage;
      const passageId = createdPassage.data.id ?? createdPassage.data.passageId;

      if (!passageId) {
        throw new Error(
          "The passage was imported, but its ID was not returned.",
        );
      }

      navigation.replace("Reader", {
        id: passageId,
        title: createdPassage.data.title ?? "",
        imageUrl: createdPassage.data.image_url,
      });
    } catch (error) {
      Alert.alert("Import failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Import via URL
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Paste an article URL to import vocabulary.
        </Text>

        <View style={styles.form}>
          <TextInput
            ref={urlInputRef}
            value={url}
            onChangeText={setUrl}
            placeholder="Paste an article URL"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleImport}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.textSecondary,
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleImport}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Import passage"
          >
            <Text
              style={[styles.buttonText, { color: theme.colors.primaryText }]}
            >
              {isSubmitting ? "Importing..." : "Import"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
  },
  back: {
    fontSize: 36,
    lineHeight: 36,
  },
  title: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
  },
  form: {
    width: "100%",
    marginTop: 32,
    gap: 12,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
