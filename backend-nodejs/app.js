const express = require("express");
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

const productRoutes = require("./src/api/routes/products");
const passageRoutes = require("./src/api/routes/passage");

app.use("/products", productRoutes);
app.use("/passages", passageRoutes);

module.exports = app;
