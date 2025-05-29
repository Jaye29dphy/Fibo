import { Router, RequestHandler } from 'express';
import { getNotification, sendNotificationToUsers, markNotificationAsRead } from '../controllers/notificationsController';
const router = Router();

const getNotificationHandler: RequestHandler = getNotification;
const sendNotificationHandler: RequestHandler = sendNotificationToUsers;
const markNotificationAsReadHandler: RequestHandler = markNotificationAsRead;

router.get('/notifications', getNotificationHandler);
router.post('/send', sendNotificationHandler);
router.put('/notifications/:notification_id/read', markNotificationAsReadHandler);

export default router;