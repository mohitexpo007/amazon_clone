const express = require("express");
const {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", getCart);
router.post("/", addCartItem);
router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

module.exports = router;
