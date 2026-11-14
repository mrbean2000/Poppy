import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProfilePictureSource } from "../util/profilePictures";
import { useTheme } from "../theme/ThemeContext";

export default function HomeRecentPanel({
  visible,
  width,
  user,
  profile,
  profilePictureUrl,
  onClose,
  navigation,
}) {
  const { theme, isDarkMode } = useTheme();
  const profileName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    profileName ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Poppy learner";

  return (
    <SafeAreaView
      style={[
        styles.panel,
        { width, backgroundColor: isDarkMode ? "#111827" : "#FFF9F0" },
      ]}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
    >
      <View style={styles.profile}>
        <Image
          source={getProfilePictureSource(profilePictureUrl, user?.photoURL)}
          style={styles.profileImage}
        />
        <Text
          numberOfLines={2}
          style={[styles.profileName, { color: theme.colors.text }]}
        >
          {displayName}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.section}
        onPress={() => {
          onClose();
          navigation.navigate("RecentPodcasts");
        }}
        accessibilityRole="button"
      >
        <Text style={[styles.sectionText, { color: theme.colors.text }]}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color={theme.colors.text}
          />
          {"  "}
          Recent podcasts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.section}
        onPress={() => {
          onClose();
          navigation.navigate("RecentArticles");
        }}
        accessibilityRole="button"
      >
        <Text style={[styles.sectionText, { color: theme.colors.text }]}>
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={18}
            color={theme.colors.text}
          />
          {"  "}
          Recent articles
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
    paddingTop: 20,
  },
  profileImage: { width: 48, height: 48, borderRadius: 24 },
  profileName: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: "700" },
  section: {
    marginTop: 16,
    marginBottom: 12,
    marginLeft: 20,
  },
  sectionText: { fontSize: 18, fontWeight: "800" },
});
