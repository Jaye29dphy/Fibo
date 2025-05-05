import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export class OwnerController {
  // Lấy thông tin hồ sơ của owner
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }

      if (req.user.role !== "owner") {
        res.status(403).json({ error: "Forbidden: Access denied" });
        return;
      }

      const userId = req.user.id;

      // Truy vấn thông tin người dùng từ database
      const [users]: any = await pool.execute(
        "SELECT user_id, full_name, email, phone, role, status, created_at, avatar FROM users WHERE user_id = ? AND role = 'owner'",
        [userId]
      );

      if (!Array.isArray(users) || users.length === 0) {
        res.status(404).json({ error: "Owner not found" });
        return;
      }

      const user = users[0];
      res.status(200).json(user);
    } catch (error) {
      console.error("Error in getProfile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Cập nhật thông tin hồ sơ của owner (nếu cần)
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }

      if (req.user.role !== "owner") {
        res.status(403).json({ error: "Forbidden: Access denied" });
        return;
      }

      const userId = req.user.id;
      const { full_name, email, phone } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!full_name || !email || !phone) {
        res.status(400).json({ error: "Missing required fields" });
        return;
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
        res.status(404).json({ error: "Owner not found after update" });
        return;
      }

      const updatedUser = updatedUsers[0];
      res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error in updateProfile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Upload avatar của owner (nếu cần)
  static async uploadAvatar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }

      if (req.user.role !== "owner") {
        res.status(403).json({ error: "Forbidden: Access denied" });
        return;
      }

      const userId = req.user.id;
      const avatar = req.file?.filename; // Giả sử bạn sử dụng middleware như multer để xử lý file upload

      if (!avatar) {
        res.status(400).json({ error: "No avatar file provided" });
        return;
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

  // Get owner subscription
  static async getSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }

      const userId = req.user.id;

      // First, find the owner_id
      const [owners]: any = await pool.execute(
        "SELECT owner_id FROM owners WHERE user_id = ?",
        [userId]
      );

      if (!Array.isArray(owners) || owners.length === 0) {
        // No owner record found, return Basic plan
        res.status(200).json({
          subscription_id: 0,
          owner_id: 0,
          plan_id: 1,
          plan_name: "Basic",
          price: 0,
          max_fields: 1,
          start_date: null,
          end_date: null,
          status: "active",
          description: "Basic plan for small field owners"
        });
        return;
      }

      const ownerId = owners[0].owner_id;

      // Get subscription information
      const [subscriptions]: any = await pool.execute(
        `SELECT 
          os.subscription_id, 
          os.owner_id,
          os.plan_id,
          sp.name AS plan_name,
          sp.price,
          sp.max_fields,
          os.start_date,
          os.end_date,
          os.status,
          sp.description
        FROM 
          owner_subscriptions os
        JOIN 
          subscription_plans sp ON os.plan_id = sp.plan_id
        WHERE 
          os.owner_id = ? 
        ORDER BY 
          os.start_date DESC 
        LIMIT 1`,
        [ownerId]
      );

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        // No subscription, return Basic plan
        res.status(200).json({
          subscription_id: 0,
          owner_id: ownerId,
          plan_id: 1,
          plan_name: "Basic",
          price: 0,
          max_fields: 1,
          start_date: null,
          end_date: null,
          status: "active",
          description: "Basic plan for small field owners"
        });
        return;
      }

      // Return the subscription data
      res.status(200).json(subscriptions[0]);
    } catch (error) {
      console.error("Error in getSubscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Purchase subscription
  static async purchaseSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }

      const userId = req.user.id;
      const { plan, months } = req.body;

      if (!plan || !months || !["classic", "pro"].includes(plan)) {
        res.status(400).json({ error: "Invalid subscription parameters" });
        return;
      }

      // Get the owner_id
      const [owners]: any = await pool.execute(
        "SELECT owner_id FROM owners WHERE user_id = ?",
        [userId]
      );

      let ownerId;
      if (!Array.isArray(owners) || owners.length === 0) {
        // Create a new owner record if it doesn't exist
        const [insertResult]: any = await pool.execute(
          "INSERT INTO owners (user_id) VALUES (?)",
          [userId]
        );
        ownerId = insertResult.insertId;
      } else {
        ownerId = owners[0].owner_id;
      }

      // Get the plan ID
      const planId = plan === "classic" ? 2 : 3; // Assuming 2=Classic, 3=Pro
      
      // Calculate start and end dates
      const now = new Date();
      const startDate = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + parseInt(months.toString()));
      const formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');

      // Insert the new subscription
      await pool.execute(
        `INSERT INTO owner_subscriptions 
        (owner_id, plan_id, start_date, end_date, status) 
        VALUES (?, ?, ?, ?, 'active')`,
        [ownerId, planId, startDate, formattedEndDate]
      );

      // Get the inserted subscription with plan details
      const [subscriptions]: any = await pool.execute(
        `SELECT 
          os.subscription_id, 
          os.owner_id,
          os.plan_id,
          sp.name AS plan_name,
          sp.price,
          sp.max_fields,
          os.start_date,
          os.end_date,
          os.status,
          sp.description
        FROM 
          owner_subscriptions os
        JOIN 
          subscription_plans sp ON os.plan_id = sp.plan_id
        WHERE 
          os.owner_id = ? 
        ORDER BY 
          os.subscription_id DESC 
        LIMIT 1`,
        [ownerId]
      );

      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        res.status(500).json({ error: "Failed to create subscription" });
        return;
      }

      res.status(201).json({
        message: "Subscription purchased successfully",
        subscription: subscriptions[0]
      });
    } catch (error) {
      console.error("Error in purchaseSubscription:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}