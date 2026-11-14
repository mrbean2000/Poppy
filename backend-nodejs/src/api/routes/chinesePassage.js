const express = require("express");
const router = express.Router();
const chinesePassageController = require("../../controllers/chinesePassageController");

// Map routes directly to controller functions
router.post("/", chinesePassageController.createPassage);

module.exports = router;
