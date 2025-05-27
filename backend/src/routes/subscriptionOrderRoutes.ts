import { Router, RequestHandler } from "express";
import { SubscriptionOrderController } from "../controllers/subscriptionOrderController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Type casting để TypeScript hài lòng với các route handlers
const createSubscriptionPendingOrder = SubscriptionOrderController.createSubscriptionPendingOrder as RequestHandler;
const getSubscriptionOrderStatus = SubscriptionOrderController.getSubscriptionOrderStatus as RequestHandler;
const updateSubscriptionOrderStatus = SubscriptionOrderController.updateSubscriptionOrderStatus as RequestHandler;
const deleteSubscriptionPendingOrder = SubscriptionOrderController.deleteSubscriptionPendingOrder as RequestHandler;

// Routes cho subscription orders
router.post("/pending", createSubscriptionPendingOrder);
router.get("/status/:subscription_code", getSubscriptionOrderStatus);
router.post("/update-status/:subscription_code", updateSubscriptionOrderStatus);
router.delete("/delete-pending/:subscription_code", deleteSubscriptionPendingOrder);

export default router;
