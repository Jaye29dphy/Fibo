import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail";
import fs from "fs";

import path from 'path';
import os from 'os';
import { AuthRequest } from "../middleware/authMiddleware";
import dotenv from 'dotenv';

dotenv.config();


// export const sendOtp = async (req: Request, res: Response): Promise<void> => {
//   const { email } = req.body;

//   try {
//     const [users]: [any[], any] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
//     if (!users.length) {
//       res.status(404).json({ message: "Email không tồn tại!" });
//       return;
//     }

//     const user = users[0];
//     const currentTime = new Date();

//     // Nếu OTP cũ đã hết hạn, xóa OTP cũ
//     if (user.otp_expiry && new Date(user.otp_expiry) < currentTime) {
//       await pool.execute("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?", [email]);
//     }

//     // Tạo OTP mới
//     const otp = crypto.randomInt(100000, 999999).toString();
//     const hashedOtp = await bcrypt.hash(otp, 10);
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

//     // Lưu OTP mới vào cơ sở dữ liệu
//     await pool.execute("UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?", [hashedOtp, expiresAt, email]);

//     // Gửi OTP mới cho người dùng qua email
//     await sendEmail(email, `Mã OTP của bạn là ${otp}. Hết hạn sau 5 phút.`);

//     res.status(200).json({ message: "OTP đã được gửi!" });
//   } catch (error) {
//     console.error("Lỗi khi gửi OTP:", error);
//     res.status(500).json({ message: "Lỗi máy chủ!" });
//   }
// };

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const [users]: [any[], any] = await pool.execute(
      "SELECT otp_attempts, last_otp_request FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      res.status(404).json({ message: "Email không tồn tại!" });
      return;
    }

    const user = users[0];
    const currentTime = new Date();
    const lastRequest = user.last_otp_request ? new Date(user.last_otp_request) : null;

    // Kiểm tra nếu yêu cầu quá nhanh (chỉ cho phép gửi OTP sau 1 phút)
    if (lastRequest && (currentTime.getTime() - lastRequest.getTime()) < 60 * 1000) {
      res.status(429).json({ message: "Bạn đã yêu cầu OTP quá nhanh. Hãy thử lại sau!" });
      return;
    }

    // Kiểm tra nếu đã gửi quá nhiều OTP trong 10 phút
    if (user.otp_attempts >= 5 && lastRequest && (currentTime.getTime() - lastRequest.getTime()) < 10 * 60 * 1000) {
      res.status(429).json({ message: "Bạn đã yêu cầu quá nhiều OTP. Hãy thử lại sau 10 phút!" });
      return;
    }

    // Tạo OTP mới
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Cập nhật OTP, số lần thử, và thời gian yêu cầu cuối
    await pool.execute(
      "UPDATE users SET otp = ?, otp_expiry = ?, otp_attempts = ?, last_otp_request = ? WHERE email = ?",
      [
        hashedOtp,
        expiresAt,
        (lastRequest && (currentTime.getTime() - lastRequest.getTime()) > 10 * 60 * 1000) ? 1 : user.otp_attempts + 1,
        currentTime,
        email
      ]
    );

    // Gửi OTP qua email
    await sendEmail(email, `Mã OTP của bạn là ${otp}. Hết hạn sau 5 phút.`);

    res.status(200).json({ message: "OTP đã được gửi!" });
  } catch (error) {
    console.error("Lỗi khi gửi OTP:", error);
    res.status(500).json({ message: "Lỗi máy chủ!" });
  }
};



export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { email, newPassword, otp } = req.body;

  try {
    // Lấy user theo email
    const [users]: [any[], any] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      res.status(404).json({ message: "Email không tồn tại!" });
      return;
    }

    const user = users[0];
    const currentTime = new Date();

    // Kiểm tra OTP hết hạn hoặc không tồn tại
    if (user.otp === null || new Date(user.otp_expiry) < currentTime) {
      res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn!" });
      return;
    }

    // So sánh OTP (mã hóa) với OTP nhập
    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      res.status(400).json({ message: "OTP không hợp lệ!" });
      return;
    }

    // Kiểm tra mật khẩu mới có trùng với mật khẩu cũ không
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ message: "Mật khẩu mới không được trùng với mật khẩu cũ!" });
      return;
    }

    // Hash và cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công!" });
  } catch (error) {
    console.error("Lỗi khi thay đổi mật khẩu:", error);
    res.status(500).json({ message: "Lỗi máy chủ!" });
  }
};




export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, role, phone } = req.body;

    // Kiểm tra nếu thiếu trường
    if (!full_name || !email || !password || !role || !phone) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Kiểm tra email trùng lặp
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (Array.isArray(rows) && rows.length > 0) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm người dùng vào cơ sở dữ liệu với status mặc định là 'active'
    await pool.execute(
      "INSERT INTO users (full_name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [full_name, email, hashedPassword, phone, role, 'active']
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
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

    // ⚠️ Kiểm tra trạng thái tài khoản
    if (user.status === "inactive") {
      console.log("🚫 Tài khoản đã bị vô hiệu hóa:", email);
      res.status(403).json({ error: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên!" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log("❌ Sai mật khẩu cho email:", email);
      res.status(401).json({ error: "Mật khẩu không chính xác!" });
      return;
    }

    // 🔥 Tạo token
    const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "48h",
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
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("🔥 Lỗi trong quá trình đăng nhập:", error);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ!" });
  }
};


// Interface cho network interface (TypeScript)
interface NetworkInterface {
  address: string;
  netmask: string;
  family: string;
  mac: string;
  internal: boolean;
  cidr: string;
}

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const [users]: any = await pool.execute(
      'SELECT user_id, full_name, email, phone, role, status, created_at, avatar FROM users WHERE user_id = ?',
      [decoded.id]
    );

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let user = users[0];

    // Nếu là owner, lấy thêm business info
    if (user.role === 'owner') {
      const [owners]: any = await pool.execute(
        'SELECT owner_id, business_name, address FROM owners WHERE user_id = ?',
        [decoded.id]
      );

      if (Array.isArray(owners) && owners.length > 0) {
        user = {
          ...user,
          owner_id: owners[0].owner_id,
          business_name: owners[0].business_name,
          address: owners[0].address,
        };
      }
    }

    // ✅ Lấy IP cục bộ
    const localIP =
      Object.values(os.networkInterfaces())
        .flat()
        .find((iface) => {
          const netIface = iface as any;
          return (
            netIface &&
            netIface.family === 'IPv4' &&
            !netIface.internal &&
            netIface.address?.startsWith('192.168.')
          );
        })?.address || 'localhost';

    const avatarBasePath = process.env.AVATAR_IMAGE_PATH || 'F:\\img\\avatar';

    // ✅ Xử lý ảnh avatar có ?t=timestamp để tránh cache
    const timestamp = Date.now();

    if (user.avatar) {
      const avatarFilePath = path.join(avatarBasePath, user.avatar);

      try {
        if (fs.existsSync(avatarFilePath)) {
          user.avatar = `http://${localIP}:5000/avatars/${user.avatar}?t=${timestamp}`;
        } else {
          console.warn(`❗ Avatar not found: ${avatarFilePath}`);
          user.avatar = `http://${localIP}:5000/avatars/default-avatar.jpg?t=${timestamp}`;
        }
      } catch (err) {
        console.error("Lỗi kiểm tra file avatar:", err);
        user.avatar = `http://${localIP}:5000/avatars/default-avatar.jpg?t=${timestamp}`;
      }
    } else {
      user.avatar = `http://${localIP}:5000/avatars/default-avatar.jpg?t=${timestamp}`;
    }

    res.json(user);
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(500).json({ error: 'Invalid token' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret"); const userId = parseInt(req.params.id);
    if (decoded.id !== userId) {
      res.status(403).json({ error: "Forbidden: Bạn không thể sửa người khác" });
      return;
    }
    const { full_name, email, phone, business_name, address } = req.body;
    if (!full_name || !email || !phone) {
      res.status(400).json({ error: "Thiếu thông tin cần thiết" });
      return;
    }

    // Cập nhật thông tin cơ bản trong bảng users
    const [result]: any = await pool.execute(
      "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [full_name, email, phone, userId]
    );
    // Lấy thông tin role từ database vì có thể không được gửi từ frontend
    const [userRole]: any = await pool.execute(
      "SELECT role FROM users WHERE user_id = ?",
      [userId]
    );
    const isOwner = Array.isArray(userRole) && userRole.length > 0 && userRole[0].role === 'owner';

    // Nếu có thông tin doanh nghiệp và người dùng là owner, cập nhật thêm vào bảng owners
    if ((business_name || address) && isOwner) {
      // Kiểm tra xem đã có bản ghi trong bảng owners chưa
      const [owners]: any = await pool.execute(
        "SELECT owner_id FROM owners WHERE user_id = ?",
        [userId]
      );

      if (Array.isArray(owners) && owners.length > 0) {
        // Đã có bản ghi, cập nhật
        await pool.execute(
          "UPDATE owners SET business_name = ?, address = ? WHERE user_id = ?",
          [business_name || null, address || null, userId]
        );
      } else {
        // Chưa có bản ghi, tạo mới
        await pool.execute(
          "INSERT INTO owners (user_id, business_name, address) VALUES (?, ?, ?)",
          [userId, business_name || null, address || null]
        );
      }
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy người dùng" });
      return;
    }

    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};


// authController.ts
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // Lấy user_id từ middleware authenticate

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User not authenticated" });
      return;
    }

    // Truy vấn danh sách thông báo từ bảng notifications
    const [notifications]: [any[], any] = await pool.execute(
      "SELECT notification_id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({ error: "Lỗi máy chủ!" });
  }
};