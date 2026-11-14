import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function DeleteAccountScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const cardColor = isDarkMode ? "#1F2937" : "#FFF4E6";
  const textColor = isDarkMode ? "#FFFFFF" : "#000000";
  const mutedColor = isDarkMode ? "#CBD5E1" : "#6B5B45";

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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back to settings"
            >
              <Text style={[styles.back, { color: theme.colors.text }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Delete account
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={32}
              color={theme.colors.danger}
            />
            <Text style={[styles.heading, { color: textColor }]}>
              Before you delete your account
            </Text>
            <Text style={[styles.body, { color: mutedColor }]}>
              Once account deletion is available, your account will not be
              deleted until 7 days after you submit a deletion request. You
              can continue using your account and cancel the request during
              that period.
            </Text>
            <Text style={[styles.body, { color: mutedColor }]}>
              Deleting your account will not cancel an Apple subscription.
              Manage your subscription separately to avoid future charges.
            </Text>
            <Text style={[styles.notice, { color: textColor }]}>
              Account deletion is not available yet. This screen does not
              submit a request or schedule your account for deletion.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
  },
  headerSpacer: {
    width: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  heading: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
  },
  body: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
  },
  notice: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
});
