import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    console.log("📥 Yêu cầu đăng nhập:", { email }); // Log email được gửi lên

    const [users]: any = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!Array.isArray(users) || users.length === 0) {
      console.log("❌ Không tìm thấy email:", email);
      res.status(401).json({ error: "Email không tồn tại. Vui lòng kiểm tra lại!" });
      return;
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log("❌ Sai mật khẩu cho email:", email);
      res.status(401).json({ error: "Mật khẩu không chính xác!" });
      return;
    }

    // 🔥 Tạo token
    const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });

    console.log("✅ Đăng nhập thành công:", { email, userId: user.user_id });

    // 🔹 Trả về cả `token` và `user`
    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone, // Nếu có trường `phone`
      },
    });
  } catch (error) {
    console.error("🔥 Lỗi trong quá trình đăng nhập:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ!" });
  }
};


export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log("Token nhận được:", token); // Kiểm tra token có đúng không

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const [users]: any = await pool.execute(
      "SELECT user_id, full_name, email, phone, role, status, created_at FROM users WHERE user_id = ?",
      [decoded.id] // Lấy user_id từ token
    );


    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(users[0]);
  } catch (error) {
    console.error("JWT Error:", error); // In lỗi chi tiết
    res.status(500).json({ error: "Invalid token" });
  }
};