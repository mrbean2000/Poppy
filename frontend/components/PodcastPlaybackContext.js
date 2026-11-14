import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useAuth } from "../context/AuthContext";

const PodcastPlaybackContext = createContext(null);
const STORAGE_KEY_PREFIX = "@poppy/podcast-mini-player/";
const PROGRESS_KEY_PREFIX = "@poppy/podcast-progress/";
let storageWrites = Promise.resolve();

function progressKey(userId, episodeUrl) {
  return `${PROGRESS_KEY_PREFIX}${encodeURIComponent(userId)}/${encodeURIComponent(episodeUrl)}`;
}

function queueStorageWrite(operation, description = "podcast mini player") {
  storageWrites = storageWrites.then(operation).catch((error) => {
    console.warn(`Unable to save ${description}:`, error);
  });
}

export function PodcastPlaybackProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.uid;
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const currentAudioUrlRef = useRef(null);
  const changeRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const replacedStatusRef = useRef(null);
  const progressRef = useRef(null);
  const lastProgressWriteRef = useRef({ time: 0, progress: null });
  const [savedPodcast, setSavedPodcast] = useState(null);
  const currentPodcast =
    savedPodcast && savedPodcast.userId === userId
      ? savedPodcast.podcast
      : null;

  const saveProgress = useCallback((progress) => {
    if (!progress) return;
    lastProgressWriteRef.current = { time: Date.now(), progress };
    queueStorageWrite(() =>
      AsyncStorage.setItem(
        progressKey(progress.userId, progress.episodeUrl),
        JSON.stringify({
          position: progress.position,
          duration: progress.duration,
        }),
      ),
      "podcast progress",
    );
  }, []);

  const getSavedProgress = useCallback(async (episodeUrls) => {
    if (!userId) throw new Error("Sign in to view podcast progress.");
    await storageWrites;
    const values = await AsyncStorage.multiGet(
      episodeUrls.map((url) => progressKey(userId, url)),
    );
    const progress = Object.create(null);
    values.forEach(([, value], index) => {
      if (!value) return;
      const saved = JSON.parse(value);
      if (
        !Number.isFinite(saved?.position) ||
        saved.position < 0 ||
        !Number.isFinite(saved?.duration) ||
        saved.duration <= 0
      ) {
        throw new Error("Saved podcast progress is invalid.");
      }
      progress[episodeUrls[index]] = saved;
    });
    return progress;
  }, [userId]);

  useEffect(() => {
    let isCurrent = true;
    const change = ++changeRef.current;
    currentAudioUrlRef.current = null;
    setSavedPodcast(null);
    player.pause();
    player.clearLockScreenControls();

    if (userId) {
      async function restoreEpisode() {
        try {
          await storageWrites;
          const value = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + userId);
          if (!isCurrent || changeRef.current !== change || !value) return;

          const podcast = JSON.parse(value);
          if (
            typeof podcast?.episode?.episodeUrl !== "string" ||
            !podcast.episode.episodeUrl
          ) {
            throw new Error("The saved podcast episode is invalid.");
          }

          replacedStatusRef.current = statusRef.current;
          player.replace(podcast.episode.episodeUrl);
          currentAudioUrlRef.current = podcast.episode.episodeUrl;
          setSavedPodcast({ userId, podcast });
          setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
            console.warn("Unable to configure podcast audio playback:", error);
          });
        } catch (error) {
          console.warn("Unable to restore the podcast mini player:", error);
        }
      }

      restoreEpisode();
    }

    return () => {
      saveProgress(progressRef.current);
      progressRef.current = null;
      isCurrent = false;
    };
  }, [player, userId, saveProgress]);

  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  const position = status.didJustFinish ? duration : status.currentTime;
  const currentProgress =
    currentPodcast &&
    currentAudioUrlRef.current === currentPodcast.episode?.episodeUrl &&
    status !== replacedStatusRef.current &&
    status.isLoaded &&
    duration > 0 &&
    Number.isFinite(position) &&
    position >= 0 &&
    (status.playing ||
      status.didJustFinish ||
      position > 0 ||
      progressRef.current?.episodeUrl === currentPodcast.episode.episodeUrl)
      ? {
          userId,
          episodeUrl: currentPodcast.episode.episodeUrl,
          position: Math.min(position, duration),
          duration,
        }
      : null;

  useEffect(() => {
    if (!currentProgress) return;
    progressRef.current = currentProgress;
    const last = lastProgressWriteRef.current;
    const changed =
      last.progress?.userId !== currentProgress.userId ||
      last.progress?.episodeUrl !== currentProgress.episodeUrl ||
      last.progress?.position !== currentProgress.position ||
      last.progress?.duration !== currentProgress.duration;
    if (changed && (Date.now() - last.time >= 5000 || !status.playing || status.didJustFinish)) {
      saveProgress(currentProgress);
    }
  }, [currentProgress, status.playing, status.didJustFinish, saveProgress]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") saveProgress(progressRef.current);
    });
    return () => subscription.remove();
  }, [saveProgress]);

  const loadEpisode = useCallback(
    (channel, episode) => {
      const audioUrl = episode?.episodeUrl;
      if (!audioUrl) {
        throw new Error("This episode does not provide a playable audio stream.");
      }

      if (!userId) {
        throw new Error("Sign in to play a podcast episode.");
      }

      changeRef.current += 1;
      if (currentAudioUrlRef.current !== audioUrl) {
        saveProgress(progressRef.current);
        progressRef.current = null;
        replacedStatusRef.current = statusRef.current;
        player.replace(audioUrl);
        currentAudioUrlRef.current = audioUrl;
      }

      const podcast = { channel, episode };
      setSavedPodcast((current) =>
        current?.userId === userId &&
        current.podcast?.episode?.episodeUrl === audioUrl
          ? current
          : { userId, podcast },
      );
      queueStorageWrite(() =>
        AsyncStorage.setItem(
          STORAGE_KEY_PREFIX + userId,
          JSON.stringify(podcast),
        ),
      );
    },
    [player, userId, saveProgress],
  );

  const clearEpisode = useCallback(() => {
    changeRef.current += 1;
    saveProgress(progressRef.current);
    progressRef.current = null;
    player.pause();
    player.clearLockScreenControls();
    currentAudioUrlRef.current = null;
    setSavedPodcast(null);
    if (userId) {
      queueStorageWrite(() =>
        AsyncStorage.removeItem(STORAGE_KEY_PREFIX + userId),
      );
    }
  }, [player, userId, saveProgress]);

  return (
    <PodcastPlaybackContext.Provider
      value={{ player, status, currentPodcast, currentProgress, getSavedProgress, loadEpisode, clearEpisode }}
    >
      {children}
    </PodcastPlaybackContext.Provider>
  );
}

export function usePodcastPlayback() {
  const context = useContext(PodcastPlaybackContext);
  if (!context) {
    throw new Error(
      "usePodcastPlayback must be used inside PodcastPlaybackProvider.",
    );
  }
  return context;
}
