import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/database"; // ✅ Sử dụng lại pool từ database.ts

const router = express.Router();

// 🔹 Thư mục lưu ảnh
const AVATAR_DIR = "C:\\Users\\Admin\\Desktop\\imageFibo\\Avatar";
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// 🔹 Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: async (req: any, file, cb) => {
    try {
      const userId = req.body.userId;
      if (!userId) return cb(new Error("Thiếu userId"), "");

      // 🔹 Truy vấn full_name từ database
      const [rows]: any = await pool.query("SELECT full_name FROM users WHERE user_id = ?", [userId]);

      if (rows.length === 0) return cb(new Error("User không tồn tại"), "");

      const fullName = rows[0].full_name.replace(/\s+/g, ""); // Xóa khoảng trắng
      const fileExt = path.extname(file.originalname); // Lấy đuôi file (jpg, png, ...)
      const newFileName = `${userId}_${fullName}${fileExt}`; // 🔹 Định dạng: userId_FullName.ext

      cb(null, newFileName);
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      cb(new Error("Lỗi server"), "");
    }
  },
});

const upload = multer({ storage });

// 🔹 API Upload Ảnh Avatar
router.post("/", upload.single("avatar"), async (req: any, res) => {
  if (!req.file) res.status(400).json({ error: "Vui lòng chọn một ảnh" });

  const userId = req.body.userId;
  const avatarFilename = req.file.filename;
  const avatarUrl = `http://localhost:5000/avatars/${avatarFilename}`; // ✅ Trả về URL đầy đủ

  try {
    await pool.query("UPDATE users SET avatar = ? WHERE user_id = ?", [avatarUrl, userId]);
    res.json({ message: "Upload thành công!", avatar: avatarUrl });
  } catch (error) {
    console.error("Lỗi cập nhật DB:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
