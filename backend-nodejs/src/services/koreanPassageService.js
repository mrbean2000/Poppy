const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const koreanPassageRepository = require("../repositories/koreanPassageRepository");
const extractParagraphs = require("../utils/extractParagraphs");

const koreanPassageService = {
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
      await koreanPassageRepository.findBySourceUrl(normalizedUrl);
    if (existing) {
      await koreanPassageRepository.linkUser(existing.id, normalizedUserId);
      return { passage: existing, alreadyImported: true };
    }

    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ko,en;q=0.5",
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

    // Strip headers and timestamps that Readability leaves in the body
    const articleDom = new JSDOM(article.content);
    const articleDoc = articleDom.window.document;

    const unwantedSelectors = [
      "h1",
      "h2",
      "header",
      "time",
      ".date",
      ".timestamp",
      ".news-date",
      ".article-date",
    ];

    unwantedSelectors.forEach((selector) => {
      articleDoc.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Drop a leading dateline (e.g. "2025년 11월 9일 15:30") or repeated title
    const paragraphs = articleDoc.querySelectorAll("p");
    if (paragraphs.length > 0) {
      const firstPText = paragraphs[0].textContent.trim();
      const isDateString =
        /^(\d{4}\s*년\s*)?\d{1,2}\s*월\s*\d{1,2}\s*일(\s*\d{1,2}\s*[시:]\s*\d{1,2}\s*분?)?$/.test(
          firstPText,
        );
      const isTitleMatch = firstPText === article.title.trim();

      if (isDateString || isTitleMatch) {
        paragraphs[0].remove();
      }
    }

    const cleanedHtml = articleDoc.body.innerHTML;
    const cleanedText = articleDoc.body.textContent;

    const { passage, created } = await koreanPassageRepository.createAndLink(
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

  getAll: () => koreanPassageRepository.findAll(),
};

module.exports = koreanPassageService;
