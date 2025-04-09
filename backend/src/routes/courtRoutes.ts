import express from "express";
import { createBooking, createCourt, getFields, getServices, getSubFields, getTimeSlots } from "../controllers/courtController";
import { authenticate } from "../middleware/authMiddleware"; // ✅ Import đúng
import { getFieldDetail } from "../controllers/courtController";

const router = express.Router();

router.post("/", authenticate, createCourt); // ✅ Middleware đúng
router.get("/", getFields);
router.get("/:id", getFieldDetail);
router.get("/:fieldId/subfields", getSubFields);
router.get("/:fieldId/timeslots", getTimeSlots);
router.get("/:fieldId/services", getServices);
router.post("/bookings", authenticate, createBooking);

export default router;
