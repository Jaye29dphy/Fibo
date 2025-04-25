import { Router } from "express";
import { uploadAvatar } from "../controllers/uploadController";
import { avatarUploadMiddleware } from "../middleware/multerConfig";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Route to upload avatar (protected with authentication)
router.post("/", authenticate, avatarUploadMiddleware, uploadAvatar);

export default router;