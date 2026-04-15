const pool = require("../models/db");

const placeOrder = async (req, res) => {
  const { address } = req.body;

  if (!address || !address.trim()) {
    return res.status(400).json({ message: "Address is required" });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const cartItemsQuery = `
      SELECT cart_items.product_id, cart_items.quantity, products.price
      FROM cart_items
      INNER JOIN products ON products.id = cart_items.product_id
      ORDER BY cart_items.id ASC
    `;
    const cartItemsResult = await client.query(cartItemsQuery);

    if (cartItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const total = cartItemsResult.rows.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    const insertOrderQuery = `
      INSERT INTO orders (total, address)
      VALUES ($1, $2)
      RETURNING id, total, address, created_at
    `;
    const orderResult = await client.query(insertOrderQuery, [total, address.trim()]);
    const order = orderResult.rows[0];

    const insertOrderItemQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of cartItemsResult.rows) {
      await client.query(insertOrderItemQuery, [
        order.id,
        item.product_id,
        item.quantity,
        item.price,
      ]);
    }

    await client.query("DELETE FROM cart_items");
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Order placed successfully",
      orderId: order.id,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back order transaction:", rollbackError.message);
      }
    }

    console.error("Error placing order:", error.message);
    return res.status(500).json({ message: "Failed to place order" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const getOrderById = async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const orderQuery = `
      SELECT id, total, address, created_at
      FROM orders
      WHERE id = $1
      LIMIT 1
    `;
    const orderResult = await pool.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const orderItemsQuery = `
      SELECT
        order_items.id,
        order_items.product_id,
        order_items.quantity,
        order_items.price,
        products.name,
        products.images,
        products.category
      FROM order_items
      INNER JOIN products ON products.id = order_items.product_id
      WHERE order_items.order_id = $1
      ORDER BY order_items.id ASC
    `;
    const orderItemsResult = await pool.query(orderItemsQuery, [orderId]);

    return res.status(200).json({
      ...orderResult.rows[0],
      items: orderItemsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching order:", error.message);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

module.exports = {
  placeOrder,
  getOrderById,
};
