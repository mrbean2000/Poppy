const express = require("express");
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

const productRoutes = require("./src/api/routes/products");
const chinesePassageRoutes = require("./src/api/routes/chinesePassage");

app.use("/products", productRoutes);
app.use("/chinese-passages", chinesePassageRoutes);
app.use("/japanese-passages", require("./src/api/routes/japanesePassage"));
app.use("/korean-passages", require("./src/api/routes/koreanPassage"));

module.exports = app;
