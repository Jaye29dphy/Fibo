import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify fs.writeFile để sử dụng async/await
const writeFileAsync = promisify(fs.writeFile);

// Đường dẫn thư mục lưu ảnh
const UPLOAD_DIR = 'D:\\img\\field';

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  console.log('Creating upload directory:', UPLOAD_DIR);
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

export const registerField = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);

    const { name, location, type, description, price } = req.body;
    const images = req.files as Express.Multer.File[] | undefined;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !location || !type || !description || !price) {
      console.log('Missing required fields:', { name, location, type, description, price });
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Kiểm tra giá trị của price
    const parsedPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(parsedPrice)) {
      console.log('Invalid price format:', price);
      res.status(400).json({ message: 'Invalid price format' });
      return;
    }

    // Kiểm tra sport_type hợp lệ
    const validSportTypes = ['football', 'badminton', 'tennis', 'basketball', 'pickleball'];
    if (!validSportTypes.includes(type)) {
      console.log('Invalid sport type:', type);
      res.status(400).json({ message: `Invalid sport type. Must be one of: ${validSportTypes.join(', ')}` });
      return;
    }

    // Giả định owner_id (có thể lấy từ session hoặc token của chủ sân)
    const ownerId = 1; // Thay bằng logic xác thực thực tế
    console.log('Using owner_id:', ownerId);

    // Kiểm tra owner_id có tồn tại trong bảng owners không
    const [ownerCheck] = await pool.execute('SELECT owner_id FROM fibo.owners WHERE owner_id = ?', [ownerId]);
    if (!Array.isArray(ownerCheck) || ownerCheck.length === 0) {
      console.log('Owner ID does not exist:', ownerId);
      res.status(400).json({ message: 'Owner ID does not exist' });
      return;
    }

    // Lưu dữ liệu sân vào bảng fields
    const insertFieldQuery = `
      INSERT INTO fibo.fields (owner_id, location, name, sport_type, price_per_hour, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const fieldValues = [
      ownerId,
      location,
      name,
      type,
      parsedPrice,
      description,
      'available',
    ];
    console.log('Inserting field with values:', fieldValues);

    const [fieldResult] = await pool.execute(insertFieldQuery, fieldValues);
    const fieldId = (fieldResult as any).insertId; // Lấy field_id vừa tạo
    console.log('Inserted field with field_id:', fieldId);

    // Lưu ảnh vào thư mục và bảng field_images
    if (!images || images.length === 0) {
      console.log('No images provided, skipping image upload');
    } else {
      console.log('Processing images:', images.length);
      for (const [index, image] of images.entries()) {
        if (!image.buffer) {
          console.log('Image buffer is missing for image:', index);
          throw new Error('Image buffer is missing');
        }

        const fileExtension = path.extname(image.originalname || '.jpg');
        const imageName = `${fieldId}_${index}${fileExtension}`;
        const imagePath = path.join(UPLOAD_DIR, imageName);

        console.log('Saving image:', imageName, 'to:', imagePath);
        // Lưu file ảnh vào thư mục
        await writeFileAsync(imagePath, image.buffer);

        // Kiểm tra xem file đã được lưu thành công chưa
        if (!fs.existsSync(imagePath)) {
          console.log('Failed to save image:', imagePath);
          throw new Error('Failed to save image to disk');
        }
        console.log('Image saved successfully:', imagePath);

        // Xác định image_type (main cho ảnh đầu tiên, sub cho các ảnh còn lại)
        const imageType = index === 0 ? 'main' : 'sub';

        // Lưu thông tin ảnh vào bảng field_images
        const insertImageQuery = `
          INSERT INTO fibo.field_images (field_id, image_name, image_type, upload_date)
          VALUES (?, ?, ?, ?)
        `;
        const imageValues = [
          fieldId,
          imageName,
          imageType,
          new Date().toISOString().slice(0, 19).replace('T', ' '),
        ];
        console.log('Inserting image with values:', imageValues);
        await pool.execute(insertImageQuery, imageValues);
      }
    }

    res.status(200).json({ message: 'Đăng ký sân thành công!' });
  } catch (error: any) {
    console.error('Error in registerField:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra.', error: error.message });
  }
};