import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const writeFileAsync = promisify(fs.writeFile);

// Đảm bảo basePath luôn là string
const basePath = process.env.FIELD_IMAGE_PATH;

if (!basePath) {
  console.error('❌ FIELD_IMAGE_PATH is not defined in .env');
  process.exit(1); // hoặc throw new Error()
}

// Tại thời điểm này TypeScript biết basePath chắc chắn là string
if (!fs.existsSync(basePath)) {
  console.log('📁 Creating upload directory:', basePath);
  try {
    fs.mkdirSync(basePath, { recursive: true });
  } catch (error) {
    console.error('❌ Failed to create upload directory:', error);
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
    console.log('Received files count:', Array.isArray(req.files) ? req.files.length : 'Not an array');
    console.log('Files details:', req.files);

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
    }    // Lưu ảnh vào thư mục và bảng field_images
    if (!images || images.length === 0) {
      console.log('No images provided, skipping image upload');
      console.log('req.files type:', typeof req.files);
      console.log('req.files:', req.files);
    } else {
      console.log('Processing images:', images.length);
      console.log('Images array details:', images.map((img, idx) => ({
        index: idx,
        fieldname: img.fieldname,
        originalname: img.originalname,
        mimetype: img.mimetype,
        size: img.size,
        hasBuffer: !!img.buffer,
        bufferLength: img.buffer?.length
      })));
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
        if (!fileExtension) fileExtension = '.jpg'; const imageName = `${fieldId}_${index}${fileExtension}`;
        const imagePath = path.join(basePath, imageName);

        console.log('=== IMAGE PROCESSING DETAILS ===');
        console.log('Field ID:', fieldId);
        console.log('Image index:', index);
        console.log('File extension:', fileExtension);
        console.log('Image name:', imageName);
        console.log('Full image path:', imagePath);
        console.log('Base path exists:', fs.existsSync(basePath));
        console.log('Buffer size:', image.buffer?.length);

        try {
          console.log('Saving image:', imageName, 'to:', imagePath);
          console.log('basePath from env:', basePath);
          console.log('Directory exists before save:', fs.existsSync(basePath));

          // Đảm bảo thư mục tồn tại trước khi lưu file
          if (!fs.existsSync(basePath)) {
            console.log('Creating directory:', basePath);
            fs.mkdirSync(basePath, { recursive: true });
          }

          // Lưu file ảnh vào thư mục
          await writeFileAsync(imagePath, image.buffer);
          console.log('File write completed');

          // Kiểm tra xem file đã được lưu thành công chưa
          if (!fs.existsSync(imagePath)) {
            console.error('Failed to save image - file does not exist after write:', imagePath);
            continue; // Skip to next image
          }

          const stats = fs.statSync(imagePath);
          console.log('Image saved successfully:', imagePath, 'Size:', stats.size, 'bytes');          // Xác định image_type (main cho ảnh đầu tiên, sub cho các ảnh còn lại)
          const imageType = index === 0 ? 'main' : 'sub';

          // Lưu thông tin ảnh vào bảng field_images
          const insertImageQuery = `
            INSERT INTO fibo.field_images (field_id, image_name, image_type, upload_date)
            VALUES (?, ?, ?, ?)
          `;

          // Tạo timestamp với múi giờ UTC+7 (Việt Nam)
          const vietnamTime = new Date();
          vietnamTime.setHours(vietnamTime.getHours() + 7); // Chuyển sang UTC+7
          const uploadDate = vietnamTime.toISOString().slice(0, 19).replace('T', ' ');

          const imageValues = [
            fieldId,
            imageName,
            imageType,
            uploadDate,
          ];
          console.log('Inserting image with Vietnam time values:', imageValues);
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

// Cập nhật thông tin sân
export const updateField = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;
    const { name, location, sport_type, price_per_hour, status, description } = req.body;    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    } console.log('Updating field:', { fieldId, userId, name, location, sport_type, price_per_hour, status, description });

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[]; if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền cập nhật sân này' });
      return;
    }    // Validate input
    if (!name || !location || !sport_type || !price_per_hour) {
      res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: tên sân, địa chỉ, loại thể thao, giá thuê' });
      return;
    } if (isNaN(Number(price_per_hour)) || Number(price_per_hour) <= 0) {
      res.status(400).json({ message: 'Giá thuê phải là số và lớn hơn 0' });
      return;
    }    // Cập nhật thông tin sân
    const updateQuery = `
      UPDATE fibo.fields 
      SET name = ?, location = ?, sport_type = ?, price_per_hour = ?, status = ?, description = ?
      WHERE field_id = ?
    `;

    const [updateResult] = await pool.execute(updateQuery, [
      name.trim(),
      location.trim(),
      sport_type,
      Number(price_per_hour),
      status || 'active',
      description?.trim() || '',
      fieldId
    ]);

    const result = updateResult as any; if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Không thể cập nhật sân' });
      return;
    }    // Lấy thông tin sân đã cập nhật
    const getUpdatedQuery = `
      SELECT field_id, name, location, sport_type, price_per_hour, status, description, rating, created_at
      FROM fibo.fields 
      WHERE field_id = ?
    `;

    const [updatedResult] = await pool.execute(getUpdatedQuery, [fieldId]);
    const updatedField = (updatedResult as any[])[0];

    console.log('Field updated successfully:', updatedField);

    res.status(200).json({
      message: 'Cập nhật thông tin sân thành công',
      field: updatedField
    });

  } catch (error: any) {
    console.error('Error in updateField:', error.message, error.stack);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi cập nhật sân.', error: error.message });
  }
};

// Upload field image
export const uploadFieldImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;

    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền cập nhật sân này' });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'Vui lòng chọn một ảnh' });
      return;
    }

    console.log('Processing field image upload:', {
      fieldId,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Get all existing images for this field to determine the next index
    const [existingImages] = await pool.execute(
      'SELECT image_id, image_name FROM fibo.field_images WHERE field_id = ? ORDER BY upload_date ASC',
      [fieldId]
    );
    const currentImages = existingImages as any[];
    console.log('Current images for field:', currentImages);

    // Calculate the next index based on existing images
    let nextIndex = 0;
    const existingIndexes: number[] = [];

    // Extract indexes from existing image names that follow our naming pattern
    for (const image of currentImages) {
      const match = image.image_name.match(new RegExp(`^${fieldId}_(\\d+)\\.[^.]+$`));
      if (match) {
        existingIndexes.push(parseInt(match[1]));
      }
    }

    // Find the next available index
    if (existingIndexes.length > 0) {
      existingIndexes.sort((a, b) => a - b);
      for (let i = 0; i <= existingIndexes.length; i++) {
        if (!existingIndexes.includes(i)) {
          nextIndex = i;
          break;
        }
      }
    }

    console.log('Next available index:', nextIndex);

    // Get file extension from original filename
    let fileExtension = path.extname(req.file.originalname || '');
    if (!fileExtension && req.file.mimetype) {
      const mimeExt = req.file.mimetype.split('/')[1];
      fileExtension = mimeExt ? `.${mimeExt}` : '.jpg';
    }
    if (!fileExtension) fileExtension = '.jpg';

    // Use proper naming format: {fieldId}_{index}.{extension}
    const filename = `${fieldId}_${nextIndex}${fileExtension}`;

    // Ensure the directory exists
    if (!basePath) {
      throw new Error('FIELD_IMAGE_PATH is not defined');
    }

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    // Write the file to disk
    const filePath = path.join(basePath, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    console.log('New image saved:', {
      filename,
      path: filePath,
      size: req.file.size,
      index: nextIndex
    });

    // Determine image type: 'main' if it's the first image (index 0), otherwise 'sub'
    const imageType = nextIndex === 0 ? 'main' : 'sub';

    // Get current Vietnam time
    const vietnamTime = new Date();
    vietnamTime.setHours(vietnamTime.getHours() + 7); // UTC+7
    const uploadDate = vietnamTime.toISOString().slice(0, 19).replace('T', ' ');

    // Save image metadata to database
    const [insertResult] = await pool.execute(
      'INSERT INTO fibo.field_images (field_id, image_name, image_type, upload_date) VALUES (?, ?, ?, ?)',
      [fieldId, filename, imageType, uploadDate]
    );

    const imageId = (insertResult as any).insertId;

    console.log('Image uploaded successfully:', {
      fieldId,
      imageId,
      filename,
      imageType,
      index: nextIndex
    });

    res.status(201).json({
      message: 'Đã tải ảnh lên thành công',
      image_id: imageId,
      image_name: filename,
      image_type: imageType,
      upload_date: uploadDate
    });
  } catch (error: any) {
    console.error('Error uploading field image:', error.message, error.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tải ảnh lên', error: error.message });
  }
};

// Set a specific image as main image
export const setMainFieldImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;
    const imageId = req.params.imageId;

    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền cập nhật sân này' });
      return;
    }

    // Kiểm tra xem ảnh có tồn tại không
    const [imageCheck] = await pool.execute(
      'SELECT * FROM fibo.field_images WHERE image_id = ? AND field_id = ?',
      [imageId, fieldId]
    );

    if ((imageCheck as any[]).length === 0) {
      res.status(404).json({ message: 'Không tìm thấy ảnh này' });
      return;
    }

    // Bắt đầu transaction để đảm bảo tính nhất quán của dữ liệu
    await pool.execute('START TRANSACTION');    // Đặt tất cả các ảnh khác thành 'sub'
    await pool.execute(
      'UPDATE fibo.field_images SET image_type = ? WHERE field_id = ?',
      ['sub', fieldId]
    );

    // Đặt ảnh được chọn thành 'main'
    await pool.execute(
      'UPDATE fibo.field_images SET image_type = ? WHERE image_id = ?',
      ['main', imageId]
    );

    // Hoàn thành transaction
    await pool.execute('COMMIT');

    console.log(`Image ${imageId} set as main for field ${fieldId}`);

    res.status(200).json({
      message: 'Đã đặt ảnh chính thành công',
      image_id: parseInt(imageId),
      field_id: parseInt(fieldId)
    });
  } catch (error: any) {
    // Nếu có lỗi, rollback transaction
    await pool.execute('ROLLBACK');
    console.error('Error setting main field image:', error.message, error.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đặt ảnh chính', error: error.message });
  }
};

// Reorder field images
export const reorderFieldImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;
    const { imageIds } = req.body;

    // Validate input
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      res.status(400).json({ message: 'Danh sách ID ảnh không hợp lệ' });
      return;
    }

    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền cập nhật sân này' });
      return;
    }

    // Kiểm tra xem tất cả các ảnh có tồn tại và thuộc về sân này không
    const [imagesCheck] = await pool.execute(
      'SELECT image_id FROM fibo.field_images WHERE field_id = ?',
      [fieldId]
    );

    const existingImageIds = (imagesCheck as any[]).map(img => img.image_id);
    const validImageIds = imageIds.filter(id => existingImageIds.includes(id));

    if (validImageIds.length !== imageIds.length) {
      res.status(400).json({ message: 'Một số ảnh trong danh sách không tồn tại hoặc không thuộc về sân này' });
      return;
    }    // Cập nhật loại ảnh (main cho ảnh đầu tiên, additional cho các ảnh khác)
    await pool.execute('START TRANSACTION');    // Đặt tất cả các ảnh thành sub trước
    await pool.execute(
      'UPDATE fibo.field_images SET image_type = ? WHERE field_id = ?',
      ['sub', fieldId]
    );

    // Đặt ảnh đầu tiên trong danh sách thành main
    if (imageIds.length > 0) {
      await pool.execute(
        'UPDATE fibo.field_images SET image_type = ? WHERE image_id = ?',
        ['main', imageIds[0]]
      );
    }

    await pool.execute('COMMIT');

    console.log(`Images reordered for field ${fieldId}:`, imageIds);

    res.status(200).json({
      message: 'Đã sắp xếp lại ảnh thành công',
      field_id: parseInt(fieldId),
      image_ids: imageIds
    });
  } catch (error: any) {
    // Nếu có lỗi, rollback transaction
    await pool.execute('ROLLBACK');
    console.error('Error reordering field images:', error.message, error.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi sắp xếp lại ảnh', error: error.message });
  }
};

// Delete a field image
export const deleteFieldImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;
    const imageId = req.params.imageId;

    console.log(`Deleting image: Field ID ${fieldId}, Image ID ${imageId}`);

    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền xóa ảnh này' });
      return;
    }

    // Kiểm tra xem ảnh có tồn tại không
    const [imageCheck] = await pool.execute(
      'SELECT * FROM fibo.field_images WHERE image_id = ? AND field_id = ?',
      [imageId, fieldId]
    );

    const images = imageCheck as any[];
    if (images.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy ảnh này' });
      return;
    }

    const image = images[0];

    // Nếu đây là ảnh chính và có ảnh khác, chọn một ảnh khác làm ảnh chính
    if (image.image_type === 'main') {
      const [otherImagesResult] = await pool.execute(
        'SELECT * FROM fibo.field_images WHERE field_id = ? AND image_id != ? LIMIT 1',
        [fieldId, imageId]
      );

      const otherImages = otherImagesResult as any[];

      if (otherImages && otherImages.length > 0) {
        await pool.execute(
          'UPDATE fibo.field_images SET image_type = ? WHERE image_id = ?',
          ['main', otherImages[0].image_id]
        );
      }
    }

    // Xóa file ảnh nếu có path
    if (basePath) {
      const imagePath = path.join(basePath, image.image_name);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`File ${imagePath} deleted from disk`);
      }
    }

    // Xóa dữ liệu ảnh từ database
    const [deleteResult] = await pool.execute(
      'DELETE FROM fibo.field_images WHERE image_id = ?',
      [imageId]
    );

    console.log(`Image ${imageId} deleted successfully`);

    res.status(200).json({
      message: 'Đã xóa ảnh thành công',
      image_id: parseInt(imageId),
      field_id: parseInt(fieldId)
    });
  } catch (error: any) {
    console.error('Error deleting field image:', error.message, error.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa ảnh', error: error.message });
  }
};

// Delete all images for a field
export const deleteAllFieldImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const fieldId = req.params.id;

    console.log(`Deleting all images for Field ID ${fieldId}`);

    // Lấy user_id từ token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Kiểm tra xem sân có tồn tại và thuộc về user này không
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền xóa ảnh' });
      return;
    }

    // Lấy tất cả ảnh của field này
    const [imagesResult] = await pool.execute(
      'SELECT * FROM fibo.field_images WHERE field_id = ?',
      [fieldId]
    );

    const images = imagesResult as any[];
    const deletedImages = [];

    // Xóa từng file ảnh và record trong database
    for (const image of images) {
      // Xóa file ảnh từ thư mục lưu trữ
      if (basePath) {
        const imagePath = path.join(basePath, image.image_name);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`File ${imagePath} deleted from disk`);
        } else {
          console.log(`Warning: File ${imagePath} not found on disk`);
        }
      }

      deletedImages.push({
        image_id: image.image_id,
        image_name: image.image_name
      });
    }

    // Xóa tất cả records từ database
    const [deleteResult] = await pool.execute(
      'DELETE FROM fibo.field_images WHERE field_id = ?',
      [fieldId]
    );

    const deletedCount = (deleteResult as any).affectedRows;
    console.log(`Deleted ${deletedCount} images for field ${fieldId}`);

    res.status(200).json({
      message: `Đã xóa ${deletedCount} ảnh của sân thành công`,
      field_id: parseInt(fieldId),
      deleted_images: deletedImages
    });
  } catch (error: any) {
    console.error('Error deleting all field images:', error.message, error.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa ảnh', error: error.message });
  }
};

// ======================= FIELD-BASED SUBFIELD MANAGEMENT =======================

// Add a new subfield to a field
export const addFieldSubField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const { name } = req.body;

    console.log('[addFieldSubField] Adding new subfield to field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Validate input
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Insert new subfield
    const [result] = await pool.execute(
      "INSERT INTO fibo.subfields (field_id, name, status) VALUES (?, ?, 'available')",
      [fieldId, name]
    );

    const insertId = (result as any).insertId;

    // Get the newly created subfield
    const [rows] = await pool.execute(
      "SELECT * FROM fibo.subfields WHERE sub_field_id = ?",
      [insertId]
    );

    console.log('[addFieldSubField] Subfield created with ID:', insertId);

    res.status(201).json((rows as any[])[0]);
  } catch (error: any) {
    console.error('[addFieldSubField] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a subfield's details
export const updateFieldSubField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, subFieldId } = req.params;
    const { name, status } = req.body;

    console.log('[updateFieldSubField] Updating subfield:', subFieldId, 'of field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (status !== undefined) {
      if (!['available', 'unavailable'].includes(status)) {
        res.status(400).json({ error: "Trạng thái không hợp lệ" });
        return;
      }
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
      return;
    }

    updateValues.push(subFieldId, fieldId);

    // Update subfield
    const [result]: any = await pool.execute(
      `UPDATE fibo.subfields SET ${updateFields.join(', ')} WHERE sub_field_id = ? AND field_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy sân con" });
      return;
    }

    console.log('[updateFieldSubField] Subfield updated successfully');

    // Get the updated subfield
    const [rows] = await pool.execute(
      "SELECT * FROM fibo.subfields WHERE sub_field_id = ?",
      [subFieldId]
    );

    res.status(200).json((rows as any[])[0]);
  } catch (error: any) {
    console.error('[updateFieldSubField] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a subfield
export const deleteFieldSubField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, subFieldId } = req.params;

    console.log('[deleteFieldSubField] Deleting subfield:', subFieldId, 'from field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Delete the subfield
    const [result]: any = await pool.execute(
      "DELETE FROM fibo.subfields WHERE sub_field_id = ? AND field_id = ?",
      [subFieldId, fieldId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy sân con" });
      return;
    }

    console.log('[deleteFieldSubField] Subfield deleted successfully');

    res.status(200).json({ message: "Đã xóa sân con thành công" });
  } catch (error: any) {
    console.error('[deleteFieldSubField] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ======================= FIELD-BASED SERVICE MANAGEMENT =======================

// Add a new service to a field
export const addFieldService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const { name, price, description } = req.body;

    console.log('[addFieldService] Adding new service to field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Validate input
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Parse service price
    const servicePrice = parseFloat(price?.toString() || '0') || 0;

    // Insert new service
    const [result] = await pool.execute(
      "INSERT INTO fibo.services (field_id, name, price, description, status) VALUES (?, ?, ?, ?, 'available')",
      [fieldId, name, servicePrice, description || '']
    );

    const insertId = (result as any).insertId;

    // Get the newly created service
    const [rows] = await pool.execute(
      "SELECT * FROM fibo.services WHERE service_id = ?",
      [insertId]
    );

    console.log('[addFieldService] Service created with ID:', insertId);

    res.status(201).json((rows as any[])[0]);
  } catch (error: any) {
    console.error('[addFieldService] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a service's details
export const updateFieldService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, serviceId } = req.params;
    const { name, price, description, status } = req.body;

    console.log('[updateFieldService] Updating service:', serviceId, 'of field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(parseFloat(price?.toString() || '0') || 0);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (status !== undefined) {
      if (!['available', 'unavailable'].includes(status)) {
        res.status(400).json({ error: "Trạng thái không hợp lệ" });
        return;
      }
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
      return;
    }

    updateValues.push(serviceId, fieldId);

    // Update service
    const [result]: any = await pool.execute(
      `UPDATE fibo.services SET ${updateFields.join(', ')} WHERE service_id = ? AND field_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy dịch vụ" });
      return;
    }

    console.log('[updateFieldService] Service updated successfully');

    // Get the updated service
    const [rows] = await pool.execute(
      "SELECT * FROM fibo.services WHERE service_id = ?",
      [serviceId]
    );

    res.status(200).json((rows as any[])[0]);
  } catch (error: any) {
    console.error('[updateFieldService] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a service
export const deleteFieldService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, serviceId } = req.params;

    console.log('[deleteFieldService] Deleting service:', serviceId, 'from field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Delete the service
    const [result]: any = await pool.execute(
      "DELETE FROM fibo.services WHERE service_id = ? AND field_id = ?",
      [serviceId, fieldId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy dịch vụ" });
      return;
    }

    console.log('[deleteFieldService] Service deleted successfully');

    res.status(200).json({ message: "Đã xóa dịch vụ thành công" });
  } catch (error: any) {
    console.error('[deleteFieldService] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ======================= FIELD-BASED TIME SLOT MANAGEMENT =======================

// Add a new time slot pricing for a field
export const addFieldTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const { slot_id, price } = req.body;

    console.log('[addFieldTimeSlot] Adding time slot pricing to field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Validate input
    if (!slot_id || price === undefined) {
      res.status(400).json({ error: "Slot ID and price are required" });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Parse slot price
    const slotPrice = parseFloat(price?.toString() || '0') || 0;

    // Insert new time slot pricing (or update if exists)
    const insertQuery = `
      INSERT INTO fibo.field_prices (field_id, slot_id, price)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE price = VALUES(price)
    `;

    await pool.execute(insertQuery, [fieldId, slot_id, slotPrice]);

    // Get the time slot with pricing info
    const [rows] = await pool.execute(
      `SELECT ts.slot_id, ts.start_time, ts.end_time, fp.price 
       FROM fibo.timeslots ts 
       JOIN fibo.field_prices fp ON ts.slot_id = fp.slot_id 
       WHERE fp.field_id = ? AND fp.slot_id = ?`,
      [fieldId, slot_id]
    );

    console.log('[addFieldTimeSlot] Time slot pricing added/updated for slot:', slot_id);

    res.status(201).json((rows as any[])[0]);
  } catch (error: any) {
    console.error('[addFieldTimeSlot] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete time slot pricing for a field
export const deleteFieldTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, slotId } = req.params;

    console.log('[deleteFieldTimeSlot] Deleting time slot pricing:', slotId, 'from field:', fieldId);

    // Get user_id from token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: 'Token không hợp lệ hoặc không tồn tại' });
      return;
    }

    // Check if field exists and belongs to this user
    const checkQuery = `
      SELECT f.field_id, f.owner_id, o.user_id 
      FROM fibo.fields f
      INNER JOIN fibo.owners o ON f.owner_id = o.owner_id
      WHERE f.field_id = ? AND o.user_id = ?
    `;

    const [checkResult] = await pool.execute(checkQuery, [fieldId, userId]);
    const fields = checkResult as any[];

    if (fields.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy sân hoặc bạn không có quyền chỉnh sửa' });
      return;
    }

    // Delete the time slot pricing
    const [result]: any = await pool.execute(
      "DELETE FROM fibo.field_prices WHERE field_id = ? AND slot_id = ?",
      [fieldId, slotId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy giá khung giờ" });
      return;
    }

    console.log('[deleteFieldTimeSlot] Time slot pricing deleted successfully');

    res.status(200).json({ message: "Đã xóa giá khung giờ thành công" });
  } catch (error: any) {
    console.error('[deleteFieldTimeSlot] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};