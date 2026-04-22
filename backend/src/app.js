const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("NoteSphere API is running 🚀");
});

app.use("/api/auth", require("./routes/auth.routes.js"));
app.use("/api/users", require("./routes/user.routes.js"));
app.use("/api/notes", require("./routes/note.routes.js"));

// Error handler 
app.use(require("./middleware/error.middleware.js"));

module.exports = app;
