const User = require("../models/User");
const Book = require("../models/Book");
const Membership = require("../models/Membership");
const Borrow = require("../models/Borrow");
const { addDays, addMonths, startOfDay } = require("./date");

const seedData = async () => {
  let books = await Book.find();

  if (books.length === 0) {
    books = await Book.create([
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        type: "book",
        category: "Thriller",
        serialNumber: "BK-1001",
        shelfLocation: "A1",
        isIssued: false
      },
      {
        title: "Interstellar",
        author: "Christopher Nolan",
        type: "movie",
        category: "Science Fiction",
        serialNumber: "MV-2001",
        shelfLocation: "M2",
        isIssued: false
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        type: "book",
        category: "Self Help",
        serialNumber: "BK-1002",
        shelfLocation: "B3",
        isIssued: false
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        type: "book",
        category: "Fantasy",
        serialNumber: "BK-1003",
        shelfLocation: "C4",
        isIssued: false
      }
    ]);
  }

  let memberships = await Membership.find();

  if (memberships.length === 0) {
    const today = startOfDay(new Date());

    memberships = await Membership.create([
      {
        membershipNumber: "MBR-1001",
        name: "Sudeep Kumar",
        email: "sudeep@example.com",
        phone: "9876543210",
        address: "12 Green Park, Lucknow",
        planMonths: 12,
        status: "active",
        startDate: today,
        endDate: addMonths(today, 12)
      },
      {
        membershipNumber: "MBR-1002",
        name: "Rahul Verma",
        email: "rahul@example.com",
        phone: "9123456780",
        address: "45 Lake View, Kanpur",
        planMonths: 6,
        status: "active",
        startDate: today,
        endDate: addMonths(today, 6)
      }
    ]);
  }

  if ((await User.countDocuments()) === 0) {
    await User.create([
      {
        name: "Admin",
        username: "adm",
        password: "adm",
        role: "admin",
        active: true
      },
      {
        name: "Sudeep Kumar",
        username: "user",
        membershipNumber: "MBR-1001",
        password: "user",
        role: "user",
        active: true
      }
    ]);
  }

  if ((await Borrow.countDocuments()) === 0 && books.length > 0 && memberships.length > 0) {
    const admin = await User.findOne({ username: "adm" });
    const seededBook = books.find((book) => book.serialNumber === "BK-1003");
    const seededMember = memberships.find((membership) => membership.membershipNumber === "MBR-1001");

    if (admin && seededBook && seededMember) {
      const issueDate = addDays(startOfDay(new Date()), -20);
      const dueDate = addDays(issueDate, 15);

      await Borrow.create({
        book: seededBook._id,
        membership: seededMember._id,
        membershipNumber: seededMember.membershipNumber,
        memberName: seededMember.name,
        bookTitle: seededBook.title,
        author: seededBook.author,
        serialNumber: seededBook.serialNumber,
        issueDate,
        dueDate,
        remarks: "Seeded sample issue",
        issuedBy: admin._id
      });

      seededBook.isIssued = true;
      await seededBook.save();
    }
  }
};

module.exports = seedData;
