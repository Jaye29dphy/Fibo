import { Router, RequestHandler } from "express";
import { OwnerController } from "../controllers/ownerController";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";
import multer from "multer";

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/"); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).user?.id;
    cb(null, `${userId}_avatar_${Date.now()}.jpg`);
  },
});
const upload = multer({ storage });

const router = Router();



export default router;