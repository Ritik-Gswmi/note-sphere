const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

const isValidUsername = (name) => {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 40) return false;
  return /^[a-zA-Z0-9_ ]+$/.test(trimmed);
};

// Simple regex for email validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Password: min 6 chars 
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // VALIDATIONS 
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!isValidUsername(name)) {
      return res.status(400).json({
        msg: "Username must be 3–40 chars and contain only letters, numbers, spaces and _",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // VALIDATIONS
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};
