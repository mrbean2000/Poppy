const productService = require("../services/passageService");

const FOREIGN_KEY_VIOLATION = "23503";

const createPassage = async (req, res, next) => {
  try {
    const { url, userId } = req.body;
    const { passage, alreadyImported } = await productService.createPassage(
      url,
      userId,
    );
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

module.exports = {
  createPassage,
};
