const pool = require("../models/db");

const getProducts = async (req, res) => {
  const { search, category } = req.query;
  const conditions = [];
  const values = [];

  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  if (category && category.trim()) {
    values.push(category.trim());
    conditions.push(`category ILIKE $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT id, name, description, price, images, category, stock
    FROM products
    ${whereClause}
    ORDER BY id ASC
  `;

  try {
    const { rows } = await pool.query(query, values);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

const getProductById = async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const query = `
      SELECT id, name, description, price, images, category, stock
      FROM products
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

module.exports = {
  getProducts,
  getProductById,
};
