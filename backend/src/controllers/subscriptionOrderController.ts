import { Request, Response } from "express";
import pool from "../config/database";

export class SubscriptionOrderController {
  // Tạo đơn hàng subscription pending
  static async createSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    let connection;
    try {
      const {
        user_id,
        subscription_code,
        plan: plan_code_from_req,
        plan_display_name,
        months,
        total_cost,
        payment_method = "banking"
      } = req.body;

      console.log("📥 Dữ liệu tạo order:", {
        user_id,
        subscription_code,
        plan_code_from_req,
        plan_display_name,
        months,
        total_cost,
        payment_method
      });
      console.log("📤 Tạo đơn với plan_code:", plan_code_from_req);


      if (!user_id || !subscription_code || !plan_code_from_req || !plan_display_name || !months || total_cost === undefined) {
         res.status(400).json({ error: "Thiếu thông tin bắt buộc: user_id, subscription_code, plan, plan_display_name, months, total_cost." });
         return;
      }

      connection = await pool.getConnection();

      const [planRows]: any = await connection.query(
        "SELECT plan_id, plan_code, price FROM subscription_plans WHERE plan_code = ?",
        [plan_code_from_req.toLowerCase()]
      );

      if (planRows.length === 0) {
         res.status(400).json({ error: `Không tìm thấy plan code hợp lệ: ${plan_code_from_req}` });
         return;
      }

      const planDetails = planRows[0];
      const expiresAt = new Date(Date.now() + 60 * 1000);

      const [result]: any = await connection.query(
        `INSERT INTO subscriptionpendingorders 
         (user_id, subscription_code, plan_name_snapshot, plan_id_snapshot, months_purchased, price_per_month_snapshot, total_cost, payment_method, status, expires_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
        [
          user_id,
          subscription_code,
          plan_display_name,
          planDetails.plan_id,
          months,
          planDetails.price,
          total_cost,
          payment_method,
          expiresAt
        ]
      );

      await connection.commit();

       res.status(201).json({
        message: "Tạo đơn hàng đăng ký thành công.",
        order_id: result.insertId,
        subscription_code: subscription_code
      });
    } catch (error) {
      console.error("❌ Lỗi khi tạo subscription pending order:", error);
       res.status(500).json({ error: "Lỗi server khi tạo đơn hàng." });
    } finally {
      if (connection) connection.release();
    }
  }

  // Lấy trạng thái đơn hàng subscription
  static async getSubscriptionOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_code } = req.params;
      if (!subscription_code) {
         res.status(400).json({ error: "Subscription code is required." });
         return;
      }

      const [rows]: any = await pool.query(
        "SELECT status, plan_name_snapshot, total_cost, created_at, expires_at FROM subscriptionpendingorders WHERE subscription_code = ?",
        [subscription_code]
      );

      if (rows.length === 0) {
         res.status(404).json({ error: "Subscription order not found." });
         return;
      }

       res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Error in getSubscriptionOrderStatus:", error);
       res.status(500).json({ error: "Internal Server Error." });
    }
  }

  // Cập nhật trạng thái đơn hàng subscription và tạo/cập nhật gói đăng ký
static async updateSubscriptionOrderStatus(req: Request, res: Response): Promise<void> {
  let connection;
  try {
    const { order_id } = req.params;
    const { new_status } = req.body; // Changed from 'status' and removed default 'paid'

    // Validate new_status
    if (!new_status || !['paid', 'expired', 'cancelled'].includes(new_status)) {
      res.status(400).json({ error: "Trạng thái mới không hợp lệ hoặc bị thiếu. Phải là 'paid', 'expired', hoặc 'cancelled'." });
      return;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log(`🔄 Cập nhật trạng thái đơn hàng: ID ${order_id}, Trạng thái mới: ${new_status}`);

    const [orderRows]: any = await connection.query(
      "SELECT * FROM subscriptionpendingorders WHERE order_id = ?",
      [order_id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      res.status(404).json({ error: "Không tìm thấy đơn hàng." });
      return;
    }

    const order = orderRows[0];

    // Prevent updating to 'paid' if already 'expired'
    if (order.status === 'expired' && new_status === 'paid') {
        await connection.rollback();
        res.status(400).json({ error: `Đơn hàng ID ${order_id} đã hết hạn, không thể cập nhật thành 'paid'.` });
        return;
    }
    
    if (order.status === 'paid' && new_status !== 'paid') {
        console.warn(`Đơn hàng ID ${order_id} đã được thanh toán, đang được cập nhật thành '${new_status}'.`);
    }

    await connection.query(
      "UPDATE subscriptionpendingorders SET status = ?, updated_at = NOW() WHERE order_id = ?",
      [new_status, order_id]
    );

    if (new_status === 'paid') {
      if (!order.user_id) {
        await connection.rollback();
        console.error(`Lỗi: user_id không tồn tại cho order_id ${order_id} khi cố gắng kích hoạt gói.`);
        res.status(500).json({ error: "Lỗi server: Thiếu thông tin người dùng để kích hoạt gói." });
        return;
      }
      await SubscriptionOrderController.activateOrUpdateOwnerSubscription(connection, order.user_id, parseInt(order_id, 10));
    }

    await connection.commit();
    res.status(200).json({ message: `Cập nhật trạng thái đơn hàng ID ${order_id} thành ${new_status} thành công.` });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái." });
  } finally {
    if (connection) connection.release();
  }
}

static async activateOrUpdateOwnerSubscription(connection: any, userId: number, orderId: number): Promise<void> {
  try {
    const [orderRows]: any = await connection.query(
      `SELECT * FROM subscriptionpendingorders WHERE order_id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      throw new Error("Không tìm thấy đơn hàng đăng ký.");
    }

    const order = orderRows[0];
    const planId = order.plan_id_snapshot;
    const monthsPurchased = order.months_purchased;

    const [ownerRows]: any = await connection.query(
      `SELECT owner_id FROM owners WHERE user_id = ?`,
      [userId]
    );

    if (ownerRows.length === 0) {
      throw new Error(`Không tìm thấy chủ sân tương ứng với user_id = ${userId}`);
    }

    const ownerId = ownerRows[0].owner_id;

    if (!monthsPurchased || isNaN(monthsPurchased)) {
      throw new Error("months_purchased không hợp lệ hoặc không tồn tại.");
    }

    // Kiểm tra xem đã tồn tại gói subscription nào từ source_pending_order_id khác mà đang active không
    const [existingActiveSubscriptions]: any = await connection.query(
      `SELECT * FROM owner_subscriptions 
       WHERE owner_id = ? AND status = 'active' AND source_pending_order_id != ?`,
      [ownerId, orderId]
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsPurchased);

    // Chỉ thực hiện update subscription khi đơn hàng đã được thanh toán
    await connection.query(
      `INSERT INTO owner_subscriptions (
        owner_id, plan_id, start_date, end_date, status, source_pending_order_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'active', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        plan_id = VALUES(plan_id),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        status = 'active',
        source_pending_order_id = VALUES(source_pending_order_id),
        updated_at = NOW()`,
      [ownerId, planId, startDate, endDate, orderId]
    );
  } catch (error) {
    console.error("❌ Lỗi khi xử lý activateOrUpdateOwnerSubscription:", error);
    throw error;
  }
}  // Cập nhật trạng thái đơn hàng subscription pending thành cancelled (thay vì xóa)
  static async deleteSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    let connection;
    try {
      const { subscription_code } = req.params;
      if (!subscription_code) {
        res.status(400).json({ error: "Subscription code is required." });
        return;
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1. Lấy thông tin đơn hàng để xác định order_id
      const [orderRows]: any = await connection.query(
        "SELECT order_id, user_id FROM subscriptionpendingorders WHERE subscription_code = ? AND (status = 'pending' OR status = 'expired')",
        [subscription_code]
      );

      if (orderRows.length === 0) {
        res.status(404).json({ error: "Order not found or not in a cancellable state (must be pending or expired)." });
        return;
      }

      const orderId = orderRows[0].order_id;
      const userId = orderRows[0].user_id;

      // 2. Lấy owner_id từ user_id
      const [ownerRows]: any = await connection.query(
        "SELECT owner_id FROM owners WHERE user_id = ?", 
        [userId]
      );

      if (ownerRows.length > 0) {
        const ownerId = ownerRows[0].owner_id;

        // 3. Vô hiệu hóa subscription liên quan đến đơn này (nếu có)
        // Nếu đã có subscription từ đơn hàng này, cập nhật status thành cancelled
        await connection.query(
          "UPDATE owner_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE source_pending_order_id = ? AND owner_id = ?",
          [orderId, ownerId]
        );
      }

      // 4. Thay vì xóa đơn hàng pending, cập nhật trạng thái thành cancelled
      const [result]: any = await connection.query(
        "UPDATE subscriptionpendingorders SET status = 'cancelled', updated_at = NOW() WHERE subscription_code = ? AND (status = 'pending' OR status = 'expired')",
        [subscription_code]
      );      await connection.commit();
      res.status(200).json({ message: "Pending subscription order cancelled successfully." });
    } catch (error) {
      console.error("❌ Lỗi khi hủy đơn hàng đăng ký tạm thời:", error);
      res.status(500).json({ error: "Lỗi server khi hủy đơn hàng." });
    } finally {
      if (connection) connection.release();
    }
  }
}
