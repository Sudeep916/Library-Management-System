const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectDatabase, disconnectDatabase } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const reportRoutes = require("./routes/reportRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes");
const seedData = require("./utils/seeder");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Library Management System API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  await seedData();

  app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
  });
};

startServer().catch(async (error) => {
  console.error("Failed to start server.", error);
  await disconnectDatabase();
  process.exit(1);
});

