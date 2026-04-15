const pool = require("../models/db");

const sampleProducts = [
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear call quality.",
    price: 349.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    ],
    category: "Electronics",
    stock: 24,
  },
  {
    name: "Apple Watch Series 9 GPS Smartwatch",
    description:
      "Advanced smartwatch with fitness tracking, heart rate monitoring, and seamless iPhone integration.",
    price: 399.0,
    images: [
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d",
    ],
    category: "Electronics",
    stock: 18,
  },
  {
    name: "Ninja Professional 72-Oz Countertop Blender",
    description:
      "Powerful blender with total crushing blades for smoothies, frozen drinks, and meal prep.",
    price: 129.95,
    images: [
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b",
    ],
    category: "Kitchen",
    stock: 30,
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    description:
      "Versatile multicooker that pressure cooks, slow cooks, sautes, steams, and keeps meals warm.",
    price: 99.99,
    images: [
      "https://images.unsplash.com/photo-1585515656396-a9f0f500c0a2",
    ],
    category: "Kitchen",
    stock: 20,
  },
  {
    name: "Kindle Paperwhite Signature Edition",
    description:
      "Glare-free e-reader with auto-adjusting front light, wireless charging, and weeks of battery life.",
    price: 189.99,
    images: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794",
    ],
    category: "Books",
    stock: 14,
  },
  {
    name: "The Psychology of Money by Morgan Housel",
    description:
      "Bestselling personal finance book exploring how behavior shapes money decisions and long-term wealth.",
    price: 18.5,
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f",
    ],
    category: "Books",
    stock: 45,
  },
  {
    name: "Adidas Ultraboost Light Running Shoes",
    description:
      "Responsive running shoes with lightweight cushioning and breathable mesh upper for all-day comfort.",
    price: 159.99,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    ],
    category: "Fashion",
    stock: 28,
  },
  {
    name: "Levi's 511 Slim Fit Stretch Jeans",
    description:
      "Classic slim-fit jeans with soft stretch denim for a clean everyday look and comfortable movement.",
    price: 69.5,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
    ],
    category: "Fashion",
    stock: 36,
  },
  {
    name: "Dyson V11 Cordless Vacuum Cleaner",
    description:
      "High-performance cordless vacuum with intelligent suction adjustment and up to 60 minutes of runtime.",
    price: 549.99,
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
    ],
    category: "Home",
    stock: 10,
  },
  {
    name: "Philips Hue White and Color Ambiance Starter Kit",
    description:
      "Smart lighting kit with app control, millions of colors, and voice assistant compatibility.",
    price: 179.99,
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f",
    ],
    category: "Home",
    stock: 22,
  },
  {
    name: "Bowflex SelectTech 552 Adjustable Dumbbells",
    description:
      "Space-saving adjustable dumbbells with quick weight changes from 5 to 52.5 pounds.",
    price: 429.0,
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
    ],
    category: "Fitness",
    stock: 12,
  },
  {
    name: "Fitbit Charge 6 Fitness and Health Tracker",
    description:
      "Slim fitness tracker with GPS, heart rate monitoring, sleep tracking, and Google app integration.",
    price: 159.95,
    images: [
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6",
    ],
    category: "Fitness",
    stock: 26,
  },
];

const seedProducts = async () => {
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    const insertQuery = `
      INSERT INTO products (name, description, price, images, category, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const product of sampleProducts) {
      await client.query(insertQuery, [
        product.name,
        product.description,
        product.price,
        product.images,
        product.category,
        product.stock,
      ]);
    }

    await client.query("COMMIT");
    console.log(`Seeded ${sampleProducts.length} products successfully.`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back seed transaction:", rollbackError.message);
      }
    }

    console.error("Error seeding products:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

seedProducts();
