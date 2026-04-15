const express = require("express");
const { placeOrder, getOrderById } = require("../controllers/orderController");

const router = express.Router();

router.post("/", placeOrder);
router.get("/:id", getOrderById);

module.exports = router;
