const express = require("express");
const {
  getAvailableBooksReport,
  getSummary,
  getDetailedReports
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/available-books", protect, getAvailableBooksReport);
router.get("/collection", protect, getDetailedReports);
router.get("/summary", protect, getSummary);

module.exports = router;
