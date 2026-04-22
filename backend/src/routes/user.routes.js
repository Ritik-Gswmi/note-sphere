const router = require("express").Router();
const auth = require("../middleware/auth.middleware.js");
const { getMe, updateMe } = require("../controllers/user.controller.js");

router.get("/me", auth, getMe);
router.put("/me", auth, updateMe);

module.exports = router;

