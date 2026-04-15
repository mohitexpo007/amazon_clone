const pool = require("../models/db");

const getCart = async (req, res) => {
  try {
    const query = `
      SELECT
        cart_items.id,
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price,
        products.images,
        products.category
      FROM cart_items
      INNER JOIN products ON products.id = cart_items.product_id
      ORDER BY cart_items.id ASC
    `;
    const { rows } = await pool.query(query);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    return res.status(500).json({ message: "Failed to fetch cart items" });
  }
};

const addCartItem = async (req, res) => {
  const { product_id: productId, quantity } = req.body;
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({ message: "Invalid product_id" });
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ message: "Quantity must be a positive integer" });
  }

  try {
    const existingItemQuery = `
      SELECT id, product_id, quantity
      FROM cart_items
      WHERE product_id = $1
      LIMIT 1
    `;
    const existingItemResult = await pool.query(existingItemQuery, [parsedProductId]);

    if (existingItemResult.rows.length > 0) {
      const existingItem = existingItemResult.rows[0];
      const updateQuery = `
        UPDATE cart_items
        SET quantity = $1
        WHERE id = $2
        RETURNING id, product_id, quantity
      `;
      const updatedItemResult = await pool.query(updateQuery, [
        existingItem.quantity + parsedQuantity,
        existingItem.id,
      ]);

      return res.status(200).json(updatedItemResult.rows[0]);
    }

    const insertQuery = `
      INSERT INTO cart_items (product_id, quantity)
      VALUES ($1, $2)
      RETURNING id, product_id, quantity
    `;
    const { rows } = await pool.query(insertQuery, [parsedProductId, parsedQuantity]);

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error adding cart item:", error.message);

    if (error.code === "23503") {
      return res.status(400).json({ message: "Product does not exist" });
    }

    return res.status(500).json({ message: "Failed to add cart item" });
  }
};

const updateCartItem = async (req, res) => {
  const cartItemId = Number(req.params.id);
  const { quantity } = req.body;
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({ message: "Invalid cart item id" });
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({ message: "Quantity must be a positive integer" });
  }

  try {
    const query = `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2
      RETURNING id, product_id, quantity
    `;
    const { rows } = await pool.query(query, [parsedQuantity, cartItemId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error updating cart item:", error.message);
    return res.status(500).json({ message: "Failed to update cart item" });
  }
};

const deleteCartItem = async (req, res) => {
  const cartItemId = Number(req.params.id);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return res.status(400).json({ message: "Invalid cart item id" });
  }

  try {
    const query = `
      DELETE FROM cart_items
      WHERE id = $1
      RETURNING id, product_id, quantity
    `;
    const { rows } = await pool.query(query, [cartItemId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    return res.status(200).json({
      message: "Cart item removed",
      item: rows[0],
    });
  } catch (error) {
    console.error("Error deleting cart item:", error.message);
    return res.status(500).json({ message: "Failed to delete cart item" });
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
};
