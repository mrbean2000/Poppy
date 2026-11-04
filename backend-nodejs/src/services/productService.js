const productRepository = require("../repositories/productRepository");

const productService = {
  getAllProducts: async () => {
    // Business logic/processing if needed
    return await productRepository.findAll();
  },

  createProduct: async (productData) => {
    // Business logic: e.g., validation checks
    if (!productData.name || !productData.price) {
      throw new Error("Product name and price are required.");
    }
    return await productRepository.create(productData);
  },
};

module.exports = productService;
