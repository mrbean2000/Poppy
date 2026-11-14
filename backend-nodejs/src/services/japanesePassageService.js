const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const japanesePassageRepository = require("../repositories/japanesePassageRepository");
const extractParagraphs = require("../utils/extractParagraphs");

const japanesePassageService = {
  createPassage: async (url, userId) => {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("URL is required.");
    }

    const normalizedUserId =
      userId === undefined || userId === null ? null : Number(userId);
    if (
      normalizedUserId !== null &&
      (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0)
    ) {
      throw new Error("A valid user ID is required.");
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      throw new Error("A valid URL is required.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only http and https URLs are supported.");
    }

    parsedUrl.hash = "";
    const normalizedUrl = parsedUrl.toString();

    const existing =
      await japanesePassageRepository.findBySourceUrl(normalizedUrl);
    if (existing) {
      await japanesePassageRepository.linkUser(existing.id, normalizedUserId);
      return { passage: existing, alreadyImported: true };
    }

    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ja,en;q=0.5",
      },
    });

    const dom = new JSDOM(response.data, { url: normalizedUrl });
    const document = dom.window.document;

    const mainImage =
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") ||
      document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content") ||
      null;

    const article = new Readability(document).parse();
    if (!article) {
      throw new Error("Readability failed to extract article content.");
    }

    // --- POST-PROCESS READABILITY HTML TO STRIP HEADERS & TIMESTAMPS ---
    const articleDom = new JSDOM(article.content);
    const articleDoc = articleDom.window.document;

    // Remove tags that typically hold headers, titles, dates, or metadata inside the body
    const unwantedSelectors = [
      "h1",
      "h2",
      "header",
      "time",
      ".date",
      ".timestamp",
      ".news-date",
      ".article-date",
      ".p-article-date",
    ];

    unwantedSelectors.forEach((selector) => {
      articleDoc.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Optional: If the first paragraph is just a dateline (e.g. "11月9日 15時30分") or matches the title, remove it
    const paragraphs = articleDoc.querySelectorAll("p");
    if (paragraphs.length > 0) {
      const firstPText = paragraphs[0].textContent.trim();
      const isDateString =
        /^(\d{4}年)?\d{1,2}月\d{1,2}日(\s*\d{1,2}時\d{1,2}分)?$/.test(
          firstPText,
        );
      const isTitleMatch = firstPText === article.title.trim();

      if (isDateString || isTitleMatch) {
        paragraphs[0].remove();
      }
    }

    // Reconstruct cleaned article content strings to pass into your helper
    const cleanedHtml = articleDoc.body.innerHTML;
    const cleanedText = articleDoc.body.textContent;
    // -----------------------------------------------------------------

    const { passage, created } = await japanesePassageRepository.createAndLink(
      {
        title: article.title,
        content: extractParagraphs(cleanedHtml, cleanedText),
        imageUrl: mainImage,
        sourceUrl: normalizedUrl,
      },
      normalizedUserId,
    );

    return { passage, alreadyImported: !created };
  },

  getAll: () => japanesePassageRepository.findAll(),
};

module.exports = japanesePassageService;
