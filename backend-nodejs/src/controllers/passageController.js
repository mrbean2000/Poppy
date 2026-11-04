const productService = require("../services/passageService");

const createPassage = async (req, res, next) => {
  try {
    const { url } = req.body;
    const newPassage = await productService.createPassage(url);
    return res.status(201).json({
      message: "Passage created successfully",
      id: newPassage.id,
      data: newPassage,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createPassage,
};
