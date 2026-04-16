# 🛒 Amazon Clone  
### 🚀 Full Stack E-Commerce Platform

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![Postgres](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Deploy](https://img.shields.io/badge/Deployed-Vercel%20%7C%20Render-black)

---

## 📌 Overview

A full-stack e-commerce web application inspired by Amazon’s UI and user experience.  
This project demonstrates **real-world backend architecture**, **dynamic product filtering**, **OOP-based cart management**, and **cloud deployment**.

---

## 🌐 Live Demo

- 🔗 **Frontend:** https://amazon-clone-frontend-eta-nine.vercel.app/
- ⚙️ **Backend API:** https://amazon-clone-backend-3z98.onrender.com  

---

## 🧠 Tech Stack

### 💻 Frontend
- React.js (Vite)
- Axios
- CSS (Responsive Design)

### ⚙️ Backend
- Node.js
- Express.js

### 🗄️ Database
- PostgreSQL (Supabase)

### ☁️ Deployment
- Frontend → Vercel  
- Backend → Render  
- Database → Supabase  

---

## ⚙️ Core Workflow

### 🔍 Product Fetching & Filtering

- Frontend calls a single API with query parameters:


/api/products
/api/products?search=iphone
/api/products?category=Electronics
/api/products?search=iphone&category=Electronics


- Backend dynamically builds SQL:

```sql
SELECT * FROM products WHERE 1=1
AND name ILIKE '%search%'
AND category = 'category'
```
👉 **Centralized backend logic → clean, scalable, RESTful design.**

## 📄 Product Detail Flow
- User clicks a product
- Route → `/product/:id`
- Backend fetches product by ID
- UI renders:
  - Images
  - Description
  - Specifications
  - Price
  - Stock

## 🛒 Cart System (OOP-Based)

Cart logic implemented using classes:

```js
class CartItem {
  constructor(product, quantity) {}
  getItemTotal() {}
}

class Cart {
  addItem() {}
  removeItem() {}
  updateQuantity() {}
  getSubtotal() {}
  getTotal() {}
}
```
