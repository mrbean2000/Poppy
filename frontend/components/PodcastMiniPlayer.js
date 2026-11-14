import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePodcastPlayback } from "./PodcastPlaybackContext";
import { useTheme } from "../theme/ThemeContext";

function ScrollingTitle({ title, color }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [measurement, setMeasurement] = useState(null);
  const textWidth = measurement?.title === title ? measurement.width : 0;
  const distance = Math.max(0, textWidth - containerWidth);

  useEffect(() => {
    translateX.setValue(0);
    if (!containerWidth || distance <= 0) return undefined;

    const duration = Math.max(1000, (distance / 30) * 1000);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(translateX, {
          toValue: -distance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(1000),
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [containerWidth, distance, title, translateX]);

  return (
    <View
      style={styles.titleViewport}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Text
        key={title}
        accessible={false}
        pointerEvents="none"
        style={[styles.title, styles.titleMeasurement]}
        numberOfLines={1}
        onTextLayout={(event) => {
          const width = event.nativeEvent.lines[0]?.width;
          if (Number.isFinite(width)) {
            setMeasurement({ title, width: Math.ceil(width) });
          }
        }}
      >
        {title}
      </Text>
      <Animated.Text
        style={[
          styles.title,
          {
            color,
            width: Math.max(containerWidth, textWidth),
            transform: [{ translateX }],
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Animated.Text>
    </View>
  );
}

export default function PodcastMiniPlayer() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { player, status, currentPodcast, clearEpisode } = usePodcastPlayback();

  if (!currentPodcast) return null;

  const { channel, episode } = currentPodcast;
  const artwork =
    episode?.artworkUrl160 ||
    episode?.artworkUrl100 ||
    channel?.artworkUrl100;
  const duration =
    Number.isFinite(status.duration) && status.duration > 0
      ? status.duration
      : (episode?.trackTimeMillis || 0) / 1000;
  const progress =
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isFinite(status.currentTime)
      ? Math.min(1, Math.max(0, status.currentTime / duration))
      : 0;

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
          backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
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
          <ScrollingTitle
            title={episode?.trackName || "Podcast episode"}
            color={theme.colors.text}
          />
          <Text
            style={[styles.artist, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {episode?.artistName || channel?.artistName || "Podcast"}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.border },
            ]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Episode progress"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(progress * 100),
            }}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
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
  titleViewport: { overflow: "hidden" },
  titleMeasurement: { position: "absolute", opacity: 0, width: 10000 },
  title: { fontSize: 13, fontWeight: "800" },
  artist: { marginTop: 3, fontSize: 11 },
  progressTrack: {
    height: 3,
    marginTop: 5,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  control: {
    width: 40,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
