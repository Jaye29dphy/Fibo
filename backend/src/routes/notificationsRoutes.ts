import { Router, RequestHandler } from 'express';
import { getNotification, sendNotificationToAllUsers } from '../controllers/notificationsController';

const router = Router();

const getNotificationHandler: RequestHandler = getNotification;
const sendNotificationHandler: RequestHandler = sendNotificationToAllUsers;

router.get('/notifications', getNotificationHandler);
router.post('/send-all', sendNotificationHandler);

export default router;