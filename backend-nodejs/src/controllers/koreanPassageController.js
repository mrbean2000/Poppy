const koreanPassageService = require("../services/koreanPassageService");

const FOREIGN_KEY_VIOLATION = "23503";

const createPassage = async (req, res) => {
  try {
    const { url, userId } = req.body;
    const { passage, alreadyImported } =
      await koreanPassageService.createPassage(url, userId);
    return res.status(alreadyImported ? 200 : 201).json({
      message: alreadyImported
        ? "Passage already imported"
        : "Passage created successfully",
      id: passage.id,
      alreadyImported,
      data: passage,
    });
  } catch (error) {
    const message =
      error.code === FOREIGN_KEY_VIOLATION
        ? "The user for this import does not exist."
        : error.message;
    res.status(400).json({ message });
  }
};

const getPassages = async (req, res) => {
  try {
    const passages = await koreanPassageService.getAll();
    res.status(200).json({ data: passages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPassage, getPassages };
