const pool = require("../config/database");

const passageRepository = {
  create: async (passageData) => {
    const query = `
      INSERT INTO passage (title, passage, image_url)
      VALUES ($1, $2, $3)
      RETURNING id, title, passage, image_url;
    `;
    const values = [
      passageData.title,
      passageData.content,
      passageData.imageUrl || null,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  findAll: async () => {
    const { rows } = await pool.query(
      "SELECT id, title, passage, image_url FROM passage ORDER BY id DESC",
    );
    return rows;
  },
};

module.exports = passageRepository;
