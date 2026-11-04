const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const passageRepository = require("../repositories/passageRepository");

const passageService = {
  createPassage: async (url) => {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("URL is required.");
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

    try {
      url = parsedUrl.toString();
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

      return await passageRepository.create({
        title: article.title,
        content: article.textContent,
        imageUrl: mainImage,
      });
    } catch (error) {
      console.error("An error occurred:", error.message);
      throw error;
    }
  },
};
module.exports = passageService;
