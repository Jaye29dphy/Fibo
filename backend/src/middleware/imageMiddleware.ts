import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

// Định nghĩa kiểu trả về của middleware là void
const imageMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Thêm header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Đường dẫn tới file ảnh
  const filePath = path.join("D:/img/field", req.path);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Image not found" });
    return; // Dừng lại nhưng không trả về Response
  }

  // Kiểm tra file có rỗng không
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    res.status(400).json({ error: "Image file is empty" });
    return; // Dừng lại nhưng không trả về Response
  }

  // Nếu file hợp lệ, tiếp tục
  next();
};

export default imageMiddleware;