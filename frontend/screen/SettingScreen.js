import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import {
  getUserSettings,
  updateUserSettings as saveUserSettings,
} from "../util/http";
import { useAuth } from "../context/AuthContext";
import { usePodcastPlayback } from "../components/PodcastPlaybackContext";
import { useTheme } from "../theme/ThemeContext";

const avatar = require("../assets/images/masot/poppy_raincoat.jpeg");

export default function SettingsScreen({ navigation, route }) {
  const { theme, isDarkMode, backendUserId, setDarkMode } = useTheme();
  const { signOut } = useAuth();
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

  function SettingRow({ icon, label, value, onPress, control }) {
    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
        {value && (
          <Text
            style={[styles.rowValue, { color: theme.colors.textSecondary }]}
          >
            {value}
          </Text>
        )}
        {control ? (
          <View style={styles.controlWrapper}>{control}</View>
        ) : (
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            ›
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
          style={[
            styles.profileCard,
            { backgroundColor: theme.colors.surface },
          ]}
          activeOpacity={0.8}
        >
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              Kah Yong Chua
            </Text>
            <Text
              style={[
                styles.profileLevel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Beginner
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Language Settings
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
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
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

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
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
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
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <SettingRow icon="♧" label="Notifications" />
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <SettingRow icon="▣" label="Data & Privacy" />
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <SettingRow icon="ⓘ" label="About" />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
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
  );
}

const styles = StyleSheet.create({
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
    fontSize: 22,
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
    fontSize: 16,
    fontWeight: "900",
    color: "#172033",
  },
  profileLevel: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B7280",
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 14,
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
    fontSize: 14,
    color: "#172033",
  },
  rowValue: {
    marginRight: 9,
    fontSize: 13,
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
    marginLeft: 51,
    backgroundColor: "#EEF1F4",
  },
  accountError: { marginBottom: 16, fontSize: 13, lineHeight: 19 },
});
