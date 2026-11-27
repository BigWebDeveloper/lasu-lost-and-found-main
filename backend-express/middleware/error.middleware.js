import multer from "multer";

const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "Images must be smaller than 5 MB",
      });
    }
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
};

export default errorMiddleware;
