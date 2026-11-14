const express = require("express");
const router = express.Router();
const controller = require("../../controllers/koreanPassageController");

router.post("/", controller.createPassage);
router.get("/", controller.getPassages);

module.exports = router;
