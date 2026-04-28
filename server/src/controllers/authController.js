const jwt = require("jsonwebtoken");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");

const buildAuthResponse = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  membershipNumber: user.membershipNumber || "",
  role: user.role,
  active: user.active
});

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "library-secret-key", {
    expiresIn: "1d"
  });

const login = asyncHandler(async (req, res) => {
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;
  const expectedRole = req.body.expectedRole?.trim().toLowerCase();

  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required.");
  }

  const user = await User.findOne({ username });

  if (!user || !(await user.comparePassword(password))) {
    res.status(400);
    throw new Error("Invalid username or password.");
  }

  if (!user.active) {
    res.status(403);
    throw new Error("This user account is inactive.");
  }

  if (expectedRole && user.role !== expectedRole) {
    res.status(403);
    throw new Error(`Use the ${user.role} login page for this account.`);
  }

  res.json({
    token: createToken(user),
    user: buildAuthResponse(user)
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    user: buildAuthResponse(req.user)
  });
});

module.exports = {
  login,
  getProfile
};
