import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { setAudioModeAsync } from "expo-audio";
import { getPodcastEpisodeTranscriptOrGenerate } from "../util/http";
import { usePodcastPlayback } from "../components/PodcastPlaybackContext";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { recordRecentPodcast } from "../util/recentHistory";

const SEEK_INTERVAL_SECONDS = 15;
const TAP_MOVE_TOLERANCE = 5;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function PodcastPlayerScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const itemBackground = isDarkMode ? "#000000" : "#FFFFFF";
  const channel = route.params?.channel;
  const episode = route.params?.episode;
  const audioUrl = episode?.episodeUrl || null;
  const { player, status, currentPodcast, loadEpisode } = usePodcastPlayback();
  const [audioModeError, setAudioModeError] = useState(null);
  const [playbackError, setPlaybackError] = useState(null);
  const [progressWidth, setProgressWidth] = useState(0);
  const [dragPosition, setDragPosition] = useState(null);
  const [seekTarget, setSeekTarget] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const dragPositionRef = useRef(null);
  const seekRequestRef = useRef(0);
  const autoplayInputsRef = useRef(null);
  autoplayInputsRef.current = { channel, episode, currentPodcast, status };
  const barPageXRef = useRef(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const pageScrollRef = useRef(null);
  const scrubScrollLockedRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const scrubTouchRef = useRef(null);

  function lockPageScroll() {
    if (scrubScrollLockedRef.current) return;
    scrubScrollLockedRef.current = true;
    pageScrollRef.current?.setNativeProps({
      scrollEnabled: false,
      ...(Platform.OS === "ios" ? { canCancelContentTouches: false } : {}),
    });
  }
  function unlockPageScroll() {
    if (!scrubScrollLockedRef.current) return;
    scrubScrollLockedRef.current = false;
    pageScrollRef.current?.setNativeProps({
      scrollEnabled: true,
      ...(Platform.OS === "ios" ? { canCancelContentTouches: true } : {}),
    });
  }
  const scrubMetricsRef = useRef({ duration: 0, width: 0 });
  const seekToPositionRef = useRef(null);
const scrubResponder = useRef(
    PanResponder.create({
      // Allow the responder to capture movement as long as a touch is active in the zone
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        scrubTouchRef.current !== null &&
        scrubMetricsRef.current.duration > 0 &&
        scrubMetricsRef.current.width > 0 &&
        (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2), // Lower threshold for immediate lock-in
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        barPageXRef.current =
          event.nativeEvent.pageX - event.nativeEvent.locationX;
        scrubTouchRef.current = null;
        scrubActiveRef.current = true;
        lockPageScroll();
        setIsScrubbing(true);
        setSeekTarget(null);
        updateScrubPosition(event.nativeEvent.pageX);
      },
      // Keeps tracking the horizontal screen position (moveX) even if the finger drifts vertically
      onPanResponderMove: (_event, gestureState) =>
        updateScrubPosition(gestureState.moveX),
      onPanResponderRelease: () => finishScrub(dragPositionRef.current),
      onPanResponderTerminate: () => finishScrub(dragPositionRef.current),
    }),
  ).current;
  const [transcriptCues, setTranscriptCues] = useState([]);
  const [isTimedTranscript, setIsTimedTranscript] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(true);
  const [isAutoTranscribing, setIsAutoTranscribing] = useState(false);
  const [transcriptError, setTranscriptError] = useState(null);
  const [transcriptViewportHeight, setTranscriptViewportHeight] = useState(0);
  const transcriptScrollRef = useRef(null);
  const transcriptCueLayouts = useRef({});

  useEffect(() => () => unlockPageScroll(), []);

  useEffect(() => {
    if (!audioUrl) return;
    let isCurrent = true;
    const { channel, episode, currentPodcast, status } =
      autoplayInputsRef.current;

    async function startEpisode() {
      try {
        loadEpisode(channel, episode);
        recordRecentPodcast(user?.uid, channel, episode).catch((error) => {
          console.warn("Unable to save recent podcast:", error);
          Alert.alert("Recent podcasts", error.message);
        });
        if (
          currentPodcast?.episode?.episodeUrl === audioUrl &&
          status.didJustFinish
        ) {
          await player.seekTo(0);
        }
        if (isCurrent) {
          setPlaybackError(null);
          player.play();
        }
      } catch (error) {
        if (isCurrent) {
          setPlaybackError(
            error instanceof Error
              ? error.message
              : "Unable to play this podcast episode.",
          );
        }
      }
    }

    startEpisode();
    return () => {
      isCurrent = false;
    };
  }, [audioUrl, loadEpisode, player, user?.uid]);

  useEffect(() => {
    let isCurrent = true;

    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      if (isCurrent) {
        setAudioModeError(
          error instanceof Error
            ? error.message
            : "Unable to configure audio playback.",
        );
      }
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    transcriptCueLayouts.current = {};
    setTranscriptCues([]);
    setIsTimedTranscript(false);
    setTranscriptError(null);
    setIsAutoTranscribing(false);
    setIsLoadingTranscript(Boolean(channel?.feedUrl || audioUrl));

    getPodcastEpisodeTranscriptOrGenerate(
      {
        feedUrl: channel?.feedUrl,
        audioUrl,
        episodeTitle: episode?.trackName,
        episodeId: episode?.trackId || audioUrl,
        durationSeconds: (episode?.trackTimeMillis || 0) / 1000,
      },
      () => {
        if (isCurrent) setIsAutoTranscribing(true);
      },
    )
      .then(({ cues, isTimed }) => {
        if (isCurrent) {
          setTranscriptCues(cues);
          setIsTimedTranscript(isTimed);
        }
      })
      .catch((error) => {
        console.log(error);
        if (isCurrent) {
          setTranscriptError(
            error instanceof Error
              ? error.message
              : "Unable to load or generate a podcast transcript.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingTranscript(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [channel?.feedUrl, audioUrl, episode?.trackName]);

  const duration =
    status.duration > 0
      ? status.duration
      : (episode?.trackTimeMillis || 0) / 1000;
  const shownPosition = dragPosition ?? seekTarget ?? status.currentTime;
  scrubMetricsRef.current = { duration, width: progressWidth };
  const progress =
    duration > 0 ? Math.min(1, Math.max(0, shownPosition / duration)) : 0;
  const activeCueIndex = transcriptCues.reduce(
    (activeIndex, cue, index) =>
      cue.start <= status.currentTime ? index : activeIndex,
    -1,
  );

  useEffect(() => {
    if (activeCueIndex < 0 || transcriptViewportHeight <= 0) return;
    const cueLayout = transcriptCueLayouts.current[activeCueIndex];
    if (!cueLayout) return;

    const centeredOffset =
      cueLayout.y + cueLayout.height / 2 - transcriptViewportHeight / 2;
    transcriptScrollRef.current?.scrollTo({
      y: Math.max(0, centeredOffset),
      animated: true,
    });
  }, [activeCueIndex, transcriptViewportHeight, transcriptCues]);

  useEffect(() => {
    if (seekTarget === null || isSeeking) return;
    // The player status updates slowly; show the target until it catches up.
    if (Math.abs(status.currentTime - seekTarget) < 1.5) {
      setSeekTarget(null);
      return;
    }
    const timeout = setTimeout(() => setSeekTarget(null), 3000);
    return () => clearTimeout(timeout);
  }, [isSeeking, seekTarget, status.currentTime]);

  async function seekToPosition(seconds) {
    const boundedPosition = Math.max(0, Math.min(duration, seconds));
    const request = ++seekRequestRef.current;
    setDragPosition(null);
    setSeekTarget(boundedPosition);
    setIsSeeking(true);
    setPlaybackError(null);

    try {
      await player.seekTo(boundedPosition);
    } catch (error) {
      if (request === seekRequestRef.current) {
        setSeekTarget(null);
        setPlaybackError(
          error instanceof Error
            ? error.message
            : "Unable to seek in this episode.",
        );
      }
    } finally {
      if (request === seekRequestRef.current) setIsSeeking(false);
    }
  }

  function updateScrubPosition(pageX) {
    const { duration: totalDuration, width } = scrubMetricsRef.current;
    if (width <= 0 || totalDuration <= 0) return;
    const ratio = Math.max(
      0,
      Math.min(1, (pageX - barPageXRef.current) / width),
    );
    const position = ratio * totalDuration;
    dragPositionRef.current = position;
    setDragPosition(position);
  }

  function finishScrub(target) {
    dragPositionRef.current = null;
    scrubActiveRef.current = false;
    setIsScrubbing(false);
    unlockPageScroll();
    if (target !== null) seekToPositionRef.current?.(target);
    else setDragPosition(null);
  }

  seekToPositionRef.current = seekToPosition;

  async function togglePlayback() {
    setPlaybackError(null);

    try {
      if (status.playing) {
        player.pause();
      } else {
        if (status.didJustFinish) await player.seekTo(0);
        player.play();
      }
    } catch (error) {
      setPlaybackError(
        error instanceof Error ? error.message : "Unable to play this episode.",
      );
    }
  }

  const audioError =
    playbackError ||
    status.error ||
    audioModeError ||
    (!audioUrl
      ? "This episode does not provide a playable audio stream."
      : null);

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
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <ScrollView
          ref={pageScrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isScrubbing}
          canCancelContentTouches={!isScrubbing}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: itemBackground }]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back to episodes"
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={28}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <View style={styles.heading}>
              <Text
                style={[styles.channelTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {channel?.collectionName || "Podcast"}
              </Text>
            </View>
            <View style={styles.topBarSpacer} />
          </View>

          <View
            style={[
              styles.transcriptPanel,
              { backgroundColor: itemBackground },
            ]}
          >
            {transcriptCues.length > 0 ? (
              <ScrollView
                ref={transcriptScrollRef}
                style={styles.transcriptScroll}
                contentContainerStyle={styles.transcriptContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                scrollEnabled={!isScrubbing}
                onLayout={(event) =>
                  setTranscriptViewportHeight(event.nativeEvent.layout.height)
                }
              >
                {transcriptCues.map((cue, index) => (
                  <Text
                    key={`${cue.start}-${index}`}
                    onLayout={(event) => {
                      transcriptCueLayouts.current[index] = {
                        y: event.nativeEvent.layout.y,
                        height: event.nativeEvent.layout.height,
                      };
                      if (index === activeCueIndex) {
                        transcriptScrollRef.current?.scrollTo({
                          y: Math.max(
                            0,
                            event.nativeEvent.layout.y +
                              event.nativeEvent.layout.height / 2 -
                              transcriptViewportHeight / 2,
                          ),
                          animated: false,
                        });
                      }
                    }}
                    style={[
                      styles.transcriptCue,
                      {
                        color:
                          index === activeCueIndex
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                        opacity: index === activeCueIndex ? 1 : 0.55,
                      },
                      index === activeCueIndex && styles.activeTranscriptCue,
                    ]}
                  >
                    {cue.text}
                  </Text>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.transcriptMessage}>
                {isLoadingTranscript ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : null}
                <Text
                  style={[
                    styles.transcriptPlaceholder,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isLoadingTranscript
                    ? isAutoTranscribing
                      ? "Generating timed subtitles with AI..."
                      : "Checking for subtitles..."
                    : transcriptError ||
                      "Synchronized subtitles aren't available for this episode."}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.episodeHeading}>
            {channel?.artworkUrl600 || channel?.artworkUrl100 ? (
              <Image
                source={{
                  uri: channel.artworkUrl600 || channel.artworkUrl100,
                }}
                style={styles.podcastArtwork}
                accessibilityLabel={`${channel?.collectionName || "Podcast"} profile picture`}
              />
            ) : (
              <View
                style={[
                  styles.podcastArtwork,
                  styles.podcastArtworkFallback,
                  { backgroundColor: theme.colors.bluePastel },
                ]}
              >
                <MaterialCommunityIcons
                  name="podcast"
                  size={24}
                  color={theme.colors.blueDark}
                />
              </View>
            )}
            <View style={styles.episodeText}>
              <Text
                style={[styles.episodeTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {episode?.trackName || "Untitled episode"}
              </Text>
              <Text
                style={[
                  styles.artistName,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {episode?.artistName || channel?.artistName || ""}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="podcast"
              size={24}
              color={theme.colors.primary}
            />
          </View>

          <View
            style={styles.progressSection}
            onLayout={(event) =>
              setProgressWidth(event.nativeEvent.layout.width)
            }
          >
            <View
              style={styles.progressTouchArea}
              {...scrubResponder.panHandlers}
              onTouchStart={(event) => {
                scrubTouchRef.current = null;
                if (
                  scrubMetricsRef.current.duration > 0 &&
                  scrubMetricsRef.current.width > 0
                ) {
                  const { pageX, pageY, locationX } = event.nativeEvent;
                  scrubTouchRef.current = {
                    pageX,
                    pageY,
                    barPageX: pageX - locationX,
                    moved: false,
                  };
                }
              }}
              onTouchMove={(event) => {
                const touch = scrubTouchRef.current;
                if (!touch) return;
                const { pageX, pageY } = event.nativeEvent;
                if (
                  Math.abs(pageX - touch.pageX) > TAP_MOVE_TOLERANCE ||
                  Math.abs(pageY - touch.pageY) > TAP_MOVE_TOLERANCE
                ) {
                  touch.moved = true;
                }
              }}
              onTouchEnd={(event) => {
                const touch = scrubTouchRef.current;
                scrubTouchRef.current = null;
                if (!touch || touch.moved || scrubActiveRef.current) return;
                const { pageX, pageY } = event.nativeEvent;
                if (
                  Math.abs(pageX - touch.pageX) > TAP_MOVE_TOLERANCE ||
                  Math.abs(pageY - touch.pageY) > TAP_MOVE_TOLERANCE
                )
                  return;
                barPageXRef.current = touch.barPageX;
                updateScrubPosition(pageX);
                finishScrub(dragPositionRef.current);
              }}
              onTouchCancel={() => {
                scrubTouchRef.current = null;
              }}
              accessibilityRole="adjustable"
              accessibilityLabel="Episode progress"
              accessibilityValue={{
                min: 0,
                max: duration,
                now: shownPosition,
              }}
              accessibilityActions={[
                { name: "increment", label: "Skip forward 15 seconds" },
                { name: "decrement", label: "Rewind 15 seconds" },
              ]}
              onAccessibilityAction={(event) => {
                const adjustment =
                  event.nativeEvent.actionName === "increment"
                    ? SEEK_INTERVAL_SECONDS
                    : -SEEK_INTERVAL_SECONDS;
                seekToPosition(status.currentTime + adjustment);
              }}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.progressTrack,
                  isScrubbing && styles.progressTrackActive,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    isScrubbing && styles.progressFillActive,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    isScrubbing && styles.progressThumbActive,
                    {
                      left: `${progress * 100}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.timeLabels}>
              <Text
                style={[styles.timeText, { color: theme.colors.textSecondary }]}
              >
                {formatTime(shownPosition)}
              </Text>
              <Text
                style={[styles.timeText, { color: theme.colors.textSecondary }]}
              >
                -{formatTime(Math.max(0, duration - shownPosition))}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() =>
                seekToPosition(status.currentTime - SEEK_INTERVAL_SECONDS)
              }
              disabled={!audioUrl || duration <= 0}
              accessibilityRole="button"
              accessibilityLabel="Rewind 15 seconds"
            >
              <MaterialCommunityIcons
                name="rewind-15"
                size={38}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.playButton,
                { backgroundColor: theme.colors.primary },
                (!audioUrl || status.isBuffering) && styles.disabledButton,
              ]}
              onPress={togglePlayback}
              disabled={!audioUrl || status.isBuffering}
              accessibilityRole="button"
              accessibilityLabel={
                status.playing ? "Pause episode" : "Play episode"
              }
            >
              {status.isBuffering ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primaryText}
                />
              ) : (
                <MaterialCommunityIcons
                  name={status.playing ? "pause" : "play"}
                  size={38}
                  color={theme.colors.primaryText}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() =>
                seekToPosition(status.currentTime + SEEK_INTERVAL_SECONDS)
              }
              disabled={!audioUrl || duration <= 0}
              accessibilityRole="button"
              accessibilityLabel="Fast forward 15 seconds"
            >
              <MaterialCommunityIcons
                name="fast-forward-15"
                size={38}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {audioError ? (
            <Text style={[styles.errorText, { color: theme.colors.orange }]}>
              {audioError}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  topBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  channelTitle: { marginTop: 3, fontSize: 14, fontWeight: "700" },
  topBarSpacer: { width: 42 },
  episodeHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  podcastArtwork: {
    width: 54,
    height: 54,
    marginRight: 14,
    borderRadius: 12,
  },
  podcastArtworkFallback: { alignItems: "center", justifyContent: "center" },
  episodeText: { flex: 1, marginRight: 14 },
  episodeTitle: { fontSize: 21, fontWeight: "900", lineHeight: 27 },
  artistName: { marginTop: 6, fontSize: 15, fontWeight: "600" },
  transcriptPanel: {
    height: "60%",
    marginBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderRadius: 20,
  },
  transcriptHeading: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  transcriptScroll: { flex: 1 },
  transcriptContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 96,
  },
  transcriptCue: {
    marginVertical: 16,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 32,
    textAlign: "center",
  },
  activeTranscriptCue: { fontSize: 26, fontWeight: "900", lineHeight: 36 },
  transcriptMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  transcriptPlaceholder: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  progressSection: { width: "100%" },
  progressTouchArea: { 
    justifyContent: "center", 
    height: 54, // Expanded hot zone for easier grabbing/drifting
    marginVertical: -13, // Optional: negative margins to keep layout spacing intact 
  },
  progressTrack: { height: 4, borderRadius: 2 },
  progressTrackActive: { height: 14, borderRadius: 7 },
  progressFill: { height: 4, borderRadius: 2 },
  progressFillActive: { height: 14, borderRadius: 7 },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
  },
  progressThumbActive: { top: 1 },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: { fontSize: 12, fontVariant: ["tabular-nums"] },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  skipButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.55 },
  errorText: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
