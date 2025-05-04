import { Router, RequestHandler } from 'express';
import { getNotification, sendNotificationToAllUsers, markNotificationAsRead } from '../controllers/notificationsController';

const router = Router();

const getNotificationHandler: RequestHandler = getNotification;
const sendNotificationHandler: RequestHandler = sendNotificationToAllUsers;
const markNotificationAsReadHandler: RequestHandler = markNotificationAsRead;

router.get('/notifications', getNotificationHandler);
router.post('/send-all', sendNotificationHandler);
router.put('/notifications/:notification_id/read', markNotificationAsReadHandler);

export default router;