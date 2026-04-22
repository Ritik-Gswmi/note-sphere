const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Note text is required"],
      trim: true,
      maxlength: [240, "Note must be at most 240 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);

