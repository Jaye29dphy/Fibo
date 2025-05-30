import express from "express";
import {
    createBooking,
    createCourt,
    getFieldImages,
    getFields,
    getServices,
    getOccupiedSlots,
    getSubFields,
    getTimeSlots,
    createPendingOrder,
    sepayWebhookHandler,
    getOrderStatus,
    cancelPendingOrder,
    updateOrderStatus,
    updateFieldStatus,
    addSubField,
    updateSubFieldStatus,
    getFieldDetail,
    deleteSubField
} from "../controllers/courtController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authenticate, createCourt);
router.get("/", getFields);
router.get("/:field_id", getFieldDetail);
router.get("/:fieldId/subfields", getSubFields);
router.post("/:fieldId/subfields", authenticate, addSubField);
router.put("/:fieldId/subfields/:subFieldId", authenticate, updateSubFieldStatus);
router.delete("/:fieldId/subfields/:subFieldId", authenticate, deleteSubField);
router.get("/:fieldId/time-slots", getTimeSlots);
router.get("/:fieldId/services", getServices);
router.post("/bookings", authenticate, createBooking);
router.get("/:fieldId/images", getFieldImages);
router.post("/orders/pending", createPendingOrder);
router.post("/sepay-webhook", sepayWebhookHandler);
router.get("/orders/status/:booking_code", getOrderStatus);
router.post("/orders/update-status/:booking_code", updateOrderStatus);
router.delete("/orders/delete-pending/:booking_code", cancelPendingOrder);
router.put("/:fieldId/status", authenticate, updateFieldStatus);
router.get("/fields/:fieldId/occupied-slots", getOccupiedSlots);

export default router;