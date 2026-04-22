const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select("name email");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ msg: "Email already in use" });
      user.email = email;
    }

    if (typeof name === "string" && name.trim()) user.name = name.trim();

    if (typeof password === "string" && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
};

