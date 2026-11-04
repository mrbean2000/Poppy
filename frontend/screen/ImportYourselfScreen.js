import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { createPassageFromText } from "../util/http";

export default function ImportYourselfScreen({ navigation }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [passage, setPassage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  async function handleImport() {
    const trimmedTitle = title.trim();
    const trimmedImageUrl = imageUrl.trim();
    const trimmedPassage = passage.trim();

    if (!trimmedTitle) {
      titleInputRef.current?.focus();
      return;
    }

    if (!trimmedPassage) {
      Alert.alert("Passage required", "Please paste the passage first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const createdPassage = await createPassageFromText({
        title: trimmedTitle,
        imageUrl: trimmedImageUrl,
        passage: trimmedPassage,
      });
      const importedPassage = createdPassage.passage;
      const passageId = createdPassage.id;

      if (!passageId) {
        throw new Error(
          "The passage was imported, but its ID was not returned.",
        );
      }

      navigation.replace("Reader", {
        id: passageId,
        title: trimmedTitle,
        imageUrl: createdPassage?.imageUrl ?? createdPassage?.imageUrl,
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Import Yourself
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Add your own passage to start learning.
          </Text>

          <View style={styles.form}>
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={setTitle}
              placeholder="Paste a title"
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.textSecondary,
                },
              ]}
            />
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="Paste an image URL (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.textSecondary,
                },
              ]}
            />
            <TextInput
              value={passage}
              onChangeText={setPassage}
              placeholder="Paste the passage"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={[
                styles.passageInput,
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
              accessibilityLabel="Import your passage"
            >
              <Text
                style={[styles.buttonText, { color: theme.colors.primaryText }]}
              >
                {isSubmitting ? "Importing..." : "Import"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24 },
  back: { fontSize: 36, lineHeight: 36 },
  title: { marginTop: 24, fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 8, fontSize: 14 },
  form: { marginTop: 32, gap: 12 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passageInput: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
