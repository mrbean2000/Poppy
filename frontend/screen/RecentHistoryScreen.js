import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { usePodcastPlayback } from "../components/PodcastPlaybackContext";
import { getRecentHistory } from "../util/recentHistory";
import { getArticleProgress } from "../util/articleProgress";

function groupByDate(items, kind) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups = new Map();

  items.forEach((item) => {
    if (typeof item.viewedAt !== "string") {
      throw new Error(`Recent ${kind} dates are unavailable. Update the history server and try again.`);
    }
    const date = new Date(item.viewedAt);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`A recent ${kind} item has an invalid date.`);
    }
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const key = day.getTime();
    if (!groups.has(key)) {
      const title =
        key === today.getTime()
          ? "Today"
          : key === yesterday.getTime()
            ? "Yesterday"
            : day.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
      groups.set(key, { title, data: [] });
    }
    groups.get(key).data.push(item);
  });

  return Array.from(groups.values());
}

export default function RecentHistoryScreen({ navigation, route }) {
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { currentProgress, getSavedProgress } = usePodcastPlayback();
  const isArticle = route.name === "RecentArticles";
  const kind = isArticle ? "articles" : "podcasts";
  const [sections, setSections] = useState([]);
  const [savedProgress, setSavedProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      getRecentHistory(user?.uid, kind)
        .then(async (items) => {
          const grouped = groupByDate(items, kind);
          const progress = isArticle
            ? await getArticleProgress(user?.uid, items)
            : await getSavedProgress(items.map((item) => item.episode.episodeUrl));
          if (active) {
            setSections(grouped);
            setSavedProgress(progress);
          }
        })
        .catch((failure) => {
          console.warn(`Unable to load recent ${kind}:`, failure);
          if (active) {
            setError(
              failure instanceof Error
                ? failure.message
                : `Unable to load recent ${kind}.`,
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [user?.uid, attempt, kind, isArticle, getSavedProgress]),
  );

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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {isArticle ? "Recent articles" : "Recent podcasts"}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : error ? (
          <View style={styles.message}>
            <Text style={{ color: theme.colors.danger }}>{error}</Text>
            <TouchableOpacity
              onPress={() => setAttempt((value) => value + 1)}
              accessibilityRole="button"
            >
              <Text style={[styles.retry, { color: theme.colors.primary }]}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            extraData={currentProgress}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <Text style={{ color: theme.colors.textSecondary }}>
                No recent {kind} yet.
              </Text>
            }
            renderSectionHeader={({ section }) => (
              <Text style={[styles.section, { color: theme.colors.text }]}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => {
              const artwork = isArticle ? item.imageUrl : (
                item.episode?.artworkUrl600 ||
                item.episode?.artworkUrl160 ||
                item.episode?.artworkUrl100 ||
                item.channel?.artworkUrl600 ||
                item.channel?.artworkUrl100
              );
              const progress = isArticle
                ? savedProgress[item.key]
                : currentProgress?.episodeUrl === item.episode.episodeUrl
                  ? currentProgress
                  : savedProgress[item.episode.episodeUrl];
              const hasProgress = progress !== undefined && progress !== null;
              const progressRatio = !hasProgress
                ? 0
                : isArticle
                  ? progress
                  : Math.min(1, Math.max(0, progress.position / progress.duration));
              const minutesLeft = !isArticle && hasProgress
                ? Math.ceil(Math.max(0, progress.duration - progress.position) / 60)
                : null;
              return (
                <TouchableOpacity
                  style={[styles.item, { borderColor: theme.colors.border }]}
                  onPress={() => {
                    if (isArticle) {
                      navigation.navigate("Reader", {
                        id: item.id,
                        title: item.title,
                        imageUrl: item.imageUrl,
                        readingLanguage: item.language,
                        readingLanguageId: item.languageId,
                      });
                    } else {
                      navigation.navigate("PodcastPlayer", {
                        channel: item.channel,
                        episode: item.episode,
                      });
                    }
                  }}
                  accessibilityRole="button"
                >
                  {artwork ? (
                    <Image source={{ uri: artwork }} style={styles.artwork} />
                  ) : (
                    <View style={[styles.artwork, styles.artworkFallback]}>
                      <MaterialCommunityIcons
                        name={isArticle ? "book-open-page-variant-outline" : "podcast"}
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                  <View style={styles.itemText}>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.itemTitle, { color: theme.colors.text }]}
                    >
                      {isArticle
                        ? item.title
                        : item.episode?.trackName || "Podcast episode"}
                    </Text>
                    {!isArticle && (
                      <Text
                        numberOfLines={1}
                        style={{ color: theme.colors.textSecondary }}
                      >
                        {item.episode?.artistName ||
                          item.channel?.artistName ||
                          "Podcast"}
                      </Text>
                    )}
                    <View style={styles.progressRow}>
                      <View
                        style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
                        accessibilityRole="progressbar"
                        accessibilityLabel={isArticle ? "Reading progress" : "Podcast progress"}
                        accessibilityValue={hasProgress ? { min: 0, max: 100, now: Math.round(progressRatio * 100) } : { text: "Progress unavailable" }}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progressRatio * 100}%`, backgroundColor: theme.colors.primary },
                          ]}
                        />
                      </View>
                      <Text style={[styles.remaining, { color: theme.colors.textSecondary }]}>
                        {!hasProgress
                          ? "Progress unavailable"
                          : isArticle
                            ? `${Math.round(progressRatio * 100)}%`
                            : `${minutesLeft} ${minutesLeft === 1 ? "min" : "mins"} left`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 8, marginRight: 8 },
  title: { flex: 1, fontSize: 24, fontWeight: "900" },
  message: { paddingHorizontal: 20 },
  retry: { marginTop: 12, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 140 },
  section: { fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  artwork: { width: 64, height: 64, borderRadius: 4 },
  artworkFallback: { alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 15, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  remaining: { fontSize: 12, marginLeft: 8 },
});
