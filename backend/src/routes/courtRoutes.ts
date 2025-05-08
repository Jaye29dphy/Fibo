import express from "express";
import { createBooking, createCourt, getFieldImages, getFields, getServices, getSubFields, getTimeSlots, createPendingOrder, sepayWebhookHandler, getOrderStatus, cancelPendingOrder, updateOrderStatus, updateFieldStatus } from "../controllers/courtController";
import { authenticate } from "../middleware/authMiddleware";
import { getFieldDetail } from "../controllers/courtController";

const router = express.Router();

router.post("/", authenticate, createCourt);
router.get("/", getFields);
router.get("/:fieldId", getFieldDetail);
router.get("/:fieldId/subfields", getSubFields);
router.get("/:fieldId/timeslots", getTimeSlots);
router.get("/:fieldId/services", getServices);
router.post("/bookings", authenticate, createBooking);
router.get("/:fieldId/images", getFieldImages);
router.post("/orders/pending", createPendingOrder);
router.post("/sepay-webhook", sepayWebhookHandler);
router.get("/orders/status/:bookingCode", getOrderStatus);
router.post("/orders/update-status/:bookingCode", updateOrderStatus);
router.delete("/orders/delete-pending/:bookingCode", cancelPendingOrder);
router.put("/:fieldId/status", authenticate, updateFieldStatus);

export default router;