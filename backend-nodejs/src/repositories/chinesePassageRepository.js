const pool = require("../config/database");

const PASSAGE_COLUMNS = "id, title, passage, image_url, source_url";

const linkUser = async (db, passageId, userId) => {
  if (userId === null || userId === undefined) return;

  await db.query(
    `INSERT INTO user_passage (user_id, passage_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, passageId],
  );
};

const passageRepository = {
  findBySourceUrl: async (sourceUrl) => {
    const { rows } = await pool.query(
      `SELECT ${PASSAGE_COLUMNS} FROM passage WHERE source_url = $1`,
      [sourceUrl],
    );
    return rows[0] || null;
  },

  linkUser: (passageId, userId) => linkUser(pool, passageId, userId),

  // Inserts the passage unless the URL already exists, then links the user.
  // The unique index on source_url makes concurrent imports safe.
  createAndLink: async (passageData, userId) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const inserted = await client.query(
        `INSERT INTO passage (title, passage, image_url, source_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_url) WHERE source_url IS NOT NULL DO NOTHING
         RETURNING ${PASSAGE_COLUMNS}`,
        [
          passageData.title,
          passageData.content,
          passageData.imageUrl || null,
          passageData.sourceUrl,
        ],
      );

      let passage = inserted.rows[0];
      const created = Boolean(passage);

      if (!passage) {
        const existing = await client.query(
          `SELECT ${PASSAGE_COLUMNS} FROM passage WHERE source_url = $1`,
          [passageData.sourceUrl],
        );
        passage = existing.rows[0];
      }

      await linkUser(client, passage.id, userId);
      await client.query("COMMIT");
      return { passage, created };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findAll: async () => {
    const { rows } = await pool.query(
      `SELECT ${PASSAGE_COLUMNS} FROM passage ORDER BY id DESC`,
    );
    return rows;
  },
};

module.exports = passageRepository;
