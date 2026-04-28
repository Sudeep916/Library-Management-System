const express = require("express");
const {
  completeReturn,
  issueBook,
  listActiveBorrows,
  listBorrowHistory,
  lookupIssuedBook,
  prepareReturn
} = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/active", protect, listActiveBorrows);
router.get("/history", protect, listBorrowHistory);
router.get("/lookup-issue", protect, lookupIssuedBook);
router.post("/issue", protect, issueBook);
router.post("/prepare-return", protect, prepareReturn);
router.post("/complete-return", protect, completeReturn);

module.exports = router;
