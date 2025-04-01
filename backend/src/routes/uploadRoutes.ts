import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/database";
import jwt from "jsonwebtoken"; // Thêm để kiểm tra token

const router = express.Router();

// Thư mục lưu ảnh
const AVATAR_DIR = "C:\\Users\\Admin\\Desktop\\imageFibo\\Avatar";
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// Middleware kiểm tra token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token" });

  jwt.verify(token, "your-secret-key", (err: any, user: any) => { // Thay "your-secret-key" bằng secret thực tế
    if (err) return res.status(403).json({ error: "Token không hợp lệ" });
    req.user = user;
    next();
  });
};

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: async (req: any, file, cb) => {
    try {
      const userId = req.body.user_id; // Đổi thành user_id
      if (!userId) return cb(new Error("Thiếu user_id"), "");

      const [rows]: any = await pool.query("SELECT full_name FROM users WHERE user_id = ?", [userId]);
      if (rows.length === 0) return cb(new Error("User không tồn tại"), "");

      const fullName = rows[0].full_name.replace(/\s+/g, "");
      const fileExt = path.extname(file.originalname);
      const newFileName = `${userId}_${fullName}${fileExt}`;

      cb(null, newFileName);
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      cb(new Error("Lỗi server"), "");
    }
  },
});

const upload = multer({ storage });

// API Upload Ảnh Avatar
router.post("/", authenticateToken, upload.single("avatar"), async (req: any, res) => {
  if (!req.file) {
     res.status(400).json({ error: "Vui lòng chọn một ảnh" });
  }

  const userId = req.body.user_id; // Đổi thành user_id
  const avatarFilename = req.file.filename;
  const avatarUrl = `http://localhost:5000/avatars/${avatarFilename}`;

  try {
    await pool.query("UPDATE users SET avatar = ? WHERE user_id = ?", [avatarUrl, userId]);
    res.json({ avatar: avatarUrl }); // Chỉ trả về { avatar: string }
  } catch (error) {
    console.error("Lỗi cập nhật DB:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;