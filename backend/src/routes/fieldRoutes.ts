import { Router } from 'express';
import { registerField, getOwnerFields } from '../controllers/fieldController';
import multer from 'multer';

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Route để đăng ký sân
router.post('/register', upload.array('images'), registerField);

// Route để lấy danh sách sân của chủ sân
router.get('/owner', getOwnerFields);

export default router;