const express = require("express");
const router = express.Router();
const passageController = require("../../controllers/passageController");

// Map routes directly to controller functions
router.post("/", passageController.createPassage);

module.exports = router;
