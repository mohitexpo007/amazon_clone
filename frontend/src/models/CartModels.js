export class CartItemModel {
  constructor(item) {
    this.id = item.id;
    this.productId = item.product_id;
    this.name = item.name || "";
    this.price = Number(item.price || 0);
    this.quantity = Number(item.quantity || 0);
    this.images = Array.isArray(item.images) ? item.images : [];
    this.category = item.category || "General";
  }

  get primaryImage() {
    return this.images[0] || "https://via.placeholder.com/320x320?text=Product";
  }

  get lineTotal() {
    return this.price * this.quantity;
  }

  get inStockLabel() {
    return "In stock";
  }
}

export class CartSummaryModel {
  constructor(items) {
    this.items = items;
  }

  get itemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((total, item) => total + item.lineTotal, 0);
  }

  get total() {
    return this.subtotal;
  }
}
