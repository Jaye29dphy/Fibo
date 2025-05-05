import express from "express";
import { register, login, getUser, sendOtp, changePassword, getNotifications , updateUser } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/change-password", changePassword);
router.post("/send-otp", sendOtp); 
router.post("/register", register);
router.post("/login", login);
router.get("/me", getUser);
router.put("/:id", updateUser )
router.get("/notifications", authenticate, getNotifications);

export default router;
