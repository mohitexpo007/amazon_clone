const pool = require("../models/db");

const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, minRating } = req.query;

  // Start with a base query that always works.
  // This makes it easy to append optional filters one by one.
  let query = "SELECT * FROM products WHERE 1=1";
  const values = [];

  // If the user types a search term, filter by product name.
  // LOWER(...) + LIKE keeps it case-insensitive in a simple interview-friendly way.
  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    query += ` AND LOWER(name) LIKE LOWER($${values.length})`;
  }

  // If category is selected, filter by that category.
  // We skip filtering when category is "All" so the full list is returned.
  if (category && category.trim() && category.trim() !== "All") {
    values.push(category.trim());
    query += ` AND category = $${values.length}`;
  }

  if (minPrice && Number.isFinite(Number(minPrice))) {
    values.push(Number(minPrice));
    query += ` AND price >= $${values.length}`;
  }

  if (maxPrice && Number.isFinite(Number(maxPrice))) {
    values.push(Number(maxPrice));
    query += ` AND price <= $${values.length}`;
  }

  if (minRating && Number.isFinite(Number(minRating))) {
    values.push(Number(minRating));
    query += ` AND COALESCE(rating, 0) >= $${values.length}`;
  }

  query += " ORDER BY id ASC";

  try {
    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Server error while fetching products" });
  }
};

const getProductById = async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const query = "SELECT * FROM products WHERE id = $1 LIMIT 1";
    const { rows } = await pool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    return res.status(500).json({ message: "Server error while fetching product" });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
