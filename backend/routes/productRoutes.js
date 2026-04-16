const express = require("express");
const { getProducts, getProductById } = require("../controllers/productController");

const router = express.Router();

// Single products route with optional search and category filtering.
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
