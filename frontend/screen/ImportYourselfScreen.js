import {
  Alert,
  Animated,
  ImageBackground,
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
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { createPassageFromText } from "../util/http";

export default function ImportYourselfScreen({ navigation }) {
  const { theme, isDarkMode, backendUserId } = useTheme();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [passage, setPassage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(20)).current;
  const backPressScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      contentOpacity.setValue(0);
      contentOffset.setValue(20);

      const animation = Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(contentOffset, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]);

      animation.start();

      return () => animation.stop();
    }, [contentOffset, contentOpacity]),
  );

  function animateBackPressIn() {
    Animated.spring(backPressScale, {
      toValue: 0.86,
      speed: 28,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }

  function animateBackPressOut() {
    Animated.spring(backPressScale, {
      toValue: 1,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }

  function goBack() {
    animateBackPressIn();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(contentOffset, {
          toValue: -20,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => navigation.goBack());
    }, 110);
  }

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
        userId: backendUserId,
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
    <ImageBackground
      source={
        isDarkMode
          ? require("../assets/images/masot/backgroundimagequestion_darkmode.png")
          : require("../assets/images/masot/backgroundimagequestion.png")
      }
      style={styles.container}
      resizeMode="cover"
    >
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          style={[
            styles.flex,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentOffset }],
            },
          ]}
        >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View
            style={{
              alignSelf: "flex-start",
              transform: [{ scale: backPressScale }],
            }}
          >
            <TouchableOpacity
              onPress={goBack}
              onPressIn={animateBackPressIn}
              onPressOut={animateBackPressOut}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
            </TouchableOpacity>
          </Animated.View>
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
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ImageBackground>
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
