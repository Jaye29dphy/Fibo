// routes/calendarRoutes.ts
import express from 'express';
import { getCalendarBookings } from '../controllers/calendarController';
import { authenticate } from '../middleware/authMiddleware'; // Optional, if authentication is required

const router = express.Router();

// Route to get all bookings for the calendar
router.get('/', getCalendarBookings); 

export default router;