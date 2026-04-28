const asyncHandler = require("../middleware/asyncHandler");
const Membership = require("../models/Membership");
const { addMonths, startOfDay } = require("../utils/date");

const allowedPlans = [6, 12, 24];

const generateMembershipNumber = () =>
  `MBR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;

const createMembership = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const phone = req.body.phone?.trim();
  const address = req.body.address?.trim();
  const planMonths = Number(req.body.planMonths);

  if (!name || !email || !phone || !address || !allowedPlans.includes(planMonths)) {
    res.status(400);
    throw new Error("All membership fields are mandatory.");
  }

  const startDate = startOfDay(new Date());
  const membership = await Membership.create({
    membershipNumber: generateMembershipNumber(),
    name,
    email,
    phone,
    address,
    planMonths,
    status: "active",
    startDate,
    endDate: addMonths(startDate, planMonths)
  });

  res.status(201).json({
    message: "Membership added successfully.",
    membership
  });
});

const listActiveMemberships = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ status: "active" }).sort({ name: 1 });
  res.json({ memberships });
});

const getMembershipByNumber = asyncHandler(async (req, res) => {
  const membershipNumber = req.params.membershipNumber?.trim().toUpperCase();
  const membership = await Membership.findOne({ membershipNumber });

  if (!membership) {
    res.status(404);
    throw new Error("Membership number not found.");
  }

  res.json({ membership });
});

const updateMembership = asyncHandler(async (req, res) => {
  const membershipNumber = req.params.membershipNumber?.trim().toUpperCase();
  const action = req.body.action;
  const extensionMonths = Number(req.body.extensionMonths || 6);

  if (!membershipNumber) {
    res.status(400);
    throw new Error("Membership number is required.");
  }

  const membership = await Membership.findOne({ membershipNumber });

  if (!membership) {
    res.status(404);
    throw new Error("Membership number not found.");
  }

  if (action === "cancel") {
    membership.status = "cancelled";
    await membership.save();
    return res.json({
      message: "Membership cancelled successfully.",
      membership
    });
  }

  if (action !== "extend" || !allowedPlans.includes(extensionMonths)) {
    res.status(400);
    throw new Error("Select a valid membership update option.");
  }

  if (membership.status === "cancelled") {
    res.status(400);
    throw new Error("Cancelled memberships cannot be extended.");
  }

  const baseDate =
    membership.endDate > startOfDay(new Date()) ? membership.endDate : startOfDay(new Date());

  membership.endDate = addMonths(baseDate, extensionMonths);
  membership.planMonths = extensionMonths;
  await membership.save();

  res.json({
    message: "Membership updated successfully.",
    membership
  });
});

module.exports = {
  createMembership,
  listActiveMemberships,
  getMembershipByNumber,
  updateMembership
};

