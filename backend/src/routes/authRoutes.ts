import express from "express";
import { register, login, getUser, sendOtp, changePassword } from "../controllers/authController";

const router = express.Router();

router.post("/change-password", changePassword);
router.post("/send-otp", sendOtp); 
router.post("/register", register);
router.post("/login", login);
router.get("/me", getUser);

export default router;
