import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:\\img\\ava");
  },
  filename: (req, file, cb) => {
    // Lấy phần mở rộng từ mimetype
    const mimeType = file.mimetype;
    const extension = mimeType.split("/")[1]; // e.g., "png", "jpeg"
    
    // Tạo tên file tạm thời, sẽ được đổi tên sau khi xử lý xong
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `temp_${uniqueSuffix}.${extension}`);
  },
});

// File filter to accept only images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(null, false);
    cb(new Error("Only image files are allowed!") as any);
  }
};

// Multer middleware for avatar upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single("avatar"); // Expect a single file with field name "avatar"

export const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};