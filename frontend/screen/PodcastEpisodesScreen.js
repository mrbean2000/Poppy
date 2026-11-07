import { useEffect, useState } from "react";
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
import { getPodcastEpisodes } from "../util/http";
import { useTheme } from "../theme/ThemeContext";

export default function PodcastEpisodesScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const itemBackground = isDarkMode ? "#000000" : "#FFFFFF";
  const channel = route.params?.channel;
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadEpisodes() {
      if (!channel?.collectionId) {
        setErrorMessage("This podcast channel does not have a valid iTunes ID.");
        setIsLoading(false);
        return;
      }

      try {
        const results = await getPodcastEpisodes(channel.collectionId);
        if (isCurrent) setEpisodes(results);
      } catch (error) {
        if (isCurrent) setErrorMessage(error.message);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadEpisodes();
    return () => {
      isCurrent = false;
    };
  }, [channel?.collectionId]);

  const channelArtwork = channel?.artworkUrl600 || channel?.artworkUrl100;

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
    <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: itemBackground },
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to podcast search results"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        {channelArtwork ? (
          <Image
            source={{ uri: channelArtwork }}
            style={styles.channelArtwork}
            accessibilityLabel={`${channel?.collectionName || "Podcast"} cover art`}
          />
        ) : (
          <View
            style={[
              styles.channelArtwork,
              styles.artworkPlaceholder,
              { backgroundColor: theme.colors.bluePastel },
            ]}
          >
            <MaterialCommunityIcons
              name="podcast"
              size={44}
              color={theme.colors.blueDark}
            />
          </View>
        )}
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {channel?.collectionName || "Podcast episodes"}
        </Text>
        {channel?.artistName ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {channel.artistName}
          </Text>
        ) : null}
        <Text style={[styles.resultsHeading, { color: theme.colors.textSecondary }]}>
          {isLoading
            ? "Loading episodes..."
            : `${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`}
        </Text>
      </View>

      <ScrollView
        style={styles.episodesScroll}
        contentContainerStyle={styles.listContent}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
              Loading episodes...
            </Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="wifi-alert"
              size={40}
              color={theme.colors.orange}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Episodes unavailable
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {errorMessage}
            </Text>
          </View>
        ) : episodes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="podcast"
              size={44}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No episodes found
            </Text>
          </View>
        ) : (
          episodes.map((episode, index) => {
            const artwork =
              episode.artworkUrl600 ||
              episode.artworkUrl160 ||
              episode.artworkUrl100 ||
              channelArtwork;

            return (
              <TouchableOpacity
                key={String(episode.trackId ?? episode.episodeUrl ?? index)}
                style={[
                  styles.episodeCard,
                  {
                    backgroundColor: itemBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("PodcastPlayer", { channel, episode })
                }
                accessibilityRole="button"
                accessibilityLabel={`Play ${episode.trackName || "podcast episode"}`}
              >
                {artwork ? (
                  <Image
                    source={{ uri: artwork }}
                    style={styles.episodeArtwork}
                    accessibilityLabel={`${episode.trackName || "Episode"} cover art`}
                  />
                ) : (
                  <View
                    style={[
                      styles.episodeArtwork,
                      styles.artworkPlaceholder,
                      { backgroundColor: theme.colors.bluePastel },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="play-circle-outline"
                      size={26}
                      color={theme.colors.blueDark}
                    />
                  </View>
                )}
                <View style={styles.episodeInfo}>
                  <Text
                    style={[styles.episodeTitle, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {episode.trackName || "Untitled episode"}
                  </Text>
                  <Text
                    style={[
                      styles.episodeMetadata,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {[
                      episode.releaseDate
                        ? new Date(episode.releaseDate).toLocaleDateString()
                        : null,
                      episode.trackTimeMillis
                        ? `${Math.round(episode.trackTimeMillis / 60000)} min`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" Â· ") || "Podcast episode"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    marginBottom: 18,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  channelArtwork: {
    width: 128,
    height: 128,
    marginBottom: 16,
    borderRadius: 18,
  },
  artworkPlaceholder: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 14 },
  resultsHeading: { marginTop: 12, fontSize: 13, fontWeight: "700" },
  episodesScroll: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  episodeCard: {
    minHeight: 82,
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
  },
  episodeArtwork: { width: 58, height: 58, borderRadius: 10 },
  episodeInfo: { flex: 1, marginLeft: 12 },
  episodeTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  episodeMetadata: { marginTop: 4, fontSize: 13 },
});
