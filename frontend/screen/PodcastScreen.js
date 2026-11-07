import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getPodcastEpisodes, searchPodcasts } from "../util/http";
import { useTheme } from "../theme/ThemeContext";

export default function PodcastScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const itemBackground = isDarkMode ? "#000000" : "#FFFFFF";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("channel");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [episodeError, setEpisodeError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const searchRequestRef = useRef(0);
  const episodeRequestRef = useRef(0);
  const resultsScrollRef = useRef(null);

  async function handleSearch() {
    Keyboard.dismiss();
    const term = searchQuery.trim();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (!term) {
      setSearchResults([]);
      setErrorMessage(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const results = await searchPodcasts(term, searchType);
      if (searchRequestRef.current === requestId) {
        setSearchResults(results);
      }
    } catch (error) {
      if (searchRequestRef.current === requestId) {
        setSearchResults([]);
        setErrorMessage(error.message);
      }
    } finally {
      if (searchRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }

  function handleSearchTypeChange(nextSearchType) {
    if (nextSearchType === searchType) return;

    searchRequestRef.current += 1;
    episodeRequestRef.current += 1;
    setSearchType(nextSearchType);
    setSearchResults([]);
    setSelectedChannel(null);
    setEpisodes([]);
    setEpisodeError(null);
    setErrorMessage(null);
    setIsSearching(false);
    setIsLoadingEpisodes(false);
  }

  async function openChannel(channel) {
    if (!channel.collectionId) {
      setErrorMessage("This podcast channel does not have a valid iTunes ID.");
      return;
    }

    navigation.navigate("PodcastEpisodes", { channel });
  }

  function closeChannel() {
    episodeRequestRef.current += 1;
    resultsScrollRef.current?.scrollToOffset({ offset: 0, animated: false });
    setSelectedChannel(null);
    setEpisodes([]);
    setEpisodeError(null);
    setIsLoadingEpisodes(false);
  }

  const listData = selectedChannel
    ? isLoadingEpisodes || episodeError
      ? []
      : episodes
    : searchResults;

  function renderEmptyState() {
    if (selectedChannel) {
      if (isLoadingEpisodes) {
        return (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}
            >
              Loading episodes...
            </Text>
          </View>
        );
      }

      if (episodeError) {
        return (
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
              {episodeError}
            </Text>
          </View>
        );
      }

      return (
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
      );
    }

    return (
      <View style={styles.emptyState}>
        {isSearching ? (
          <>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}
            >
              {`Searching ${searchType === "episode" ? "episodes" : "channels"}...`}
            </Text>
          </>
        ) : errorMessage ? (
          <>
            <MaterialCommunityIcons
              name="wifi-alert"
              size={40}
              color={theme.colors.orange}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Search unavailable
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {errorMessage}
            </Text>
          </>
        ) : searchQuery.trim() ? (
          <>
            <MaterialCommunityIcons
              name="podcast"
              size={44}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Try a different search.
            </Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons
              name="headphones"
              size={44}
              color={theme.colors.blue}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              What would you like to hear?
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {`Search by ${searchType === "episode" ? "episode" : "podcast"} title or topic.`}
            </Text>
          </>
        )}
      </View>
    );
  }

  function renderListItem({ item, index }) {
    if (selectedChannel) {
      const artwork =
        item.artworkUrl600 ||
        item.artworkUrl160 ||
        item.artworkUrl100 ||
        selectedChannel.artworkUrl600 ||
        selectedChannel.artworkUrl100;

      return (
        <View
          style={[
            styles.episodeCard,
            {
              backgroundColor: itemBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {artwork ? (
            <Image
              source={{ uri: artwork }}
              style={styles.episodeArtwork}
              accessibilityLabel={`${item.trackName || "Episode"} cover art`}
            />
          ) : (
            <View
              style={[
                styles.episodeArtwork,
                styles.episodeArtworkPlaceholder,
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
          <View
            style={[
              styles.episodeNumber,
              { backgroundColor: theme.colors.bluePastel },
            ]}
          >
            <Text
              style={[
                styles.episodeNumberText,
                { color: theme.colors.blueDark },
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <View style={styles.podcastInfo}>
            <Text
              style={[styles.podcastTitle, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.trackName || "Untitled episode"}
            </Text>
            <Text
              style={[
                styles.podcastArtist,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {[
                item.releaseDate
                  ? new Date(item.releaseDate).toLocaleDateString()
                  : null,
                item.trackTimeMillis
                  ? `${Math.round(item.trackTimeMillis / 60000)} min`
                  : null,
              ]
                .filter(Boolean)
                .join(" Â· ") || "Podcast episode"}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.podcastCard,
          {
            backgroundColor: itemBackground,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => openChannel(item)}
        disabled={searchType !== "channel"}
        accessibilityRole={searchType === "channel" ? "button" : undefined}
        accessibilityLabel={
          searchType === "channel"
            ? `Show episodes from ${item.collectionName || item.trackName || "podcast"}`
            : undefined
        }
      >
        {item.artworkUrl600 || item.artworkUrl100 ? (
          <Image
            source={{ uri: item.artworkUrl600 || item.artworkUrl100 }}
            style={styles.artwork}
          />
        ) : (
          <View
            style={[
              styles.artwork,
              styles.artworkPlaceholder,
              { backgroundColor: theme.colors.bluePastel },
            ]}
          >
            <MaterialCommunityIcons
              name={
                searchType === "episode" ? "play-circle-outline" : "podcast"
              }
              size={30}
              color={theme.colors.blueDark}
            />
          </View>
        )}
        <View style={styles.podcastInfo}>
          <Text
            style={[styles.podcastTitle, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {searchType === "episode"
              ? item.trackName || item.collectionName || "Untitled episode"
              : item.collectionName || item.trackName || "Untitled podcast"}
          </Text>
          {(
            searchType === "episode"
              ? item.collectionName || item.artistName
              : item.artistName
          ) ? (
            <Text
              style={[
                styles.podcastArtist,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {searchType === "episode"
                ? item.collectionName || item.artistName
                : item.artistName}
            </Text>
          ) : null}
          {item.primaryGenreName ? (
            <Text
              style={[
                styles.podcastGenre,
                {
                  color: theme.colors.blueDark,
                  backgroundColor: theme.colors.bluePastel,
                },
              ]}
              numberOfLines={1}
            >
              {item.primaryGenreName}
            </Text>
          ) : null}
        </View>
        {searchType === "channel" ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={theme.colors.textSecondary}
          />
        ) : null}
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
      style={styles.container}
      resizeMode="cover"
    >
    <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}>
      <View style={styles.fixedHeader}>
        {selectedChannel ? (
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: itemBackground },
              ]}
              onPress={closeChannel}
              accessibilityRole="button"
              accessibilityLabel="Back to podcast search results"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            {selectedChannel.artworkUrl600 || selectedChannel.artworkUrl100 ? (
              <Image
                source={{
                  uri:
                    selectedChannel.artworkUrl600 ||
                    selectedChannel.artworkUrl100,
                }}
                style={styles.channelArtwork}
                accessibilityLabel={`${selectedChannel.collectionName || "Podcast"} cover art`}
              />
            ) : (
              <View
                style={[
                  styles.channelArtwork,
                  styles.channelArtworkPlaceholder,
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
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {selectedChannel.collectionName || "Podcast episodes"}
            </Text>
            {selectedChannel.artistName ? (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                {selectedChannel.artistName}
              </Text>
            ) : null}
            <Text
              style={[
                styles.resultsHeading,
                { color: theme.colors.textSecondary },
              ]}
            >
              {episodes.length ? `${episodes.length} episodes` : "Episodes"}
            </Text>
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: itemBackground },
              ]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Find a podcast
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Search for a podcast channel or a specific episode.
            </Text>
            <View
              style={[
                styles.searchTypeSwitch,
                { backgroundColor: itemBackground },
              ]}
              accessibilityRole="tablist"
              accessibilityLabel="Podcast search type"
            >
              {[
                { value: "channel", label: "Channels" },
                { value: "episode", label: "Episodes" },
              ].map((option) => {
                const isSelected = searchType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.searchTypeOption,
                      isSelected && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => handleSearchTypeChange(option.value)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Search ${option.label.toLowerCase()}`}
                  >
                    <Text
                      style={[
                        styles.searchTypeLabel,
                        {
                          color: isSelected
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: itemBackground,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="What do you want to listen to?"
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Search podcasts"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                  style={{ marginRight: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  { backgroundColor: theme.colors.primary },
                  isSearching && styles.searchButtonDisabled,
                ]}
                onPress={handleSearch}
                disabled={isSearching}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
            {searchResults.length > 0 && (
              <Text
                style={[
                  styles.resultsHeading,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {`${searchResults.length} ${
                  searchType === "episode" ? "episodes" : "channels"
                } shown`}
              </Text>
            )}
          </View>
        )}
      </View>
      <FlatList
        ref={resultsScrollRef}
        style={styles.resultsScroll}
        contentContainerStyle={styles.listContent}
        data={listData}
        keyExtractor={(item, index) => {
          const itemId = selectedChannel
            ? (item.trackId ?? item.episodeUrl ?? "episode")
            : (item.collectionId ?? item.trackId ?? item.feedUrl ?? "podcast");
          return `${itemId}-${index}`;
        }}
        renderItem={renderListItem}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  resultsScroll: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: { marginBottom: 14 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  searchTypeSwitch: {
    alignSelf: "flex-start",
    flexDirection: "row",
    marginTop: 18,
    padding: 4,
    borderRadius: 14,
  },
  searchTypeOption: {
    minWidth: 96,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 11,
  },
  searchTypeLabel: { fontSize: 13, fontWeight: "800" },
  searchBox: {
    minHeight: 56,
    marginTop: 22,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: { opacity: 0.6 },
  resultsHeading: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: "700",
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
  podcastCard: {
    minHeight: 104,
    marginBottom: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
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
  episodeNumber: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  episodeNumberText: { fontSize: 14, fontWeight: "900" },
  channelArtwork: {
    width: 128,
    height: 128,
    marginBottom: 16,
    borderRadius: 18,
  },
  channelArtworkPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  episodeArtwork: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  episodeArtworkPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  artwork: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  artworkPlaceholder: { alignItems: "center", justifyContent: "center" },
  podcastInfo: { flex: 1, marginHorizontal: 12 },
  podcastTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  podcastArtist: { marginTop: 4, fontSize: 13 },
  podcastGenre: {
    alignSelf: "flex-start",
    overflow: "hidden",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
});
