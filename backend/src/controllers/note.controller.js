const Note = require("../models/note.model.js");

exports.listNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user })
      .select("text createdAt updatedAt")
      .sort({ createdAt: 1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ msg: "Note text is required" });
    if (text.length > 240) return res.status(400).json({ msg: "Note must be at most 240 characters" });

    const note = await Note.create({ user: req.user, text });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json({ msg: "Deleted" });
  } catch (err) {
    next(err);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ msg: "Note text is required" });
    if (text.length > 240) return res.status(400).json({ msg: "Note must be at most 240 characters" });

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      { text },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(note);
  } catch (err) {
    next(err);
  }
};
