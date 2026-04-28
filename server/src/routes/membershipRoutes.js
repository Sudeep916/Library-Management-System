const express = require("express");
const {
  createMembership,
  listActiveMemberships,
  getMembershipByNumber,
  updateMembership
} = require("../controllers/membershipController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/active", protect, listActiveMemberships);
router.get("/:membershipNumber", protect, getMembershipByNumber);
router.post("/", protect, adminOnly, createMembership);
router.put("/:membershipNumber", protect, adminOnly, updateMembership);

module.exports = router;

