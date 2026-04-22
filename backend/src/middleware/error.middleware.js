module.exports = (err, req, res, next) => {

  const status = err.statusCode || err.status || 500;

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({ msg: `${field} already in use` });
  }

  if (err?.name === "ValidationError") {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ msg: first?.message || "Validation failed" });
  }

  return res.status(status).json({ msg: err.message || "Server error" });
};

