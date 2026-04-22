require("dotenv").config();
const app = require("./app.js");
const connectDB = require("./config/db.js");

connectDB();

app.listen(process.env.PORT, () =>
  console.log(`Server running on ${process.env.PORT}`)
);