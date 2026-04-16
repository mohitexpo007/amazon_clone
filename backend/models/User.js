const crypto = require("crypto");
const pool = require("./db");

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = "sha512";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString("hex");

  return `${salt}:${derivedKey}`;
};

const verifyPassword = (password, storedHash = "") => {
  const [salt, originalKey] = storedHash.split(":");

  if (!salt || !originalKey) {
    return false;
  }

  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(originalKey, "hex"), Buffer.from(derivedKey, "hex"));
};

class User {
  static async ensureTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        address TEXT,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
  }

  static async findByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const result = await pool.query(
      "SELECT id, name, email, address, password_hash, created_at FROM users WHERE email = $1",
      [normalizedEmail]
    );

    return result.rows[0] || null;
  }

  static async create({ name, email, password, address }) {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (name, email, address, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, created_at`,
      [String(name).trim(), normalizedEmail, String(address || "").trim(), passwordHash]
    );

    return result.rows[0];
  }

  static async authenticate(email, password) {
    const user = await this.findByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      created_at: user.created_at,
    };
  }
}

module.exports = User;
