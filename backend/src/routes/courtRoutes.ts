import express from "express";
import { createCourt, getFields } from "../controllers/courtController";
import { authenticate } from "../middleware/authMiddleware"; // ✅ Import đúng
import { getFieldDetail } from "../controllers/courtController";

const router = express.Router();

router.post("/", authenticate, createCourt); // ✅ Middleware đúng
router.get("/", getFields);
router.get("/:id", getFieldDetail);

export default router;
