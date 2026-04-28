const asyncHandler = require("../middleware/asyncHandler");
const Book = require("../models/Book");

const allowedTypes = ["book", "movie"];

const normalizeBookPayload = (body) => ({
  title: body.title?.trim(),
  author: body.author?.trim(),
  type: body.type,
  category: body.category?.trim(),
  serialNumber: body.serialNumber?.trim().toUpperCase(),
  shelfLocation: body.shelfLocation?.trim()
});

const validateBookPayload = (payload) => {
  if (
    !payload.title ||
    !payload.author ||
    !payload.type ||
    !payload.category ||
    !payload.serialNumber ||
    !payload.shelfLocation
  ) {
    return "All book fields are mandatory.";
  }

  if (!allowedTypes.includes(payload.type)) {
    return "Select either book or movie.";
  }

  return null;
};

const listBooks = asyncHandler(async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json({ books });
});

const listAvailableBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ isIssued: false }).sort({ title: 1 });
  res.json({ books });
});

const createBook = asyncHandler(async (req, res) => {
  const payload = normalizeBookPayload(req.body);
  const validationError = validateBookPayload(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const existingBook = await Book.findOne({ serialNumber: payload.serialNumber });

  if (existingBook) {
    res.status(400);
    throw new Error("A book or movie already exists with this serial number.");
  }

  const book = await Book.create(payload);
  res.status(201).json({ message: "Book created successfully.", book });
});

const updateBook = asyncHandler(async (req, res) => {
  const payload = normalizeBookPayload(req.body);
  const validationError = validateBookPayload(payload);

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  const duplicateBook = await Book.findOne({
    serialNumber: payload.serialNumber,
    _id: { $ne: book._id }
  });

  if (duplicateBook) {
    res.status(400);
    throw new Error("Another record already uses this serial number.");
  }

  Object.assign(book, payload);
  await book.save();

  res.json({ message: "Book updated successfully.", book });
});

module.exports = {
  listBooks,
  listAvailableBooks,
  createBook,
  updateBook
};

