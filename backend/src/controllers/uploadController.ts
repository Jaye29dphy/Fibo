import { Request, Response } from "express";
import pool from "../config/database";
import fs from "fs";
import path from "path";

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

    // Đường dẫn tới file tạm và file đích
    const avatarBasePath = process.env.AVATAR_IMAGE_PATH || "F:\\img\\avatar";
    const tempFilePath = path.join(avatarBasePath, req.file.filename);
    const targetFilePath = path.join(avatarBasePath, avatarPath);


    // Đổi tên file từ tên tạm thời sang tên chính thức
    try {
      // Nếu file đích đã tồn tại, xóa nó trước
      if (fs.existsSync(targetFilePath)) {
        fs.unlinkSync(targetFilePath);
      }
      fs.renameSync(tempFilePath, targetFilePath);
    } catch (error) {
      console.error("Error renaming file:", error);
      res.status(500).json({ error: "Error processing uploaded file" });
      return;
    }

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