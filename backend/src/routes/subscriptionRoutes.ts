import { Router, RequestHandler } from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
import { authenticate, isAdmin } from "../middleware/authMiddleware";

const router = Router();

// Type casting to make TypeScript happy with our route handlers
const getAllSubscriptionPlans = SubscriptionController.getAllSubscriptionPlans as RequestHandler;
const getSubscriptionHistory = SubscriptionController.getSubscriptionHistory as RequestHandler;
const getAllOwnerSubscriptions = SubscriptionController.getAllOwnerSubscriptions as RequestHandler;

// Public routes
router.get("/plans", getAllSubscriptionPlans);

// Owner routes (requires authentication)
router.get("/history", authenticate, getSubscriptionHistory);

// Admin routes (requires admin authentication)
router.get("/all", authenticate, isAdmin, getAllOwnerSubscriptions);

export default router;
