import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';

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

// Hàm trích xuất user_id từ token
const getUserIdFromToken = (req: Request): number | null => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found');
      return null;
    }

    const token = authHeader.split(' ')[1];
    console.log('Found token:', token.substring(0, 15) + '...');

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('Token decoded successfully:', decoded);

    return decoded.id;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

// Endpoint để lấy danh sách khung giờ
export const getTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `SELECT slot_id, start_time, end_time FROM fibo.timeslots ORDER BY 
      CASE 
        WHEN start_time >= '05:00:00' THEN start_time 
        ELSE CONCAT('24', start_time) 
      END`;
    const [slots] = await pool.execute(query);

    res.status(200).json(slots);
  } catch (error: any) {
    console.error('Error fetching time slots:', error.message);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi lấy danh sách khung giờ.' });
  }
};

export const registerField = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== REGISTER FIELD API CALLED ===');
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);

    // Log headers để debug
    console.log('Request headers:', {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Present (masked)' : 'Missing'
    });

    const { name, location, type, description, price, subFieldCount, services, timeSlots } = req.body;
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

    // Kiểm tra số lượng sân con
    const parsedSubFieldCount = parseInt(subFieldCount) || 1; // Mặc định là 1 nếu không có giá trị
    if (isNaN(parsedSubFieldCount) || parsedSubFieldCount < 1 || parsedSubFieldCount > 99) {
      console.log('Invalid subFieldCount:', subFieldCount);
      res.status(400).json({ message: 'Invalid sub field count. Must be between 1 and 99.' });
      return;
    }
    console.log('Sub field count:', parsedSubFieldCount);

    // Parse services nếu là chuỗi JSON
    let serviceArray: Array<{ name: string, price: string, description: string }> = [];
    if (services) {
      try {
        if (typeof services === 'string') {
          serviceArray = JSON.parse(services);
        } else {
          serviceArray = services;
        }
        console.log('Parsed services:', serviceArray);
      } catch (e) {
        console.error('Error parsing services:', e);
      }
    }

    // Parse timeSlots nếu là chuỗi JSON
    let timeSlotArray: Array<{ slot_id: number, start_time: string, end_time: string, price: string }> = [];
    if (timeSlots) {
      try {
        if (typeof timeSlots === 'string') {
          timeSlotArray = JSON.parse(timeSlots);
        } else {
          timeSlotArray = timeSlots;
        }
        console.log('Parsed time slots:', timeSlotArray);
      } catch (e) {
        console.error('Error parsing time slots:', e);
      }
    }

    // Kiểm tra sport_type hợp lệ
    const validSportTypes = ['football', 'badminton', 'tennis', 'basketball', 'pickleball'];
    if (!validSportTypes.includes(type)) {
      console.log('Invalid sport type:', type);
      res.status(400).json({ message: `Invalid sport type. Must be one of: ${validSportTypes.join(', ')}` });
      return;
    }

    // Lấy owner_id từ token JWT
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized or invalid token' });
      return;
    }
    console.log('Authenticated user ID:', userId);

    // Kiểm tra xem user có phải owner không
    const [ownerCheck] = await pool.execute('SELECT owner_id FROM fibo.owners WHERE user_id = ?', [userId]);
    let ownerId: number;

    if (!Array.isArray(ownerCheck) || ownerCheck.length === 0) {
      console.log('User is not an owner, creating owner record');

      // Thêm mới vào bảng owners nếu chưa tồn tại
      const [insertResult]: any = await pool.execute('INSERT INTO fibo.owners (user_id) VALUES (?)', [userId]);
      ownerId = insertResult.insertId;
      console.log('Created new owner with ID:', ownerId);
    } else {
      // Cast the result to access owner_id property
      ownerId = (ownerCheck[0] as any).owner_id;
      console.log('Found existing owner with ID:', ownerId);
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

    // Tạo các sân con trong bảng subfields
    console.log(`Creating ${parsedSubFieldCount} sub-fields for field ID ${fieldId}`);
    for (let i = 1; i <= parsedSubFieldCount; i++) {
      const subFieldName = `Sân ${i}`;
      const insertSubFieldQuery = `
        INSERT INTO fibo.subfields (field_id, name)
        VALUES (?, ?)
      `;
      await pool.execute(insertSubFieldQuery, [fieldId, subFieldName]);
      console.log(`Created sub-field "${subFieldName}" for field ID ${fieldId}`);
    }

    // Thêm các dịch vụ thêm vào bảng services
    if (serviceArray && serviceArray.length > 0) {
      console.log(`Adding ${serviceArray.length} services for field ID ${fieldId}`);

      for (const service of serviceArray) {
        // Bỏ qua dịch vụ không có tên
        if (!service.name) continue;

        // Parse giá dịch vụ
        const servicePrice = parseFloat(service.price) || 0;

        const insertServiceQuery = `
          INSERT INTO fibo.services (field_id, name, price, description, status)
          VALUES (?, ?, ?, ?, ?)
        `;

        await pool.execute(insertServiceQuery, [
          fieldId,
          service.name,
          servicePrice,
          service.description || '',
          'available'  // Sửa từ 'active' thành 'available'
        ]);

        console.log(`Added service "${service.name}" for field ID ${fieldId}`);
      }
    }

    // Thêm giá theo khung giờ vào bảng field_prices
    if (timeSlotArray && timeSlotArray.length > 0) {
      console.log(`Adding ${timeSlotArray.length} time slot prices for field ID ${fieldId}`);

      for (const slot of timeSlotArray) {
        // Bỏ qua slot không có giá hoặc không được chọn
        if (!slot.price) continue;

        // Parse giá slot
        const slotPrice = parseFloat(slot.price) || parsedPrice; // Mặc định sử dụng giá của sân nếu không có giá riêng

        const insertSlotPriceQuery = `
          INSERT INTO fibo.field_prices (field_id, slot_id, price)
          VALUES (?, ?, ?)
        `;

        await pool.execute(insertSlotPriceQuery, [
          fieldId,
          slot.slot_id,
          slotPrice
        ]);

        console.log(`Added price ${slotPrice} for slot ID ${slot.slot_id} of field ID ${fieldId}`);
      }
    }

    // Lưu ảnh vào thư mục và bảng field_images
    if (!images || images.length === 0) {
      console.log('No images provided, skipping image upload');
    } else {
      console.log('Processing images:', images.length);
      for (const [index, image] of images.entries()) {
        console.log(`Processing image ${index}:`, {
          fieldname: image.fieldname,
          originalname: image.originalname,
          mimetype: image.mimetype,
          size: image.size,
          bufferExists: !!image.buffer
        });

        if (!image.buffer) {
          console.log('Image buffer is missing for image:', index);
          continue; // Skip this image instead of failing the whole request
        }

        // Lấy extension từ tên file gốc hoặc từ mimetype
        let fileExtension = path.extname(image.originalname || '');
        if (!fileExtension && image.mimetype) {
          const mimeExt = image.mimetype.split('/')[1];
          fileExtension = mimeExt ? `.${mimeExt}` : '.jpg';
        }
        if (!fileExtension) fileExtension = '.jpg';

        const imageName = `${fieldId}_${index}${fileExtension}`;
        const imagePath = path.join(UPLOAD_DIR, imageName);

        try {
          console.log('Saving image:', imageName, 'to:', imagePath);
          // Lưu file ảnh vào thư mục
          await writeFileAsync(imagePath, image.buffer);

          // Kiểm tra xem file đã được lưu thành công chưa
          if (!fs.existsSync(imagePath)) {
            console.log('Failed to save image:', imagePath);
            continue; // Skip to next image
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
        } catch (imgError) {
          console.error(`Error processing image ${index}:`, imgError);
          // Continue with next image
        }
      }
    }

    res.status(200).json({
      message: 'Đăng ký sân thành công!',
      fieldId,
      subFields: parsedSubFieldCount,
      services: serviceArray.length,
      timeSlotPrices: timeSlotArray.length
    });
  } catch (error: any) {
    console.error('Error in registerField:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra.', error: error.message });
  }
};

export const getOwnerFields = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== GET OWNER FIELDS API CALLED ===');

    // Lấy user_id từ token JWT
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized or invalid token' });
      return;
    }
    console.log('Authenticated user ID:', userId);

    // Lấy owner_id từ user_id
    const [ownerResults] = await pool.execute('SELECT owner_id FROM fibo.owners WHERE user_id = ?', [userId]);

    if (!Array.isArray(ownerResults) || ownerResults.length === 0) {
      console.log('User is not an owner');
      res.status(404).json({ message: 'User is not an owner' });
      return;
    }

    const ownerId = (ownerResults[0] as any).owner_id;
    console.log('Found owner with ID:', ownerId);

    // Truy vấn lấy danh sách sân của chủ sân
    const query = `
      SELECT 
        f.field_id,
        f.name,
        f.location,
        f.sport_type,
        f.price_per_hour,
        f.status,
        f.description,
        CONCAT(fi.image_name) AS image_name
      FROM 
        fibo.fields f
      LEFT JOIN 
        (SELECT field_id, image_name FROM fibo.field_images WHERE image_type = 'main') fi 
        ON f.field_id = fi.field_id
      WHERE 
        f.owner_id = ?
      ORDER BY 
        f.name ASC
    `;

    const [fields] = await pool.execute(query, [ownerId]);

    if (!Array.isArray(fields) || fields.length === 0) {
      console.log('No fields found for owner:', ownerId);
      res.status(200).json({ fields: [] });
      return;
    }

    console.log(`Found ${fields.length} fields for owner:`, ownerId);
    res.status(200).json({ fields });

  } catch (error: any) {
    console.error('Error in getOwnerFields:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra.', error: error.message });
  }
};

export const getAllFields = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== GET ALL FIELDS API CALLED ===');

    // Truy vấn lấy danh sách tất cả các sân với rating
    const query = `
      SELECT 
        f.field_id,
        f.name,
        f.location,
        f.sport_type,
        f.price_per_hour,
        f.status,
        f.description,
        f.rating,
        CONCAT(fi.image_name) AS image_name
      FROM 
        fibo.fields f
      LEFT JOIN 
        (SELECT field_id, image_name FROM fibo.field_images WHERE image_type = 'main') fi 
        ON f.field_id = fi.field_id
      WHERE 
        f.status = 'available'
      ORDER BY 
        f.rating DESC, f.name ASC
    `;

    const [fields] = await pool.execute(query);

    if (!Array.isArray(fields) || fields.length === 0) {
      console.log('No fields found');
      res.status(200).json({ fields: [] });
      return;
    }

    console.log(`Found ${fields.length} fields`);
    res.status(200).json({ fields });

  } catch (error: any) {
    console.error('Error in getAllFields:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra.', error: error.message });
  }
};

export const getFieldById = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = parseInt(req.params.id);

    if (isNaN(fieldId)) {
      res.status(400).json({ message: 'Invalid field ID' });
      return;
    }

    // Truy vấn để lấy thông tin chi tiết của sân
    const query = `
      SELECT 
        f.field_id,
        f.name,
        f.location,
        f.sport_type,
        f.price_per_hour,
        f.status,
        f.description,
        f.rating
      FROM 
        fibo.fields f
      WHERE 
        f.field_id = ?
    `;

    const [result] = await pool.execute(query, [fieldId]);
    const fields = result as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Field not found' });
      return;
    }

    const field = fields[0];

    // Lấy danh sách ảnh của sân
    const imageQuery = `
      SELECT image_name, image_type 
      FROM fibo.field_images 
      WHERE field_id = ?
    `;

    const [imageResult] = await pool.execute(imageQuery, [fieldId]);
    const images = imageResult as any[];

    // Kết hợp thông tin và trả về
    res.status(200).json({
      ...field,
      images
    });

  } catch (error: any) {
    console.error('Error in getFieldById:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra.', error: error.message });
  }
};