// routes/calendarRoutes.ts
import express from 'express';
import { getCalendarBookings, getCalendarData } from '../controllers/calendarController';
import { authenticate } from '../middleware/authMiddleware'; // Optional, if authentication is required

const router = express.Router();

// Route to get all bookings for the calendar
router.get('/', getCalendarBookings); 
router.get("/bookings", getCalendarData);

export default router;