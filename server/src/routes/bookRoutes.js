const express = require("express");
const { createBook, listAvailableBooks, listBooks, updateBook } = require("../controllers/bookController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/available", protect, listAvailableBooks);
router.get("/", protect, adminOnly, listBooks);
router.post("/", protect, adminOnly, createBook);
router.put("/:id", protect, adminOnly, updateBook);

module.exports = router;

