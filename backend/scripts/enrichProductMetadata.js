const fs = require("fs");
const pool = require("../models/db");

const CATALOG_CSV_PATH =
  process.env.PRODUCTS_CSV_PATH || "C:\\Users\\ACER\\Downloads\\products.csv";
const ELECTRONICS_CSV_PATH =
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

const parseRating = (value) => {
  const cleaned = cleanText(value).replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, 5);
};

const parseRatingCount = (value) => {
  const cleaned = cleanText(value).replace(/[^0-9]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const loadCsvMap = (csvPath, nameKey, ratingKey, ratingCountKey) => {
  if (!fs.existsSync(csvPath)) {
    return new Map();
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const parsedRows = parseCsv(csvText);
  const headers = parsedRows.shift().map((header) => cleanText(header));
  const metadataMap = new Map();

  for (const rowValues of parsedRows) {
    const row = createRowObject(headers, rowValues);
    const name = cleanText(row[nameKey]).toLowerCase();

    if (!name) {
      continue;
    }

    metadataMap.set(name, {
      rating: parseRating(row[ratingKey]),
      ratingCount: parseRatingCount(row[ratingCountKey]),
    });
  }

  return metadataMap;
};

const updateMetadataBatch = async (client, rows) => {
  if (rows.length === 0) {
    return;
  }

  const values = [];
  const placeholders = rows
    .map((row, index) => {
      const offset = index * 3;
      values.push(row.name, row.rating, row.ratingCount);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    })
    .join(", ");

  await client.query(
    `
      UPDATE products AS p
      SET rating = metadata.rating::numeric, rating_count = metadata.rating_count::integer
      FROM (
        VALUES ${placeholders}
      ) AS metadata(name, rating, rating_count)
      WHERE LOWER(p.name) = metadata.name
    `,
    values
  );
};

const enrichProductMetadata = async () => {
  let client;

  try {
    const combinedMetadata = new Map([
      ...loadCsvMap(CATALOG_CSV_PATH, "title", "rating_stars", "rating_count"),
      ...loadCsvMap(ELECTRONICS_CSV_PATH, "name", "ratings", "no_of_ratings"),
    ]);

    client = await pool.connect();
    await client.query("BEGIN");

    const productsResult = await client.query("SELECT id, name FROM products");
    const updates = [];

    for (const product of productsResult.rows) {
      const metadata = combinedMetadata.get(cleanText(product.name).toLowerCase());

      if (!metadata) {
        continue;
      }

      updates.push({
        name: cleanText(product.name).toLowerCase(),
        rating: metadata.rating,
        ratingCount: metadata.ratingCount,
      });
    }

    const batchSize = 500;
    for (let index = 0; index < updates.length; index += batchSize) {
      await updateMetadataBatch(client, updates.slice(index, index + batchSize));
    }

    await client.query("COMMIT");
    console.log(`Enriched ${updates.length} products with rating metadata.`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back metadata enrichment:", rollbackError.message);
      }
    }

    console.error("Error enriching product metadata:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

enrichProductMetadata();
