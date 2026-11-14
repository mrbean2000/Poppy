import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import {
  getUserProfileByFirebaseUid,
  getUserSettings,
  updateUserSettings,
} from "../util/http";
import { profilePictures } from "../util/profilePictures";

export default function ProfilePictureScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [userId, setUserId] = useState(null);
  const [selectedUri, setSelectedUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const savingRef = useRef(false);
  const hasSelection = profilePictures.some(
    (picture) => picture.uri === selectedUri,
  );

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (savingRef.current) event.preventDefault();
      }),
    [navigation],
  );

  useEffect(() => {
    let active = true;

    async function loadProfilePicture() {
      setLoading(true);
      setUserId(null);
      setErrorMessage(null);
      try {
        if (!user?.uid)
          throw new Error("Please sign in to update your profile picture.");
        const profile = await getUserProfileByFirebaseUid(user.uid);
        if (!profile?.id)
          throw new Error("Your profile does not have a database user ID.");
        const settings = await getUserSettings(profile.id);
        if (active) {
          setUserId(profile.id);
          setSelectedUri(settings.profilePictureUrl || profilePictures[0].uri);
        }
      } catch (error) {
        if (active) setErrorMessage(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfilePicture();
    return () => {
      active = false;
    };
  }, [user?.uid, attempt]);

  async function saveProfilePicture() {
    if (!userId || !hasSelection || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateUserSettings({
        user_id: userId,
        profilePictureUrl: selectedUri,
      });
      savingRef.current = false;
      navigation.goBack();
    } catch (error) {
      savingRef.current = false;
      setErrorMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <ImageBackground
      source={
        isDarkMode
          ? require("../assets/images/masot/backgroundimagequestion_darkmode.png")
          : require("../assets/images/masot/backgroundimagequestion.png")
      }
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.background}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Profile picture
            </Text>
            <View style={styles.spacer} />
          </View>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            Choose a Poppy picture for your profile.
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : userId ? (
            <>
              <View style={styles.grid}>
                {profilePictures.map((picture) => {
                  const selected = picture.uri === selectedUri;
                  return (
                    <TouchableOpacity
                      key={picture.uri}
                      style={[
                        styles.pictureCard,
                        { backgroundColor: theme.colors.surface },
                        selected && { borderColor: theme.colors.primary },
                      ]}
                      onPress={() => setSelectedUri(picture.uri)}
                      disabled={saving}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: selected,
                        disabled: saving,
                      }}
                      accessibilityLabel={picture.label}
                    >
                      <View style={styles.pictureFrame}>
                        <Image source={picture.source} style={styles.picture} />
                      </View>
                      <Text
                        style={[
                          styles.pictureLabel,
                          { color: theme.colors.text },
                        ]}
                      >
                        {picture.label}
                      </Text>
                      {selected ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color={theme.colors.primary}
                          style={styles.checkmark}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                  (!hasSelection || saving) && styles.disabled,
                ]}
                onPress={saveProfilePicture}
                disabled={!hasSelection || saving}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.primaryText} />
                ) : (
                  <Text
                    style={[
                      styles.saveText,
                      { color: theme.colors.primaryText },
                    ]}
                  >
                    Save picture
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setAttempt((value) => value + 1)}
              accessibilityRole="button"
            >
              <Text style={[styles.retry, { color: theme.colors.primary }]}>
                Try again
              </Text>
            </TouchableOpacity>
          )}
          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: theme.colors.danger }]}
            >
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  back: { fontSize: 32, lineHeight: 32 },
  title: { fontSize: 24, fontWeight: "900" },
  spacer: { width: 24 },
  description: { fontSize: 16, marginBottom: 18 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  pictureCard: {
    width: "48%",
    borderWidth: 3,
    borderColor: "transparent",
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  pictureFrame: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  picture: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  pictureLabel: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  checkmark: { position: "absolute", right: 12, top: 12 },
  saveButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveText: { fontSize: 17, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  retry: { fontSize: 16, fontWeight: "700" },
  error: { fontSize: 14, marginTop: 14 },
});
