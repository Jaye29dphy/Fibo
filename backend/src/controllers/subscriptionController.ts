import { Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export class SubscriptionController {  // Get all subscription plans
  static async getAllSubscriptionPlans(req: AuthRequest, res: Response): Promise<void> {
    try {      console.log("Fetching subscription plans...");        const [plans]: any = await pool.execute(
        `SELECT 
          plan_id,
          plan_code AS name,
          price,
          max_fields,
          description
        FROM 
          subscription_plans
        ORDER BY
          price ASC`
      );
      
      console.log(`Found ${plans.length} subscription plans:`, plans);

      res.status(200).json(plans);
    } catch (error) {
      console.error("Error in getAllSubscriptionPlans:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  
  // Lịch sử gói đăng ký theo owner
static async getSubscriptionHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User not found" });
      return;
    }

    const userId = req.user.id;

    // Tìm owner_id tương ứng với user
    const [owners]: any = await pool.execute(
      "SELECT owner_id FROM owners WHERE user_id = ?",
      [userId]
    );

    if (!Array.isArray(owners) || owners.length === 0) {
      res.status(404).json({ error: "Không tìm thấy chủ sân cho tài khoản này." });
      return;
    }

    const ownerId = owners[0].owner_id;

    // Lấy danh sách lịch sử đăng ký, kèm thông tin gói và đơn hàng nếu có
    const [subscriptions]: any = await pool.execute(
      `SELECT 
        os.subscription_id, 
        os.owner_id,
        os.plan_id,
        sp.plan_code AS plan_name,
        sp.price,
        sp.max_fields,
        os.start_date,
        os.end_date,
        CASE 
          WHEN os.end_date < NOW() THEN 'expired'
          ELSE os.status
        END as status,
        sp.description,
        spo.total_cost
      FROM 
        owner_subscriptions os
      JOIN 
        subscription_plans sp ON os.plan_id = sp.plan_id
      LEFT JOIN 
        subscriptionpendingorders spo ON os.source_pending_order_id = spo.order_id
      WHERE 
        os.owner_id = ?
      ORDER BY 
        os.start_date DESC`,
      [ownerId]
    );

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("❌ Error in getSubscriptionHistory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

  
  static async getAllOwnerSubscriptions(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        res.status(403).json({ error: "Forbidden: Admin access required" });
        return;
      }

      const [subscriptions]: any = await pool.execute(
        `SELECT 
          os.subscription_id AS revenue_id,
          os.owner_id,
          u.full_name AS owner_name,
          u.email AS owner_email,
          sp.price AS total_revenue,
          YEAR(os.start_date) AS year,
          MONTH(os.start_date) AS month,
          os.start_date AS last_updated
        FROM 
          owner_subscriptions os
        JOIN 
          subscription_plans sp ON os.plan_id = sp.plan_id
        JOIN 
          owners o ON os.owner_id = o.owner_id
        JOIN 
          users u ON o.user_id = u.user_id
        WHERE 
          os.status = 'active'
          AND os.start_date <= NOW()
          AND (os.end_date >= NOW() OR os.end_date IS NULL)
          AND YEAR(os.start_date) <= YEAR(NOW())
          AND (YEAR(os.start_date) < YEAR(NOW()) OR MONTH(os.start_date) <= MONTH(NOW()))
        ORDER BY 
          YEAR(os.start_date) DESC,
          MONTH(os.start_date) DESC`
      );

      console.log(`Found ${subscriptions.length} subscription records:`, subscriptions);
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error("Error in getAllOwnerSubscriptions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}



