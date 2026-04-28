const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true
    },
    membershipNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    memberName: {
      type: String,
      required: true,
      trim: true
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    actualReturnDate: Date,
    remarks: {
      type: String,
      trim: true,
      default: ""
    },
    fineAmount: {
      type: Number,
      default: 0
    },
    finePaid: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["issued", "returned"],
      default: "issued"
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Borrow", borrowSchema);

