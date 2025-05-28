import { Router, RequestHandler } from 'express';
import {
    registerField,
    getOwnerFields,
    getTimeSlots,
    getAllFields,
    getFieldById,
    updateField
} from '../controllers/fieldController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Route để lấy danh sách khung giờ
router.get('/timeslots', getTimeSlots);

// Route để đăng ký sân
router.post('/register', upload.array('images'), registerField);

// Route để lấy danh sách sân của chủ sân
router.get('/owner', getOwnerFields);

// Route để lấy tất cả các sân
router.get('/all', getAllFields);

// Route để lấy thông tin chi tiết của một sân
router.get('/:id', getFieldById);

// Route để cập nhật thông tin sân
router.put('/:id', updateField);

export default router;