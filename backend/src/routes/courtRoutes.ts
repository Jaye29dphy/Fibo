import express from "express";
import { createCourt, getCourts } from "../controllers/courtController";
import { authenticate } from "../middleware/authMiddleware"; // ✅ Import đúng

const router = express.Router();

router.post("/", authenticate, createCourt); // ✅ Middleware đúng
router.get("/", getCourts);

export default router;
