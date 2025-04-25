import { Request, Response } from "express";
import pool from "../config/database";

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: "Vui lòng chọn một ảnh" });
      return;
    }

    const userId = req.body.user_id;
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Use the extension from req.file.mimetype instead of originalname
    const mimeType = req.file.mimetype; // e.g., "image/png"
    const extension = mimeType.split("/")[1]; // e.g., "png"
    const avatarPath = `${userId}_avatar.${extension}`;

    // Update the user's avatar URL in the database using the pool
    const [result] = await pool.execute(
      "UPDATE users SET avatar = ? WHERE user_id = ?",
      [avatarPath, userId]
    );

    // Check if the update was successful
    if ((result as any).affectedRows === 0) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    // Respond with the avatar filename
    res.status(200).json({ avatar: avatarPath });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};