// One-off: re-scrape URL-imported passages so their text keeps paragraph breaks.
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const pool = require("../src/config/database");
const extractParagraphs = require("../src/utils/extractParagraphs");

(async () => {
  const { rows } = await pool.query(
    "SELECT id, source_url FROM chinese_passage WHERE source_url IS NOT NULL ORDER BY id",
  );
  let ok = 0;
  for (const { id, source_url } of rows) {
    try {
      const response = await axios.get(source_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 20000,
      });
      const dom = new JSDOM(response.data, { url: source_url });
      const article = new Readability(dom.window.document).parse();
      if (!article) throw new Error("Readability returned nothing");
      const content = extractParagraphs(article.content, article.textContent);
      if (!content) throw new Error("empty content");
      await pool.query("UPDATE chinese_passage SET passage = $1 WHERE id = $2", [
        content,
        id,
      ]);
      ok++;
      console.log(`updated ${id}`);
    } catch (error) {
      console.log(`skipped ${id} (${source_url}): ${error.message}`);
    }
  }
  console.log(`done: ${ok}/${rows.length} updated`);
  await pool.end();
})();
