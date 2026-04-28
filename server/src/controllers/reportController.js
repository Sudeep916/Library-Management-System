const asyncHandler = require("../middleware/asyncHandler");
const Book = require("../models/Book");
const Membership = require("../models/Membership");
const Borrow = require("../models/Borrow");
const { diffInDays, startOfDay } = require("../utils/date");

const FINE_PER_DAY = 10;

const buildMembershipScope = (req) => {
  if (req.user.role !== "user") {
    return {};
  }

  return {
    membershipNumber: req.user.membershipNumber || "__unlinked__"
  };
};

const calculatePendingFine = (dueDate, referenceDate = new Date()) => {
  const lateDays = Math.max(0, diffInDays(referenceDate, dueDate));
  return lateDays * FINE_PER_DAY;
};

const serializeInventoryItem = (book) => ({
  id: book._id,
  serialNumber: book.serialNumber,
  title: book.title,
  author: book.author,
  category: book.category,
  type: book.type,
  shelfLocation: book.shelfLocation,
  status: book.isIssued ? "Issued" : "Available",
  procurementDate: book.createdAt
});

const serializeMembershipReport = (membership, pendingFine) => ({
  id: membership._id,
  membershipNumber: membership.membershipNumber,
  name: membership.name,
  phone: membership.phone,
  address: membership.address,
  startDate: membership.startDate,
  endDate: membership.endDate,
  status: membership.status,
  pendingFine
});

const serializeBorrowReport = (borrow, extra = {}) => ({
  id: borrow._id,
  serialNumber: borrow.serialNumber,
  title: borrow.bookTitle,
  membershipNumber: borrow.membershipNumber,
  memberName: borrow.memberName,
  issueDate: borrow.issueDate,
  dueDate: borrow.dueDate,
  actualReturnDate: borrow.actualReturnDate,
  fineAmount: extra.fineAmount ?? borrow.fineAmount ?? 0,
  requestedDate: borrow.createdAt,
  requestFulfilledDate: borrow.issueDate,
  status: borrow.status
});

const getAvailableBooksReport = asyncHandler(async (req, res) => {
  const title = req.query.title?.trim();
  const type = req.query.type?.trim();

  if (!title && !type) {
    res.status(400);
    throw new Error("Enter a title or choose a type before searching.");
  }

  const query = { isIssued: false };

  if (title) {
    query.title = { $regex: title, $options: "i" };
  }

  if (type) {
    query.type = type;
  }

  const books = await Book.find(query).sort({ title: 1 });
  res.json({ books });
});

const getSummary = asyncHandler(async (req, res) => {
  if (req.user.role === "user") {
    const membershipScope = buildMembershipScope(req);
    const today = startOfDay(new Date());

    const [membership, activeIssues, returnedBooks, availableCount] = await Promise.all([
      Membership.findOne(membershipScope),
      Borrow.find({ ...membershipScope, status: "issued" }),
      Borrow.countDocuments({ ...membershipScope, status: "returned" }),
      Book.countDocuments({ isIssued: false })
    ]);

    const overdueBorrows = activeIssues.filter((borrow) => startOfDay(borrow.dueDate) < today);
    const outstandingFine = overdueBorrows.reduce(
      (total, borrow) => total + calculatePendingFine(borrow.dueDate, today),
      0
    );

    return res.json({
      summary: {
        dashboardType: "user",
        availableCount,
        activeIssues: activeIssues.length,
        overdueBooks: overdueBorrows.length,
        returnedBooks,
        outstandingFine,
        membershipNumber: membership?.membershipNumber || req.user.membershipNumber || "",
        membershipStatus: membership?.status || "unlinked",
        membershipEndDate: membership?.endDate || null,
        memberName: membership?.name || req.user.name
      }
    });
  }

  const [bookCount, availableCount, activeMemberships, activeBorrows] = await Promise.all([
    Book.countDocuments(),
    Book.countDocuments({ isIssued: false }),
    Membership.countDocuments({ status: "active" }),
    Borrow.countDocuments({ status: "issued" })
  ]);

  res.json({
    summary: {
      dashboardType: "admin",
      bookCount,
      availableCount,
      activeMemberships,
      activeBorrows
    }
  });
});

const getDetailedReports = asyncHandler(async (req, res) => {
  const membershipScope = buildMembershipScope(req);
  const today = startOfDay(new Date());

  const [inventory, memberships, activeIssues, overdueReturns, issueRequests] = await Promise.all([
    Book.find().sort({ title: 1 }),
    Membership.find(req.user.role === "user" ? membershipScope : {}).sort({ name: 1 }),
    Borrow.find({ ...membershipScope, status: "issued" }).sort({ dueDate: 1 }),
    Borrow.find({
      ...membershipScope,
      status: "issued",
      dueDate: { $lt: today }
    }).sort({ dueDate: 1 }),
    Borrow.find(membershipScope).sort({ createdAt: -1 })
  ]);

  const pendingFineByMembership = overdueReturns.reduce((accumulator, borrow) => {
    const nextFine = calculatePendingFine(borrow.dueDate, today);
    accumulator[borrow.membershipNumber] =
      (accumulator[borrow.membershipNumber] || 0) + nextFine;
    return accumulator;
  }, {});

  res.json({
    reports: {
      books: inventory
        .filter((item) => item.type === "book")
        .map((item) => serializeInventoryItem(item)),
      movies: inventory
        .filter((item) => item.type === "movie")
        .map((item) => serializeInventoryItem(item)),
      memberships: memberships.map((membership) =>
        serializeMembershipReport(
          membership,
          pendingFineByMembership[membership.membershipNumber] || 0
        )
      ),
      activeIssues: activeIssues.map((borrow) => serializeBorrowReport(borrow)),
      overdueReturns: overdueReturns.map((borrow) =>
        serializeBorrowReport(borrow, {
          fineAmount: calculatePendingFine(borrow.dueDate, today)
        })
      ),
      issueRequests: issueRequests.map((borrow) => serializeBorrowReport(borrow))
    }
  });
});

module.exports = {
  getAvailableBooksReport,
  getSummary,
  getDetailedReports
};
