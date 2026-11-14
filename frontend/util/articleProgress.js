import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_PREFIX = "@poppy/article-progress/";
let progressWrites = Promise.resolve();

function progressKey(userId, languageId, articleId) {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(userId)}/${Number(languageId)}:${Number(articleId)}`;
}

function parseProgress(value) {
  if (value === null) return null;
  const progress = JSON.parse(value);
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new Error("Saved article progress is invalid.");
  }
  return progress;
}

export async function getArticleProgress(userId, articles) {
  if (!userId) throw new Error("Sign in to view article progress.");
  await progressWrites;
  const values = await AsyncStorage.multiGet(
    articles.map((item) => progressKey(userId, item.languageId, item.id)),
  );
  const progress = Object.create(null);
  values.forEach(([, value], index) => {
    const saved = parseProgress(value);
    if (saved !== null) progress[articles[index].key] = saved;
  });
  return progress;
}

export function saveArticleProgress(userId, languageId, articleId, progress) {
  if (!userId || !Number.isSafeInteger(languageId) || languageId <= 0 ||
      !Number.isSafeInteger(Number(articleId)) || Number(articleId) <= 0 ||
      !Number.isFinite(progress) || progress < 0 || progress > 1) {
    return Promise.reject(new Error("Cannot save invalid article progress."));
  }
  const key = progressKey(userId, languageId, articleId);
  const write = progressWrites.then(async () => {
    const previous = parseProgress(await AsyncStorage.getItem(key));
    if (previous === null || progress > previous) {
      await AsyncStorage.setItem(key, JSON.stringify(progress));
    }
  });
  progressWrites = write.catch((error) => {
    console.warn("Unable to save article progress:", error);
  });
  return write;
}
