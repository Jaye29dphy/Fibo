import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware"; // Import kiểu mở rộng

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

// ✅ Thêm export cho `getCourts`
export const getCourts = async (req: Request, res: Response): Promise<void> => {
  try {
    const [courts] = await pool.execute("SELECT * FROM courts");
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
