import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config(); // Đảm bảo .env được load

// Sử dụng đường dẫn từ biến môi trường
const avatarBasePath = process.env.AVATAR_IMAGE_PATH || "F:\\img\\avatar";

// Cấu hình nơi lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarBasePath);
  },
  filename: (req, file, cb) => {
    const mimeType = file.mimetype;
    const extension = mimeType.split("/")[1]?.toLowerCase() || "jpg";
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `temp_${uniqueSuffix}.${extension}`);
  },
});

// Chỉ cho phép file ảnh
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!") as any); 
  }
};

// Multer middleware hoàn chỉnh
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("avatar");

export const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};
