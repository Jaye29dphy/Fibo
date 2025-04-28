import { getNotification } from '../controllers/notificationsController';
import express from "express";

const router = express.Router();
router.get('/notifications', getNotification);
export default router;