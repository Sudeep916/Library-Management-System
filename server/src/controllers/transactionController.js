const asyncHandler = require("../middleware/asyncHandler");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const Membership = require("../models/Membership");
const { addDays, diffInDays, startOfDay } = require("../utils/date");

const FINE_PER_DAY = 10;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const calculateFine = (dueDate, actualReturnDate) => {
  const lateDays = Math.max(0, diffInDays(actualReturnDate, dueDate));
  return lateDays * FINE_PER_DAY;
};

const getScopedMembershipNumber = (req, res) => {
  if (req.user.role !== "user") {
    return null;
  }

  if (!req.user.membershipNumber) {
    res.status(400);
    throw new Error("This user account is not linked to a membership.");
  }

  return req.user.membershipNumber;
};

const serializeBorrow = (borrow) => ({
  id: borrow._id,
  title: borrow.bookTitle,
  author: borrow.author,
  serialNumber: borrow.serialNumber,
  membershipNumber: borrow.membershipNumber,
  memberName: borrow.memberName,
  issueDate: borrow.issueDate,
  dueDate: borrow.dueDate,
  actualReturnDate: borrow.actualReturnDate,
  fineAmount: borrow.fineAmount,
  currentFineAmount:
    borrow.status === "issued"
      ? calculateFine(borrow.dueDate, startOfDay(new Date()))
      : borrow.fineAmount,
  finePaid: borrow.finePaid,
  status: borrow.status,
  remarks: borrow.remarks,
  requestedDate: borrow.createdAt,
  requestFulfilledDate: borrow.issueDate
});

const listActiveBorrows = asyncHandler(async (req, res) => {
  const membershipNumber = getScopedMembershipNumber(req, res);
  const query = { status: "issued" };

  if (membershipNumber) {
    query.membershipNumber = membershipNumber;
  }

  const borrows = await Borrow.find(query).sort({ dueDate: 1 });
  res.json({ borrows: borrows.map(serializeBorrow) });
});

const listBorrowHistory = asyncHandler(async (req, res) => {
  const membershipNumber = getScopedMembershipNumber(req, res);
  const query = {};

  if (membershipNumber) {
    query.membershipNumber = membershipNumber;
  }

  const borrows = await Borrow.find(query).sort({ createdAt: -1 });
  res.json({ borrows: borrows.map(serializeBorrow) });
});

const issueBook = asyncHandler(async (req, res) => {
  const bookId = req.body.bookId;
  const membershipNumber =
    req.user.role === "user"
      ? getScopedMembershipNumber(req, res)
      : req.body.membershipNumber?.trim().toUpperCase();
  const remarks = req.body.remarks?.trim() || "";
  const issueDateRaw = req.body.issueDate;
  const returnDateRaw = req.body.returnDate;

  if (!bookId || !membershipNumber || !issueDateRaw || !returnDateRaw) {
    res.status(400);
    throw new Error("Make a valid selection before issuing the book.");
  }

  const issueDate = startOfDay(issueDateRaw);
  const returnDate = startOfDay(returnDateRaw);
  const today = startOfDay(new Date());

  if (Number.isNaN(issueDate.getTime()) || Number.isNaN(returnDate.getTime())) {
    res.status(400);
    throw new Error("Enter valid issue and return dates.");
  }

  if (issueDate < today) {
    res.status(400);
    throw new Error("Issue date cannot be earlier than today.");
  }

  if (returnDate < issueDate) {
    res.status(400);
    throw new Error("Return date cannot be earlier than the issue date.");
  }

  if (returnDate > startOfDay(addDays(issueDate, 15))) {
    res.status(400);
    throw new Error("Return date cannot be greater than 15 days from the issue date.");
  }

  const [book, membership] = await Promise.all([
    Book.findById(bookId),
    Membership.findOne({ membershipNumber })
  ]);

  if (!book) {
    res.status(404);
    throw new Error("Book not found.");
  }

  if (book.isIssued) {
    res.status(400);
    throw new Error("This book is not currently available.");
  }

  if (!membership || membership.status !== "active") {
    res.status(400);
    throw new Error("Select a valid active membership.");
  }

  if (startOfDay(membership.endDate) < issueDate) {
    res.status(400);
    throw new Error("This membership is expired for the selected issue date.");
  }

  const borrow = await Borrow.create({
    book: book._id,
    membership: membership._id,
    membershipNumber: membership.membershipNumber,
    memberName: membership.name,
    bookTitle: book.title,
    author: book.author,
    serialNumber: book.serialNumber,
    issueDate,
    dueDate: returnDate,
    remarks,
    issuedBy: req.user._id
  });

  book.isIssued = true;
  await book.save();

  res.status(201).json({
    message: "Book issued successfully.",
    borrow: serializeBorrow(borrow)
  });
});

const lookupIssuedBook = asyncHandler(async (req, res) => {
  const title = req.query.title?.trim();
  const serialNumber = req.query.serialNumber?.trim().toUpperCase();

  if (!title || !serialNumber) {
    res.status(400);
    throw new Error("Book title and serial number are required.");
  }

  const query = {
    status: "issued",
    serialNumber,
    bookTitle: { $regex: `^${escapeRegex(title)}$`, $options: "i" }
  };

  const membershipNumber = getScopedMembershipNumber(req, res);

  if (membershipNumber) {
    query.membershipNumber = membershipNumber;
  }

  const borrow = await Borrow.findOne(query);

  if (!borrow) {
    res.status(404);
    throw new Error("No active issue was found for this book and serial number.");
  }

  res.json({ borrow: serializeBorrow(borrow) });
});

const prepareReturn = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  const serialNumber = req.body.serialNumber?.trim().toUpperCase();
  const returnDateRaw = req.body.returnDate;

  if (!title || !serialNumber || !returnDateRaw) {
    res.status(400);
    throw new Error("Make a valid selection before continuing to pay fine.");
  }

  const actualReturnDate = startOfDay(returnDateRaw);

  if (Number.isNaN(actualReturnDate.getTime())) {
    res.status(400);
    throw new Error("Enter a valid return date.");
  }

  const query = {
    status: "issued",
    serialNumber,
    bookTitle: { $regex: `^${escapeRegex(title)}$`, $options: "i" }
  };

  const membershipNumber = getScopedMembershipNumber(req, res);

  if (membershipNumber) {
    query.membershipNumber = membershipNumber;
  }

  const borrow = await Borrow.findOne(query);

  if (!borrow) {
    res.status(404);
    throw new Error("No active issue was found for this book and serial number.");
  }

  const fineAmount = calculateFine(borrow.dueDate, actualReturnDate);

  res.json({
    returnDraft: {
      borrowId: borrow._id,
      title: borrow.bookTitle,
      author: borrow.author,
      serialNumber: borrow.serialNumber,
      membershipNumber: borrow.membershipNumber,
      memberName: borrow.memberName,
      issueDate: borrow.issueDate,
      dueDate: borrow.dueDate,
      actualReturnDate,
      fineAmount
    }
  });
});

const completeReturn = asyncHandler(async (req, res) => {
  const borrowId = req.body.borrowId;
  const actualReturnDateRaw = req.body.actualReturnDate;
  const finePaid = Boolean(req.body.finePaid);
  const remarks = req.body.remarks?.trim() || "";

  if (!borrowId || !actualReturnDateRaw) {
    res.status(400);
    throw new Error("Make a valid selection before confirming the fine payment.");
  }

  const query = { _id: borrowId, status: "issued" };
  const membershipNumber = getScopedMembershipNumber(req, res);

  if (membershipNumber) {
    query.membershipNumber = membershipNumber;
  }

  const borrow = await Borrow.findOne(query);

  if (!borrow) {
    res.status(404);
    throw new Error("Return transaction could not be found.");
  }

  const actualReturnDate = startOfDay(actualReturnDateRaw);

  if (Number.isNaN(actualReturnDate.getTime())) {
    res.status(400);
    throw new Error("Enter a valid return date.");
  }

  const fineAmount = calculateFine(borrow.dueDate, actualReturnDate);

  if (fineAmount > 0 && !finePaid) {
    res.status(400);
    throw new Error("Select Fine Paid before completing a pending fine transaction.");
  }

  borrow.actualReturnDate = actualReturnDate;
  borrow.fineAmount = fineAmount;
  borrow.finePaid = fineAmount > 0 ? finePaid : false;
  borrow.remarks = remarks;
  borrow.status = "returned";
  borrow.returnedBy = req.user._id;
  await borrow.save();

  await Book.findByIdAndUpdate(borrow.book, { isIssued: false });

  res.json({
    message: "Return book transaction completed successfully.",
    borrow: serializeBorrow(borrow)
  });
});

module.exports = {
  listActiveBorrows,
  listBorrowHistory,
  issueBook,
  lookupIssuedBook,
  prepareReturn,
  completeReturn
};
