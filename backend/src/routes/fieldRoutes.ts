import { Router, RequestHandler } from 'express';
import {
    registerField,
    getOwnerFields,
    getTimeSlots,
    getAllFields,
    getFieldById,
    updateField,
    uploadFieldImage,
    setMainFieldImage,
    reorderFieldImages,
    deleteFieldImage,
    deleteAllFieldImages,
    addFieldSubField,
    updateFieldSubField,
    deleteFieldSubField,
    addFieldService,
    updateFieldService,
    deleteFieldService,
    addFieldTimeSlot,
    deleteFieldTimeSlot
} from '../controllers/fieldController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// Route để lấy danh sách khung giờ
router.get('/time-slots', getTimeSlots);

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

// Route để tải lên ảnh cho sân
router.post('/:id/images', upload.single('image'), uploadFieldImage);

// Route để đặt ảnh chính cho sân
router.put('/:id/images/:imageId/main', authenticate, setMainFieldImage);

// Route để thay đổi thứ tự ảnh
router.put('/:id/images/reorder', authenticate, reorderFieldImages);

// Route để xóa ảnh
router.delete('/:id/images/:imageId', authenticate, deleteFieldImage);

// Route để xóa tất cả ảnh của một field
router.delete('/:id/images', authenticate, deleteAllFieldImages);

// Field-based subfield management routes
router.post('/:fieldId/subfields', authenticate, addFieldSubField);
router.put('/:fieldId/subfields/:subFieldId', authenticate, updateFieldSubField);
router.delete('/:fieldId/subfields/:subFieldId', authenticate, deleteFieldSubField);

// Field-based service management routes
router.post('/:fieldId/services', authenticate, addFieldService);
router.put('/:fieldId/services/:serviceId', authenticate, updateFieldService);
router.delete('/:fieldId/services/:serviceId', authenticate, deleteFieldService);

// Field-based time slot management routes
router.post('/:fieldId/time-slots', authenticate, addFieldTimeSlot);
router.delete('/:fieldId/time-slots/:slotId', authenticate, deleteFieldTimeSlot);

export default router;