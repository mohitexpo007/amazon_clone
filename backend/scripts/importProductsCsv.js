const fs = require("fs");
const path = require("path");
const pool = require("../models/db");

const CSV_PATH =
  process.env.PRODUCTS_CSV_PATH || "C:\\Users\\ACER\\Downloads\\products.csv";

const parseCsv = (csvText) => {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        value += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);

      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }

      row = [];
      value = "";
      continue;
    }

    value += character;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
};

const createRowObject = (headers, values) =>
  headers.reduce((rowObject, header, index) => {
    rowObject[header] = values[index] || "";
    return rowObject;
  }, {});

const cleanText = (value = "") =>
  String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parsePrice = (priceValue) => {
  const cleaned = cleanText(priceValue).replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseRating = (ratingValue) => {
  const cleaned = cleanText(ratingValue).replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, 5);
};

const parseRatingCount = (ratingCountValue) => {
  const cleaned = cleanText(ratingCountValue).replace(/[^0-9]/g, "");
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const parseImages = (allImagesValue) => {
  const normalized = cleanText(allImagesValue);

  if (!normalized) {
    return [];
  }

  const quotedUrls = normalized.match(/https?:\/\/[^']+/g);
  if (quotedUrls && quotedUrls.length > 0) {
    return quotedUrls.map((url) => cleanText(url));
  }

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    try {
      const parsedImages = JSON.parse(normalized.replace(/'/g, '"'));
      return parsedImages
        .map((image) => cleanText(image))
        .filter((image) => image.startsWith("http"));
    } catch (error) {
      return [];
    }
  }

  return normalized.startsWith("http") ? [normalized] : [];
};

const getStockFromAvailability = (availability) => {
  const normalized = cleanText(availability).toLowerCase();

  if (!normalized) {
    return 0;
  }

  if (
    normalized.includes("out of stock") ||
    normalized.includes("currently unavailable") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("unavailable")
  ) {
    return 0;
  }

  if (
    normalized.includes("in stock") ||
    normalized.includes("available") ||
    normalized.includes("ships") ||
    normalized.includes("delivery")
  ) {
    return 20;
  }

  return 10;
};

const getCategoryFromRow = (row) => {
  const breadcrumbs = cleanText(row.breadcrumbs).toLowerCase();
  const title = cleanText(row.title).toLowerCase();
  const brand = cleanText(row.brand_name).toLowerCase();
  const combinedText = `${breadcrumbs} ${title} ${brand}`;

  const containsAny = (keywords) =>
    keywords.some((keyword) => combinedText.includes(keyword));

  if (
    containsAny([
      "book",
      "books",
      "kindle",
      "novel",
      "paperback",
      "hardcover",
      "author",
      "literature",
    ])
  ) {
    return "Books";
  }

  if (
    containsAny([
      "grocery",
      "snack",
      "coffee",
      "tea",
      "chocolate",
      "food",
      "beverage",
      "pantry",
      "drink",
    ])
  ) {
    return "Grocery";
  }

  if (
    containsAny([
      "electronics",
      "cell phones",
      "camera",
      "charger",
      "phone",
      "iphone",
      "laptop",
      "tablet",
      "headphones",
      "earbuds",
      "speaker",
      "monitor",
      "smartwatch",
      "computer",
      "gaming",
      "console",
      "tv",
    ])
  ) {
    return "Electronics";
  }

  if (
    containsAny([
      "clothing",
      "shoes",
      "jewelry",
      "fashion",
      "shirt",
      "polo",
      "dress",
      "sneaker",
      "boot",
      "sandal",
      "heel",
      "loafer",
      "slipper",
      "jeans",
      "jacket",
      "bag",
      "handbag",
      "watch",
      "men",
      "women",
    ])
  ) {
    return "Fashion";
  }

  if (
    containsAny([
      "home",
      "kitchen",
      "furniture",
      "mattress",
      "decor",
      "bedding",
      "living room",
      "storage",
      "cookware",
      "appliance",
      "bed",
      "bath",
      "vacuum",
      "lamp",
    ])
  ) {
    return "Home";
  }

  return "Home";
};

const mapCsvRowToProduct = (row) => {
  const name = cleanText(row.title);
  const description = cleanText(row.product_description || row.about_item);
  const price = parsePrice(row.price_value);
  const images = parseImages(row.all_images);

  if (!name || !price || images.length === 0) {
    return null;
  }

  return {
    name,
    description,
    price,
    images,
    category: getCategoryFromRow(row),
    stock: getStockFromAvailability(row.availability),
    rating: parseRating(row.rating_stars),
    rating_count: parseRatingCount(row.rating_count),
  };
};

const importProductsFromCsv = async () => {
  let client;

  try {
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found at ${CSV_PATH}`);
    }

    const csvText = fs.readFileSync(CSV_PATH, "utf8");
    const parsedRows = parseCsv(csvText);
    const headers = parsedRows.shift().map((header) => cleanText(header));

    const products = [];
    const seenNames = new Set();

    for (const rowValues of parsedRows) {
      const row = createRowObject(headers, rowValues);
      const mappedProduct = mapCsvRowToProduct(row);

      if (!mappedProduct) {
        continue;
      }

      // Skip duplicate product names so search results stay cleaner.
      const productKey = mappedProduct.name.toLowerCase();
      if (seenNames.has(productKey)) {
        continue;
      }

      seenNames.add(productKey);
      products.push(mappedProduct);
    }

    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    const insertQuery = `
      INSERT INTO products (name, description, price, images, category, stock, rating, rating_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    for (const product of products) {
      await client.query(insertQuery, [
        product.name,
        product.description,
        product.price,
        product.images,
        product.category,
        product.stock,
        product.rating,
        product.rating_count,
      ]);
    }

    await client.query("COMMIT");
    console.log(`Imported ${products.length} products successfully from CSV.`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Error rolling back CSV import transaction:",
          rollbackError.message
        );
      }
    }

    console.error("Error importing products from CSV:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

importProductsFromCsv();
