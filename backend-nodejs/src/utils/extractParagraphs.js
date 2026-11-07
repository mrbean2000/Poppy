const { JSDOM } = require("jsdom");

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre";

const collapse = (text) => text.replace(/\s+/g, " ").trim();

// Builds plain text with one blank line between paragraphs from article HTML.
const extractParagraphs = (html, fallbackText = "") => {
  const { document } = new JSDOM(`<body>${html || ""}</body>`).window;

  const paragraphs = [];
  document.querySelectorAll(BLOCK_SELECTOR).forEach((element) => {
    // Skip containers whose nested blocks are collected on their own.
    if (element.querySelector(BLOCK_SELECTOR)) return;
    const text = collapse(element.textContent || "");
    if (text) paragraphs.push(text);
  });

  if (paragraphs.length === 0) {
    const fallback = (fallbackText || document.body.textContent || "")
      .split(/\r?\n/)
      .map(collapse)
      .filter(Boolean);
    return fallback.join("\n\n");
  }

  return paragraphs.join("\n\n");
};

module.exports = extractParagraphs;
