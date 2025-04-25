import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "D:\\img\\ava");
  },
  filename: (req, file, cb) => {
    const userId = req.body.user_id;
    const timestamp = Date.now(); // Add timestamp for uniqueness
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_avatar_${timestamp}${ext}`); 
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