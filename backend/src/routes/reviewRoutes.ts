import { Router } from 'express';
import { getFieldReviews, addFieldReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Các route này sẽ được truy cập qua /api/reviews/fields/:field_id
router.get('/fields/:field_id', getFieldReviews);
router.post('/fields/:field_id', authenticate, addFieldReview);

// Các route này được sử dụng để lấy đánh giá tổng quan hoặc các thao tác khác
router.get('/fields', getFieldReviews);
router.post('/fields', authenticate, addFieldReview);

export default router;