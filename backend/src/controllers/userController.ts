// src/controllers/userController.ts
import { Request, Response } from "express";
import db from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";
import pool from "../config/database";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      res.status(400).json({ error: "Trạng thái không hợp lệ" });
      return;
    }

    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: "Chỉ admin mới có quyền cập nhật trạng thái người dùng" });
      return;
    }

    const [result]: any = await pool.execute(
      "UPDATE users SET status = ? WHERE user_id = ?",
      [status, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy người dùng" });
      return;
    }

    res.status(200).json({ message: "Cập nhật trạng thái người dùng thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};