// Mock in-memory database store
const productsDb = [
  { id: "1", name: "Product A", price: 100 },
  { id: "2", name: "Product B", price: 150 },
];

const productRepository = {
  findAll: async () => {
    // Database query execution (e.g., DB.find())
    return productsDb;
  },

  create: async (productData) => {
    const newProduct = {
      id: String(productsDb.length + 1),
      ...productData,
    };
    productsDb.push(newProduct);
    return newProduct;
  },
};

module.exports = productRepository;
