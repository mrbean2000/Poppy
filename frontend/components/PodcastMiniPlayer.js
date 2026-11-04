import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePodcastPlayback } from "./PodcastPlaybackContext";
import { useTheme } from "../theme/ThemeContext";

export default function PodcastMiniPlayer() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { player, status, currentPodcast, clearEpisode } = usePodcastPlayback();

  if (!currentPodcast) return null;

  const { channel, episode } = currentPodcast;
  const artwork =
    episode?.artworkUrl160 ||
    episode?.artworkUrl100 ||
    channel?.artworkUrl100;

  function openFullPlayer() {
    navigation.navigate("PodcastPlayer", { channel, episode });
  }

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 8),
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.episodeButton}
        onPress={openFullPlayer}
        accessibilityRole="button"
        accessibilityLabel={`Open player for ${episode?.trackName || "podcast episode"}`}
      >
        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.artwork} />
        ) : (
          <View
            style={[
              styles.artwork,
              styles.artworkFallback,
              { backgroundColor: theme.colors.bluePastel },
            ]}
          >
            <MaterialCommunityIcons
              name="podcast"
              size={23}
              color={theme.colors.blueDark}
            />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {episode?.trackName || "Podcast episode"}
          </Text>
          <Text
            style={[styles.artist, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {episode?.artistName || channel?.artistName || "Podcast"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.control}
        onPress={togglePlayback}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause episode" : "Play episode"}
      >
        <MaterialCommunityIcons
          name={status.playing ? "pause" : "play"}
          size={27}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.control}
        onPress={clearEpisode}
        accessibilityRole="button"
        accessibilityLabel="Close mini player"
      >
        <MaterialCommunityIcons
          name="close"
          size={22}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  episodeButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  artwork: { width: 46, height: 46, borderRadius: 8 },
  artworkFallback: { alignItems: "center", justifyContent: "center" },
  titleContainer: { flex: 1, minWidth: 0, marginLeft: 10 },
  title: { fontSize: 13, fontWeight: "800" },
  artist: { marginTop: 3, fontSize: 11 },
  control: {
    width: 40,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
