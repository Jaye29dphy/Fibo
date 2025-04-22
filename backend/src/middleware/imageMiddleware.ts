import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load biến môi trường
dotenv.config();

const imageMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Thêm header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Đường dẫn tới folder ảnh lấy từ biến môi trường
  const basePath = process.env.FIELD_IMAGE_PATH;
  if (!basePath) {
    res.status(500).json({ error: "Server misconfigured: FIELD_IMAGE_PATH is not set" });
    return;
  }

  // Ghép đường dẫn file ảnh
  const filePath = path.join(basePath, req.path);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  // Kiểm tra file có rỗng không
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    res.status(400).json({ error: "Image file is empty" });
    return;
  }

  // Nếu file hợp lệ, tiếp tục
  next();
};

export default imageMiddleware;
