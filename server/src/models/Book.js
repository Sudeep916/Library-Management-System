const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["book", "movie"],
      default: "book"
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    shelfLocation: {
      type: String,
      required: true,
      trim: true
    },
    isIssued: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Book", bookSchema);

