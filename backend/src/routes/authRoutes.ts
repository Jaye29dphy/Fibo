import express from "express";
import { register, login, getUser } from "../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", getUser);

export default router;
