const User = require("../models/User");

const getSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  address: user.address,
  createdAt: user.created_at,
});

const signup = async (req, res) => {
  try {
    await User.ensureTable();

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const address = String(req.body?.address || "").trim();
    const password = String(req.body?.password || "");

    if (!name || !email || !address || !password) {
      return res.status(400).json({ message: "Name, email, address, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, address });
    return res.status(201).json({ user: getSafeUser(user) });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Unable to create your account right now." });
  }
};

const signin = async (req, res) => {
  try {
    await User.ensureTable();

    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.authenticate(email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({ user: getSafeUser(user) });
  } catch (error) {
    console.error("Error signing in user:", error);
    return res.status(500).json({ message: "Unable to sign you in right now." });
  }
};

module.exports = {
  signup,
  signin,
};
