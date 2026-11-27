import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = allowedTypes[file.mimetype];

    cb(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes[file.mimetype]) {
    const error = new Error("Upload a JPG, PNG, or WebP image");

    error.statusCode = 415;

    return cb(error);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadPhoto = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Image is required",
    });
  }

  res.status(201).json({
    photo_url: `/uploads/${req.file.filename}`,
  });
};
