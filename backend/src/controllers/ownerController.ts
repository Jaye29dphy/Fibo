import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export class OwnerController {
  // Lấy thông tin hồ sơ của owner
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      if (req.user.role !== "owner") {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }

      const userId = req.user.id;

      // Truy vấn thông tin người dùng từ database
      const [users]: any = await pool.execute(
        "SELECT user_id, full_name, email, phone, role, status, created_at, avatar FROM users WHERE user_id = ? AND role = 'owner'",
        [userId]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(404).json({ error: "Owner not found" });
      }

      const user = users[0];
      res.status(200).json(user);
    } catch (error) {
      console.error("Error in getProfile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Cập nhật thông tin hồ sơ của owner (nếu cần)
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      if (req.user.role !== "owner") {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }

      const userId = req.user.id;
      const { full_name, email, phone } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!full_name || !email || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Cập nhật thông tin trong database
      await pool.execute(
        "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ? AND role = 'owner'",
        [full_name, email, phone, userId]
      );

      // Lấy thông tin đã cập nhật
      const [updatedUsers]: any = await pool.execute(
        "SELECT user_id, full_name, email, phone, role, status, created_at, avatar FROM users WHERE user_id = ?",
        [userId]
      );

      if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
        return res.status(404).json({ error: "Owner not found after update" });
      }

      const updatedUser = updatedUsers[0];
      res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error in updateProfile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Upload avatar của owner (nếu cần)
  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      if (req.user.role !== "owner") {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }

      const userId = req.user.id;
      const avatar = req.file?.filename; // Giả sử bạn sử dụng middleware như multer để xử lý file upload

      if (!avatar) {
        return res.status(400).json({ error: "No avatar file provided" });
      }

      // Cập nhật avatar trong database
      await pool.execute(
        "UPDATE users SET avatar = ? WHERE user_id = ? AND role = 'owner'",
        [avatar, userId]
      );

      res.status(200).json({ message: "Avatar uploaded successfully", avatar });
    } catch (error) {
      console.error("Error in uploadAvatar:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}