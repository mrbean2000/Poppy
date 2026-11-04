import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const PodcastPlaybackContext = createContext(null);

export function PodcastPlaybackProvider({ children }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const currentAudioUrlRef = useRef(null);
  const [currentPodcast, setCurrentPodcast] = useState(null);

  const loadEpisode = useCallback(
    (channel, episode) => {
      const audioUrl = episode?.episodeUrl;
      if (!audioUrl) {
        throw new Error("This episode does not provide a playable audio stream.");
      }

      if (currentAudioUrlRef.current !== audioUrl) {
        player.replace(audioUrl);
        currentAudioUrlRef.current = audioUrl;
      }

      setCurrentPodcast((current) =>
        current?.episode?.episodeUrl === audioUrl
          ? current
          : { channel, episode },
      );
    },
    [player],
  );

  const clearEpisode = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();
    currentAudioUrlRef.current = null;
    setCurrentPodcast(null);
  }, [player]);

  return (
    <PodcastPlaybackContext.Provider
      value={{ player, status, currentPodcast, loadEpisode, clearEpisode }}
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
