import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground,
} from "react-native";
import {
  getUserProfileByFirebaseUid,
  getUserSettings,
  updateUserSettings as saveUserSettings,
} from "../util/http";
import { useAuth } from "../context/AuthContext";
import { usePodcastPlayback } from "../components/PodcastPlaybackContext";
import { useTheme } from "../theme/ThemeContext";

const avatar = require("../assets/images/masot/poppy_raincoat.jpeg");

export default function SettingsScreen({ navigation, route }) {
  const { theme, isDarkMode, backendUserId, setDarkMode } = useTheme();
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const profileName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    profileName ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Poppy learner";

  useEffect(() => {
    if (!user?.uid) return;
    getUserProfileByFirebaseUid(user.uid)
      .then(setProfile)
      .catch(() => {});
  }, [user?.uid]);
  // Same warm card palette as the Home screen cards.
  const cardStyle = { backgroundColor: isDarkMode ? "#1F2937" : "#FFF4E6" };
  const CARD_TEXT = isDarkMode ? "#FFFFFF" : "#000000";
  const CARD_TEXT_MUTED = isDarkMode ? "#CBD5E1" : "#6B5B45";
  const { clearEpisode } = usePodcastPlayback();
  const { userSettings = {}, setSettings = () => {} } = route.params || {};

  const [settings, setLocalSettings] = useState(userSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleDarkModeChange(darkmode) {
    const updatedSettings = {
      ...settings,
      darkmode,
      user_id: backendUserId ?? settings.user_id,
    };

    setLocalSettings(updatedSettings);
    setSettings(updatedSettings);
    setErrorMessage(null);

    try {
      await setDarkMode(darkmode);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleLanguageChange(id, name, flag, nativeLanguage) {
    const updatedSettings = { ...settings };

    if (nativeLanguage) {
      updatedSettings.nativelanguageid = id;
      updatedSettings.nativelanguage = name;
      updatedSettings.nativeLanguageFlag = flag;
    } else {
      updatedSettings.targetlanguageid = id;
      updatedSettings.targetlanguage = name;
      updatedSettings.targetLanguageFlag = flag;
    }

    setLocalSettings(updatedSettings);
    setSettings(updatedSettings);
    setErrorMessage(null);

    try {
      await saveUserSettings(updatedSettings);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function SettingRow({ icon, iconName, label, value, onPress, control }) {
    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        {iconName ? (
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={CARD_TEXT_MUTED}
            />
          </View>
        ) : icon ? (
          <Text style={[styles.rowIcon, { color: CARD_TEXT_MUTED }]}>
            {icon}
          </Text>
        ) : null}
        <Text
          style={[
            styles.rowLabel,
            { color: CARD_TEXT },
            !icon && !iconName && styles.rowLabelNoIcon,
          ]}
        >
          {label}
        </Text>
        {value && (
          <Text style={[styles.rowValue, { color: CARD_TEXT_MUTED }]}>
            {value}
          </Text>
        )}
        {control ? (
          <View style={styles.controlWrapper}>{control}</View>
        ) : (
          <Text style={[styles.chevron, { color: CARD_TEXT_MUTED }]}>›</Text>
        )}
      </TouchableOpacity>
    );
  }

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
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Settings
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <TouchableOpacity
            style={[styles.profileCard, cardStyle]}
            activeOpacity={0.8}
          >
            <Image
              source={user?.photoURL ? { uri: user.photoURL } : avatar}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: CARD_TEXT }]}>
                {displayName}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Language Settings
          </Text>
          <View style={[styles.sectionCard, cardStyle]}>
            <SettingRow
              label="Native Language"
              onPress={() =>
                navigation.navigate("LanguageSelection", {
                  selectedLanguage: {
                    id: settings.nativelanguageid,
                    name: settings.nativelanguage,
                    flag: settings.nativeLanguageFlag,
                  },
                  onSelect: (language) => {
                    handleLanguageChange(
                      language.id,
                      language.language,
                      language.countryFlag,
                      true,
                    );
                  },
                })
              }
              value={settings.nativeLanguageFlag + settings.nativelanguage}
            />
            <View style={styles.divider} />

            {/* <SettingRow
            label="Target Language"
            value={
              userSettings.targetLanguageFlag + userSettings.targetlanguage
            }
          /> */}

            <SettingRow
              label="Target Language"
              onPress={() =>
                navigation.navigate("LanguageSelection", {
                  selectedLanguage: {
                    id: settings.targetlanguageid,
                    name: settings.targetlanguage,
                    flag: settings.targetLanguageFlag,
                  },
                  onSelect: (language) => {
                    handleLanguageChange(
                      language.id,
                      language.language,
                      language.countryFlag,
                      false,
                    );
                  },
                })
              }
              value={settings.targetLanguageFlag + settings.targetlanguage}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            App Preferences
          </Text>
          <View style={[styles.sectionCard, cardStyle]}>
            <SettingRow
              icon="◷"
              label="Dark Mode"
              control={
                <View style={styles.switchContainer}>
                  <Switch
                    value={isDarkMode}
                    onValueChange={handleDarkModeChange}
                    trackColor={{
                      false: "#D1D5DB",
                      true: theme.colors.primary,
                    }}
                    thumbColor={isDarkMode ? "#FFFFFF" : "#F3F4F6"}
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
              }
            />
            <View style={styles.divider} />
            <SettingRow iconName="bell-outline" label="Notifications" />
            <View style={styles.divider} />
            <SettingRow iconName="shield-lock-outline" label="Data & Privacy" />
            <View style={styles.divider} />
            <SettingRow icon="ⓘ" label="About" />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account
          </Text>
          <View style={[styles.sectionCard, cardStyle]}>
            <SettingRow
              icon="⇥"
              label="Sign out"
              onPress={async () => {
                try {
                  await clearEpisode();
                  await signOut();
                } catch (error) {
                  setErrorMessage(error.message);
                }
              }}
            />
          </View>
          {errorMessage ? (
            <Text style={[styles.accountError, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>
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
    backgroundColor: "#F7F7F7",
  },
  content: {
    padding: 20,
    paddingBottom: 28,
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
    fontSize: 26,
    fontWeight: "900",
    color: "#172033",
  },
  headerSpacer: {
    width: 24,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 13,
    marginBottom: 24,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#172033",
  },
  profileLevel: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "900",
    color: "#172033",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 22,
    overflow: "hidden",
  },
  settingRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 27,
    fontSize: 19,
    color: "#64748B",
    textAlign: "center",
  },
  rowLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "600",
    color: "#172033",
  },
  rowLabelNoIcon: {
    marginLeft: 0,
  },
  rowValue: {
    marginRight: 9,
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  controlWrapper: {
    marginLeft: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  chevron: {
    fontSize: 27,
    lineHeight: 27,
    color: "#AAB3BF",
  },
  divider: {
    height: 1,
    marginLeft: 14,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
  },
  accountError: { marginBottom: 16, fontSize: 13, lineHeight: 19 },
});
