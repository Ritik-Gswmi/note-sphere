const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { listNotes, createNote, deleteNote, updateNote } = require("../controllers/note.controller");

router.get("/", auth, listNotes);
router.post("/", auth, createNote);
router.put("/:id", auth, updateNote);
router.delete("/:id", auth, deleteNote);

module.exports = router;
