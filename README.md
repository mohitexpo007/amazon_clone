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

### Note: For now search for electronics,phones,clothing as 2 datasets of fashion and electronics has been integrated with 20k entries.

---

## 🎥 Demo

📹 *Project Walkthrough*  


https://github.com/user-attachments/assets/51e1987c-196b-421b-bad2-2bb6596831de



---

## 🧠 Tech Stack

**Frontend:** React (Vite), Responsive CSS  
**Backend & DB:** Node.js, Express.js, PostgreSQL (Supabase) | **Deploy:** Vercel + Render  

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
## 🛒 Database Schema

<img width="1300" height="1169" alt="image" src="https://github.com/user-attachments/assets/eaf54859-e9fc-4cec-a8bb-c7b4b170355d" />


# Project Setup

## 1️⃣ Clone the Repository
git clone https://github.com/mohitexpo007/amazon_clone.git

cd amazonclone

## 2️⃣ Setup Frontend
```
cd frontend
npm install
npm run dev
```

### 👉 Frontend will run on:
### http://localhost:5173

## 3️⃣ Setup Backend

Open a new terminal and run:

```
cd backend
npm install
npm start
```

### 👉 Backend will run on:
### http://localhost:5000
