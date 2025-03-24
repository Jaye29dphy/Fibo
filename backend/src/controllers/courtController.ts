import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware"; // Import kiểu mở rộng

interface Field {
  id: number;
  name: string;
  price: number;
  location: string;
  image: string;
  description: string;
}

export const createCourt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, price } = req.body;
    const owner_id = req.user?.id;

    if (!owner_id) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    await pool.execute(
      "INSERT INTO courts (name, location, price, owner_id) VALUES (?, ?, ?, ?)",
      [name, location, price, owner_id]
    );

    res.status(201).json({ message: "Court created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute("SELECT * FROM fields"); // Trả về rows từ kết quả truy vấn

    if (Array.isArray(rows) && rows.length === 0) { // Kiểm tra nếu rows là mảng
      res.status(404).json({ error: "No fields found" });
      return;
    }

    res.json(rows); // Trả về danh sách các sân
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFieldDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Lấy ID của sân từ params

    const [rows] = await pool.execute("SELECT * FROM fields WHERE field_id = ?", [id]); // Lấy sân theo ID

    if (Array.isArray(rows) && rows.length > 0) { // Kiểm tra nếu rows là mảng và có kết quả
      const field = rows[0] as Field; // Ép kiểu cho dữ liệu

      res.json(field); // Trả về sân chi tiết
    } else {
      res.status(404).json({ error: "Field not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
