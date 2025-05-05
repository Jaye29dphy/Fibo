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

// Type casting to make TypeScript happy with our route handlers
const getProfile = OwnerController.getProfile as RequestHandler;
const updateProfile = OwnerController.updateProfile as RequestHandler;
const uploadAvatar = OwnerController.uploadAvatar as RequestHandler;
const getSubscription = OwnerController.getSubscription as RequestHandler;
const purchaseSubscription = OwnerController.purchaseSubscription as RequestHandler;

// Profile routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/avatar", authenticate, upload.single("avatar"), uploadAvatar);

// Subscription routes
router.get("/subscription", authenticate, getSubscription);
router.post("/subscription", authenticate, purchaseSubscription);

export default router;