import axios from "axios";
import { File, Paths } from "expo-file-system";

// const BACKEND_URL = "http://192.168.0.10:8080/api";
// const NODE_BACKEND_URL = "http://192.168.0.10:3001";

const BACKEND_URL = "http://192.168.115.60:8080/api";
const NODE_BACKEND_URL = "http://192.168.115.60:3001";

export async function getAllPassage() {
  try {
    const response = await axios.get(BACKEND_URL + "/passages");
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      W;
      const status = error.response?.status;
      const message = status
        ? `Failed to load passages (HTTP ${status}).`
        : "Unable to connect to the passage server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function createPassage(url) {
  try {
    const response = await axios.post(`${NODE_BACKEND_URL}/passages`, { url });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "Unable to import passage.";
      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function createPassageFromText({ title, imageUrl, passage }) {
  try {
    const response = await axios.post(`${BACKEND_URL}/passage`, {
      title,
      imageUrl,
      passage,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || "Unable to import passage.";
      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function getPassageById(id) {
  try {
    const response = await axios.get(`${BACKEND_URL}/passage/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load passages (HTTP ${status}).`
        : "Unable to connect to the passage server.";

      throw new Error(message, { cause: error });
    }
    throw error;
  }
}

export async function getSegmentedPassageById(id) {
  try {
    const response = await axios.get(`${BACKEND_URL}/passage/${id}/segmented`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch passage:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load passages (HTTP ${status}).`
        : "Unable to connect to the passage server.";

      throw new Error(message, { cause: error });
    }
    throw error;
  }
}

export async function getSegmentedPassageWithPinyinById(id, userId) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/passage/${id}/segmented-with-pinyin`,
      { params: userId ? { userId } : undefined },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load segmented passage with pinyin (HTTP ${status}).`
        : "Unable to connect to the passage server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function recordVocabularyLookup(userId, word) {
  const response = await axios.post(
    `${BACKEND_URL}/users/${userId}/vocabulary/${encodeURIComponent(word)}/lookup`,
  );
  return response.data;
}

export async function getUserVocabulary(userId) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/users/${userId}/vocabulary`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load vocabulary (HTTP ${status}).`
        : "Unable to connect to the vocabulary server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function updateVocabularyStatus(userId, word, statusLevel) {
  const response = await axios.put(
    `${BACKEND_URL}/users/${userId}/vocabulary/${encodeURIComponent(word)}/status`,
    { statusLevel },
  );
  return response.data;
}

export async function updateVocabularyFavorite(userId, word, favorite) {
  try {
    const response = await axios.put(
      `${BACKEND_URL}/users/${userId}/vocabulary/${encodeURIComponent(word)}/favorite`,
      { favorite },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to update favorite (HTTP ${status}).`
        : "Unable to connect to the vocabulary server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function getMandarinWordDefinition(word) {
  try {
    const response = await axios.get(`${BACKEND_URL}/mandarinDictionary`, {
      params: { word },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load the dictionary entry (HTTP ${status}).`
        : "Unable to connect to the dictionary server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function searchPodcasts(term, searchType = "channel") {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) return [];
  if (!["channel", "episode"].includes(searchType)) {
    throw new Error("Podcast search type must be channel or episode.");
  }

  try {
    const response = await axios.get("https://itunes.apple.com/search", {
      params: {
        term: normalizedTerm,
        media: "podcast",
        entity: searchType === "episode" ? "podcastEpisode" : "podcast",
        limit: 100,
      },
    });

    if (!Array.isArray(response.data.results)) {
      throw new Error(
        "The iTunes search response did not include podcast results.",
      );
    }

    return response.data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to search podcasts (HTTP ${status}).`
        : "Unable to connect to the iTunes podcast search service.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function getPodcastEpisodes(collectionId) {
  if (!collectionId) {
    throw new Error("A valid podcast channel ID is required.");
  }

  try {
    const response = await axios.get("https://itunes.apple.com/lookup", {
      params: {
        id: collectionId,
        entity: "podcastEpisode",
        limit: 200,
      },
    });

    if (!Array.isArray(response.data.results)) {
      throw new Error("The iTunes response did not include podcast episodes.");
    }

    return response.data.results.filter(
      (result) =>
        result.kind === "podcast-episode" ||
        (result.wrapperType === "track" && result.trackId),
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load podcast episodes (HTTP ${status}).`
        : "Unable to connect to the iTunes podcast service.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(x[\da-f]+|\d+);/gi, (entity, code) => {
      const codePoint =
        code[0].toLowerCase() === "x"
          ? Number.parseInt(code.slice(1), 16)
          : Number.parseInt(code, 10);
      return Number.isFinite(codePoint) && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    });
}

function getXmlAttribute(attributes, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(["'])(.*?)\\1`, "i"),
  );
  return match ? decodeXmlEntities(match[2].trim()) : null;
}

function parseTranscriptTime(value) {
  const parts = value.replace(",", ".").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function parseTimedTranscript(transcriptText) {
  const blocks = transcriptText.replace(/^\uFEFF/, "").split(/\r?\n\s*\r?\n/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const timeLineIndex = lines.findIndex((line) =>
      /(?:\d{2}:)?\d{2}:\d{2}[,.]\d{3}\s*-->\s*(?:\d{2}:)?\d{2}:\d{2}[,.]\d{3}/.test(
        line,
      ),
    );
    if (timeLineIndex < 0) continue;

    const times = lines[timeLineIndex].match(
      /((?:\d{2}:)?\d{2}:\d{2}[,.]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[,.]\d{3})/,
    );
    if (!times) continue;

    const start = parseTranscriptTime(times[1]);
    const end = parseTranscriptTime(times[2]);
    const text = decodeXmlEntities(
      lines
        .slice(timeLineIndex + 1)
        .join(" ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim(),
    );
    if (start === null || end === null || !text) continue;
    cues.push({ start, end, text });
  }

  return cues.sort((first, second) => first.start - second.start);
}

function normalizeEpisodeTitle(value) {
  return decodeXmlEntities(
    value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " "),
  )
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function normalizeAudioUrl(value) {
  if (!value) return null;
  const decoded = decodeXmlEntities(value).trim();
  try {
    const parsed = new URL(decoded);
    return {
      full: `${parsed.origin}${parsed.pathname}`
        .toLowerCase()
        .replace(/\/+$/, ""),
      path: parsed.pathname.toLowerCase().replace(/\/+$/, ""),
    };
  } catch {
    return { full: decoded.toLowerCase().split(/[?#]/, 1)[0], path: null };
  }
}

function parseJsonTranscript(transcriptText) {
  let parsed;
  try {
    parsed = JSON.parse(transcriptText);
  } catch {
    return [];
  }

  const segments = Array.isArray(parsed)
    ? parsed
    : parsed?.segments || parsed?.transcript || parsed?.cues || [];
  if (!Array.isArray(segments)) return [];

  return segments
    .map((segment) => {
      const startValue =
        segment.startTime ?? segment.start ?? segment.begin ?? segment.offset;
      const endValue =
        segment.endTime ?? segment.end ?? segment.finish ?? segment.duration;
      const start =
        typeof startValue === "string"
          ? parseTranscriptTime(startValue)
          : Number(startValue);
      let end =
        typeof endValue === "string"
          ? parseTranscriptTime(endValue)
          : Number(endValue);
      if (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        segment.duration !== undefined &&
        segment.endTime === undefined &&
        segment.end === undefined &&
        segment.finish === undefined
      ) {
        end += start;
      }

      const text = Array.isArray(segment.text)
        ? segment.text
            .map((part) => (typeof part === "string" ? part : part?.text || ""))
            .join("")
            .trim()
        : typeof segment.text === "string"
          ? segment.text.trim()
          : "";
      return { start, end, text };
    })
    .filter(
      (cue) =>
        Number.isFinite(cue.start) &&
        Number.isFinite(cue.end) &&
        cue.end >= cue.start &&
        cue.text,
    )
    .sort((first, second) => first.start - second.start);
}

function parseUntimedTranscript(transcriptText, type) {
  let text = transcriptText
    .replace(/^\uFEFF/, "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ");

  if (type.includes("html") || /<\/?[a-z][^>]*>/i.test(text)) {
    text = text
      .replace(/<\/?(?:p|div|li|h[1-6]|br)\b[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, " ");
  }

  return decodeXmlEntities(text)
    .replace(/&nbsp;/gi, " ")
    .split(/\r?\n/)
    .flatMap((paragraph) =>
      (paragraph.match(/[^.!?。！？]+[.!?。！？]?/gu) || [])
        .map((sentence) => sentence.trim())
        .filter(Boolean),
    )
    .map((text) => ({ text }));
}

export async function getPodcastEpisodeTranscript(
  feedUrl,
  audioUrl,
  episodeTitle,
  durationSeconds = 0,
) {
  if (!feedUrl) return { cues: [], isTimed: false };

  try {
    const response = await axios.get(feedUrl, {
      responseType: "text",
      timeout: 12000,
    });
    if (typeof response.data !== "string") {
      throw new Error("The podcast feed did not return valid XML.");
    }

    const normalizedAudioUrl = normalizeAudioUrl(audioUrl);
    const normalizedTitle = normalizeEpisodeTitle(episodeTitle || "");
    let matchingItem = null;
    let exactTitleMatch = null;
    let exactTitleMatchCount = 0;
    let partialTitleMatch = null;
    let partialTitleMatchCount = 0;

    for (const itemMatch of response.data.matchAll(
      /<(?:[\w.-]+:)?item\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?item\s*>/gi,
    )) {
      const item = itemMatch[0];
      const mediaUrls = [
        ...item.matchAll(/<(?:[\w.-]+:)?(?:enclosure|content)\b([^>]*)\/?>/gi),
      ];
      const hasMatchingAudio = mediaUrls.some((tag) => {
        const url =
          getXmlAttribute(tag[1], "url") || getXmlAttribute(tag[1], "href");
        const candidate = normalizeAudioUrl(url);
        return Boolean(
          candidate &&
          normalizedAudioUrl &&
          (candidate.full === normalizedAudioUrl.full ||
            (candidate.path && candidate.path === normalizedAudioUrl.path)),
        );
      });

      if (hasMatchingAudio) {
        matchingItem = item;
        break;
      }

      if (!normalizedTitle) continue;
      const title = item.match(
        /<(?:[\w.-]+:)?title\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?title\s*>/i,
      );
      if (!title) continue;

      const candidateTitle = normalizeEpisodeTitle(title[1]);
      if (candidateTitle === normalizedTitle) {
        exactTitleMatch = item;
        exactTitleMatchCount += 1;
      } else if (
        normalizedTitle.length >= 12 &&
        candidateTitle.length >= 12 &&
        (candidateTitle.includes(normalizedTitle) ||
          normalizedTitle.includes(candidateTitle))
      ) {
        partialTitleMatch = item;
        partialTitleMatchCount += 1;
      }
    }

    matchingItem ||= exactTitleMatchCount === 1 ? exactTitleMatch : null;
    matchingItem ||= partialTitleMatchCount === 1 ? partialTitleMatch : null;
    if (!matchingItem) return { cues: [], isTimed: false };

    const transcriptTags = [
      ...matchingItem.matchAll(/<(?:[\w.-]+:)?transcript\b([^>]*)\/?>/gi),
    ];
    const transcriptSources = transcriptTags
      .map((tag) => ({
        url: getXmlAttribute(tag[1], "url"),
        type: getXmlAttribute(tag[1], "type")?.toLowerCase() || "",
      }))
      .filter(
        (source) =>
          source.url &&
          (!source.type ||
            source.type.includes("vtt") ||
            source.type.includes("subrip") ||
            source.type.includes("json") ||
            source.type.includes("html") ||
            source.type.includes("plain") ||
            /\.srt(?:$|[?#])|\.vtt(?:$|[?#])|\.json(?:$|[?#])|\.html?(?:$|[?#])|\.txt(?:$|[?#])/i.test(
              source.url,
            )),
      );
    if (transcriptSources.length === 0) return { cues: [], isTimed: false };

    for (const source of transcriptSources) {
      const transcriptUrl = new URL(source.url, feedUrl).toString();
      const transcriptResponse = await axios.get(transcriptUrl, {
        responseType: "text",
        timeout: 12000,
      });
      const transcriptText =
        typeof transcriptResponse.data === "string"
          ? transcriptResponse.data
          : JSON.stringify(transcriptResponse.data);
      let cues =
        source.type.includes("json") || /^\s*[\[{]/.test(transcriptText)
          ? parseJsonTranscript(transcriptText)
          : parseTimedTranscript(transcriptText);
      if (cues.length > 0) return { cues, isTimed: true };

      cues = parseUntimedTranscript(transcriptText, source.type);
      if (cues.length > 0) {
        const slotDuration =
          durationSeconds > 0 ? durationSeconds / cues.length : 0;
        cues = cues.map((cue, index) => ({
          ...cue,
          start: index * slotDuration,
          end: (index + 1) * slotDuration,
        }));
        return { cues, isTimed: false };
      }
    }

    return { cues: [], isTimed: false };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load podcast subtitles (HTTP ${status}).`
        : "Unable to connect to the podcast feed or subtitle service.";
      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

const generatedPodcastTranscriptRequests = new Map();
const MAX_TRANSCRIPTION_AUDIO_BYTES = 512 * 1024 * 1024;

async function transcribePodcastAudioFile(audioFile, episodeId) {
  const formData = new FormData();
  const extension = audioFile.extension.toLowerCase();
  const contentType =
    audioFile.type ||
    {
      ".mp3": "audio/mpeg",
      ".mp4": "audio/mp4",
      ".m4a": "audio/mp4",
      ".mpeg": "audio/mpeg",
      ".mpga": "audio/mpeg",
      ".wav": "audio/wav",
      ".webm": "audio/webm",
    }[extension] ||
    "audio/mpeg";

  formData.append("audio", {
    uri: audioFile.uri,
    name: audioFile.name || `podcast-episode${extension || ".mp3"}`,
    type: contentType,
  });

  try {
    const response = await axios.post(
      `${BACKEND_URL}/podcasts/transcript`,
      formData,
      {
        params: { episodeId },
        timeout: 0,
      },
    );
    if (!Array.isArray(response.data?.cues)) {
      throw new Error(
        "The transcription service returned an invalid transcript.",
      );
    }
    return { cues: response.data.cues, isTimed: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        status === 413
          ? "This episode exceeds the 512 MB limit for automatic transcription."
          : status && typeof error.response?.data === "string"
            ? error.response.data
            : status
              ? `Failed to generate podcast transcript (HTTP ${status}).`
              : "Unable to connect to the podcast transcription service.";
      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function getPodcastEpisodeTranscriptOrGenerate(
  { feedUrl, audioUrl, episodeTitle, episodeId, durationSeconds = 0 },
  onAutoTranscriptionStart,
) {
  const cacheKey = String(episodeId || audioUrl || "");
  const cachedRequest = generatedPodcastTranscriptRequests.get(cacheKey);
  if (cachedRequest) return cachedRequest;

  const transcriptRequest = (async () => {
    let feedError = null;
    if (feedUrl) {
      try {
        const transcript = await getPodcastEpisodeTranscript(
          feedUrl,
          audioUrl,
          episodeTitle,
          durationSeconds,
        );
        if (transcript.cues.length > 0) return transcript;
      } catch (error) {
        feedError = error;
      }
    }

    if (!audioUrl) {
      throw feedError || new Error("This episode has no playable audio URL.");
    }
    if (!episodeId) {
      throw new Error("An episode ID is required for automatic transcription.");
    }

    onAutoTranscriptionStart?.();
    let audioFile = null;
    try {
      audioFile = await File.downloadFileAsync(audioUrl, Paths.cache);
      if (audioFile.size > MAX_TRANSCRIPTION_AUDIO_BYTES) {
        throw new Error(
          "This episode exceeds the 512 MB limit for automatic transcription.",
        );
      }
      return await transcribePodcastAudioFile(audioFile, episodeId);
    } finally {
      if (audioFile?.exists) audioFile.delete();
    }
  })();

  generatedPodcastTranscriptRequests.set(cacheKey, transcriptRequest);
  try {
    const transcript = await transcriptRequest;
    if (generatedPodcastTranscriptRequests.size > 100) {
      generatedPodcastTranscriptRequests.clear();
    }
    return transcript;
  } catch (error) {
    generatedPodcastTranscriptRequests.delete(cacheKey);
    throw error;
  }
}

// Story

export async function getStoryLike(postId) {
  try {
    const response = await axios.get(`${BACKEND_URL}/story-like/${postId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load story like status (HTTP ${status}).`
        : "Unable to connect to the story like server 1.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function updateStoryLike(postId, like) {
  try {
    const response = await axios.put(`${BACKEND_URL}/story-like`, {
      postId,
      like,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to update story like (HTTP ${status}).`
        : "Unable to connect to the story like server 2.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

// Setting
export async function getUserSettings(userId) {
  try {
    const response = await axios.get(`${BACKEND_URL}/setting/user/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load user settings (HTTP ${status}).`
        : "Unable to connect to the story like server 3.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function updateUserSettings(userSettings) {
  try {
    const response = await axios.put(`${BACKEND_URL}/setting`, userSettings);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to update user settings (HTTP ${status}).`
        : "Unable to connect to the settings server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

//Languages
export async function getAllLanguages() {
  try {
    const response = await axios.get(`${BACKEND_URL}/languages`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to update user settings (HTTP ${status}).`
        : "Unable to connect to the story like server 4.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

// Last Read Passage
export async function getLastReadPassageByUserId(userId) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/UserPassageProgress/${userId}/last-read-passage`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load the last-read passage (HTTP ${status}).`
        : "Unable to connect to the passage server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function createUserProfile(userProfile) {
  try {
    const response = await axios.post(`${BACKEND_URL}/users`, userProfile);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to save your profile (HTTP ${status}).`
        : "Unable to connect to the profile server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function getUserProfileByFirebaseUid(firebaseUid) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/users/firebase/${encodeURIComponent(firebaseUid)}`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to load your profile (HTTP ${status}).`
        : "Unable to connect to the profile server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function createUserSettings(settings) {
  try {
    const response = await axios.post(`${BACKEND_URL}/setting`, settings);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to save your onboarding settings (HTTP ${status}).`
        : "Unable to connect to the settings server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}

export async function recordLoginStreak(firebaseUid) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/users/${encodeURIComponent(firebaseUid)}/login-streak`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = status
        ? `Failed to update your login streak (HTTP ${status}).`
        : "Unable to connect to the login streak server.";

      throw new Error(message, { cause: error });
    }

    throw error;
  }
}
