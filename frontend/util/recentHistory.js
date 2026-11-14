import { requestRecentHistory } from "./http";

export async function getRecentHistory(userId, kind) {
  const items = await requestRecentHistory(kind, userId);
  if (!Array.isArray(items)) {
    throw new Error("The saved recent history is invalid.");
  }
  if (items.some((item) =>
    !item ||
    typeof item.key !== "string" ||
    (kind === "podcasts" && !item.episode?.episodeUrl) ||
    (kind === "articles" && (!item.id || !item.languageId || !item.language))
  )) {
    throw new Error("The saved recent history contains an invalid item.");
  }
  return items;
}

async function recordRecentItem(userId, kind, item) {
  await requestRecentHistory(kind, userId, item);
}

export async function recordRecentPodcast(userId, channel, episode) {
  if (!episode?.episodeUrl) {
    throw new Error("Cannot save a podcast without an audio URL.");
  }
  return recordRecentItem(userId, "podcasts", {
    key: episode.episodeUrl,
    channel: {
      collectionName: channel?.collectionName || "",
      artistName: channel?.artistName || "",
      artworkUrl100: channel?.artworkUrl100 || "",
      artworkUrl600: channel?.artworkUrl600 || "",
      feedUrl: channel?.feedUrl || "",
    },
    episode: {
      episodeUrl: episode.episodeUrl,
      trackId: episode.trackId || null,
      trackName: episode.trackName || "Podcast episode",
      artistName: episode.artistName || "",
      artworkUrl100: episode.artworkUrl100 || "",
      artworkUrl160: episode.artworkUrl160 || "",
      artworkUrl600: episode.artworkUrl600 || "",
      trackTimeMillis: episode.trackTimeMillis || 0,
    },
  });
}

export async function recordRecentArticle(userId, article) {
  const id = Number(article.id);
  const languageId = Number(article.languageId);
  if (!Number.isSafeInteger(id) || id <= 0 ||
      !Number.isSafeInteger(languageId) || languageId <= 0 || !article.language) {
    throw new Error("Cannot save an article without its ID and language.");
  }
  return recordRecentItem(userId, "articles", {
    key: `${languageId}:${id}`,
    id,
    languageId,
    language: article.language,
    title: article.title || "Untitled article",
    imageUrl: article.imageUrl || "",
  });
}
