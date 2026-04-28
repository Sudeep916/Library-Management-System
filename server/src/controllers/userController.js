const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Membership = require("../models/Membership");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  membershipNumber: user.membershipNumber || "",
  role: user.role,
  active: user.active
});

const resolveMembershipNumber = async (role, membershipNumber) => {
  if (role !== "user") {
    return "";
  }

  const normalizedMembershipNumber = membershipNumber?.trim().toUpperCase();

  if (!normalizedMembershipNumber) {
    throw new Error("A linked membership is required for a normal user.");
  }

  const membership = await Membership.findOne({
    membershipNumber: normalizedMembershipNumber,
    status: "active"
  });

  if (!membership) {
    throw new Error("Select a valid active membership for this user.");
  }

  return normalizedMembershipNumber;
};

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ name: 1 });
  res.json({ users: users.map(sanitizeUser) });
});

const createUser = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;
  const role = req.body.role;
  const active = req.body.active !== false;
  const membershipNumber = req.body.membershipNumber;

  if (!name || !username || !password || !role) {
    res.status(400);
    throw new Error("Name and all user details are required.");
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    res.status(400);
    throw new Error("Username already exists.");
  }

  let resolvedMembershipNumber = "";

  try {
    resolvedMembershipNumber = await resolveMembershipNumber(role, membershipNumber);
  } catch (error) {
    res.status(400);
    throw error;
  }

  const user = await User.create({
    name,
    username,
    membershipNumber: resolvedMembershipNumber,
    password,
    role,
    active
  });

  res.status(201).json({
    message: "User created successfully.",
    user: sanitizeUser(user)
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;
  const role = req.body.role;
  const active = Boolean(req.body.active);
  const membershipNumber = req.body.membershipNumber;

  if (!name || !username || !role) {
    res.status(400);
    throw new Error("Name and user details are required.");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const duplicateUser = await User.findOne({
    username,
    _id: { $ne: user._id }
  });

  if (duplicateUser) {
    res.status(400);
    throw new Error("Another user already uses this username.");
  }

  let resolvedMembershipNumber = "";

  try {
    resolvedMembershipNumber = await resolveMembershipNumber(role, membershipNumber);
  } catch (error) {
    res.status(400);
    throw error;
  }

  user.name = name;
  user.username = username;
  user.membershipNumber = resolvedMembershipNumber;
  user.role = role;
  user.active = active;

  if (password) {
    user.password = password;
  }

  await user.save();

  res.json({
    message: "User updated successfully.",
    user: sanitizeUser(user)
  });
});

module.exports = {
  listUsers,
  createUser,
  updateUser
};
