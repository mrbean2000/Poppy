const express = require("express");
const router = express.Router();
const productController = require("../../controllers/productController");

// Map routes directly to controller functions
router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);

module.exports = router;
