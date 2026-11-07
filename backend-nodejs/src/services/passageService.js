const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const passageRepository = require("../repositories/passageRepository");
const extractParagraphs = require("../utils/extractParagraphs");

const passageService = {
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

    const sourceUrl = url.trim();

    let parsedUrl;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      throw new Error("A valid URL is required.");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only http and https URLs are supported.");
    }

    // The fragment never changes the page, so drop it when comparing URLs.
    parsedUrl.hash = "";
    const normalizedUrl = parsedUrl.toString();

    const existingPassage =
      await passageRepository.findBySourceUrl(normalizedUrl);
    if (existingPassage) {
      await passageRepository.linkUser(existingPassage.id, normalizedUserId);
      return { passage: existingPassage, alreadyImported: true };
    }

    try {
      url = normalizedUrl;
      console.log(`fetching ${url}...`);

      // Fetch the raw HTML string
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // Create a JSDOM instance, supplying the URL so relative image/href links are resolved
      const dom = new JSDOM(response.data, { url: url });

      // Extract lead image from Open Graph / Twitter meta tags before parsing
      const mainImage =
        dom.window.document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content") ||
        dom.window.document
          .querySelector('meta[name="twitter:image"]')
          ?.getAttribute("content") ||
        null;

      // Parse the document using Readability
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        console.log("❌ Readability failed to extract article content.");
        throw new Error("❌ Readability failed to extract article content.");
      }

      const { passage, created } = await passageRepository.createAndLink(
        {
          title: article.title,
          content: extractParagraphs(article.content, article.textContent),
          imageUrl: mainImage,
          sourceUrl: normalizedUrl,
        },
        normalizedUserId,
      );

      return { passage, alreadyImported: !created };
    } catch (error) {
      console.error("An error occurred:", error.message);
      throw error;
    }
  },
};
module.exports = passageService;
