const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    membershipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    planMonths: {
      type: Number,
      enum: [6, 12, 24],
      required: true
    },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active"
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Membership", membershipSchema);

