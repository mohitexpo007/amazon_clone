const fs = require("fs");
const pool = require("../models/db");

const CSV_PATH =
  process.env.ELECTRONICS_CSV_PATH ||
  "C:\\Users\\ACER\\Downloads\\electronics_product.csv\\electronics_product.csv";

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

const getCategoryFromRow = (row) => {
  const combined = `${cleanText(row.main_category)} ${cleanText(row.sub_category)} ${cleanText(
    row.name
  )}`.toLowerCase();

  if (
    [
      "camera",
      "speaker",
      "earphone",
      "earbud",
      "headphone",
      "phone",
      "mobile",
      "tablet",
      "laptop",
      "monitor",
      "smartwatch",
      "watch",
      "tv",
      "electronic",
      "bluetooth",
      "charger",
      "gaming",
    ].some((keyword) => combined.includes(keyword))
  ) {
    return "Electronics";
  }

  if (["shoe", "sneaker", "fashion", "bag", "watch band"].some((keyword) => combined.includes(keyword))) {
    return "Fashion";
  }

  if (["book"].some((keyword) => combined.includes(keyword))) {
    return "Books";
  }

  if (["grocery", "food", "coffee", "tea"].some((keyword) => combined.includes(keyword))) {
    return "Grocery";
  }

  return "Electronics";
};

const mapCsvRowToProduct = (row) => {
  const name = cleanText(row.name);
  const price = parsePrice(row.discount_price) || parsePrice(row.actual_price);
  const image = cleanText(row.image);

  if (!name || !price || !image.startsWith("http")) {
    return null;
  }

  return {
    name,
    description: cleanText(`${row.main_category} ${row.sub_category}`) || "Electronics product",
    price,
    images: [image],
    category: getCategoryFromRow(row),
    stock: 20,
    rating: parseRating(row.ratings),
    rating_count: parseRatingCount(row.no_of_ratings),
  };
};

const insertProductsBatch = async (client, products) => {
  if (products.length === 0) {
    return;
  }

  const values = [];
  const placeholders = products
    .map((product, index) => {
      const offset = index * 6;
      values.push(
        product.name,
        product.description,
        product.price,
        product.images,
        product.category,
        product.stock,
        product.rating,
        product.rating_count
      );

      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${
        offset + 6
      }, $${offset + 7}, $${offset + 8})`;
    })
    .join(", ");

  await client.query(
    `
      INSERT INTO products (name, description, price, images, category, stock, rating, rating_count)
      VALUES ${placeholders}
    `,
    values
  );
};

const appendElectronicsProducts = async () => {
  let client;

  try {
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`Electronics CSV file not found at ${CSV_PATH}`);
    }

    const csvText = fs.readFileSync(CSV_PATH, "utf8");
    const parsedRows = parseCsv(csvText);
    const headers = parsedRows.shift().map((header) => cleanText(header));

    client = await pool.connect();
    await client.query("BEGIN");

    const existingProductsResult = await client.query("SELECT LOWER(name) AS name FROM products");
    const existingNames = new Set(existingProductsResult.rows.map((row) => row.name));

    const productsToInsert = [];
    let insertedCount = 0;

    for (const rowValues of parsedRows) {
      const row = createRowObject(headers, rowValues);
      const product = mapCsvRowToProduct(row);

      if (!product) {
        continue;
      }

      const productKey = product.name.toLowerCase();
      if (existingNames.has(productKey)) {
        continue;
      }

      existingNames.add(productKey);
      productsToInsert.push(product);
    }

    const batchSize = 250;
    for (let index = 0; index < productsToInsert.length; index += batchSize) {
      const batch = productsToInsert.slice(index, index + batchSize);
      await insertProductsBatch(client, batch);
      insertedCount += batch.length;
    }

    await client.query("COMMIT");
    console.log(`Appended ${insertedCount} new products from electronics CSV.`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back electronics CSV import:", rollbackError.message);
      }
    }

    console.error("Error appending electronics products:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

appendElectronicsProducts();
