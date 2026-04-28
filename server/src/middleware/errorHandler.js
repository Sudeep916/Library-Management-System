const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found." });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(err);
  res.status(statusCode).json({
    message: err.message || "Internal server error."
  });
};

module.exports = {
  notFound,
  errorHandler
};

