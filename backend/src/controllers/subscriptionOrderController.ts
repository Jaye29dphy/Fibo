import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export class SubscriptionOrderController {
  // Tạo đơn hàng subscription pending
  static async createSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        user_id,
        subscription_code,
        plan,
        months,
        total_cost,
        payment_method = 'banking'
      } = req.body;

      if (!user_id || !subscription_code || !plan || !months || !total_cost) {
        res.status(400).json({ error: "Thiếu thông tin đơn hàng subscription." });
        return;
      }

      // Kiểm tra plan có hợp lệ không
      // if (!['basic', 'classic', 'pro'].includes(plan.toLowerCase())) {
      //   res.status(400).json({ error: "Loại gói subscription không hợp lệ." });
      //   return;
      // }
      // Query the subscription_plans table to get plan_id and validate plan name
      const [planRows]: any = await pool.execute(
        "SELECT plan_id FROM subscription_plans WHERE plan_code = ?",
        [plan.toLowerCase()]
      );

      if (planRows.length === 0) {
        res.status(400).json({ error: "Loại gói subscription không hợp lệ hoặc không tồn tại." });
        return;
      }
      const plan_id_snapshot = planRows[0].plan_id;      await pool.execute(
        `INSERT INTO subscriptionpendingorders 
         (subscription_code, user_id, plan_name_snapshot, months, total_cost, payment_method, plan_id_snapshot) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [subscription_code, user_id, plan.toLowerCase(), months, total_cost, payment_method, plan_id_snapshot]
      );

      res.status(201).json({ message: "Tạo đơn hàng subscription pending thành công" });
    } catch (error) {
      console.error("Lỗi tạo đơn hàng subscription pending:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }

  // Lấy trạng thái đơn hàng subscription
  static async getSubscriptionOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_code } = req.params;      const [rows]: any = await pool.execute(
        "SELECT status FROM subscriptionpendingorders WHERE subscription_code = ?",
        [subscription_code]
      );

      if (!rows.length) {
        res.status(404).json({ error: "Không tìm thấy đơn hàng subscription." });
        return;
      }

      res.status(200).json({ status: rows[0].status });
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái đơn hàng subscription:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }

  // Cập nhật trạng thái đơn hàng subscription
  static async updateSubscriptionOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_code } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'paid', 'cancelled', 'expired'].includes(status)) {
        res.status(400).json({ error: "Trạng thái không hợp lệ." });
        return;
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {        const [result]: any = await connection.execute(
          "UPDATE subscriptionpendingorders SET status = ? WHERE subscription_code = ?",
          [status, subscription_code]
        );

        if (result.affectedRows === 0) {
          await connection.rollback();
          res.status(404).json({ error: "Không tìm thấy đơn hàng subscription để cập nhật." });
          return;
        }        if (status === 'paid') {
          // Lấy thông tin đơn hàng để ghi vào bảng payments và kích hoạt subscription
          const [orderRows]: any = await connection.execute(
            "SELECT order_id, user_id, plan_id_snapshot, months, total_cost, payment_method FROM subscriptionpendingorders WHERE subscription_code = ?",
            [subscription_code]
          );

          if (orderRows.length > 0) {
            const order = orderRows[0];
            await SubscriptionOrderController.recordSubscriptionPayment(
              connection, 
              order.order_id,
              subscription_code,
              order.total_cost,
              order.payment_method || 'banking', 
              null 
            );

            // Kích hoạt hoặc cập nhật subscription cho owner
            await SubscriptionOrderController.activateOrUpdateOwnerSubscription(
              connection,
              order.user_id, 
              order.plan_id_snapshot,
              order.months
            );

          } else {
            // Should not happen if update was successful, but good to handle
            await connection.rollback();
            res.status(404).json({ error: "Không tìm thấy thông tin đơn hàng sau khi cập nhật." });
            return;
          }
        }

        await connection.commit();
        res.status(200).json({ message: "Cập nhật trạng thái đơn hàng subscription thành công." });

      } catch (error) {
        await connection.rollback();
        console.error("Lỗi trong quá trình giao dịch cập nhật trạng thái đơn hàng subscription:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật trạng thái." });
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng subscription:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }

  // Helper method to record payment
  private static async recordSubscriptionPayment(
    connection: any, // Accept connection for transaction
    orderId: number,
    subscriptionCode: string,
    amountPaid: number,
    paymentMethodDetails: string,
    paymentGatewayTransactionId: string | null
  ): Promise<void> {
    try {
      await connection.execute(
        `INSERT INTO subscription_payments 
         (order_id, payment_gateway_transaction_id, amount_paid, currency, payment_method_details, payment_status, transaction_timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          paymentGatewayTransactionId,
          amountPaid,
          'VND', // Assuming VND
          paymentMethodDetails,
          'succeeded', // Assuming payment is successful if this is called
        ]
      );
      console.log(`Payment recorded for order_id: ${orderId}, subscription_code: ${subscriptionCode}`);
    } catch (error) {
      console.error("Lỗi khi ghi nhận thanh toán subscription:", error);
      // This error should be caught by the calling function's transaction rollback
      throw error; 
    }
  }

  private static async activateOrUpdateOwnerSubscription(
    connection: any,
    userId: number,
    planIdSnapshot: number,
    monthsPurchased: number
  ): Promise<void> {
    try {
      // 1. Get owner_id from user_id
      const [ownerRows]: any = await connection.execute(
        "SELECT owner_id FROM owners WHERE user_id = ?",
        [userId]
      );

      if (ownerRows.length === 0) {
        throw new Error(`Owner not found for user_id: ${userId}`);
      }
      const ownerId = ownerRows[0].owner_id;

      // 2. Calculate start_date and end_date
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + monthsPurchased);

      // 3. Check for existing active subscription and UPSERT
      const [existingSubscription]: any = await connection.execute(
        "SELECT subscription_id FROM owner_subscriptions WHERE owner_id = ? AND status = 'active'",
        [ownerId]
      );

      if (existingSubscription.length > 0) {
        // Update existing active subscription
        const subscriptionId = existingSubscription[0].subscription_id;
        await connection.execute(
          `UPDATE owner_subscriptions 
           SET plan_id = ?, start_date = ?, end_date = ?, last_updated_at = NOW()
           WHERE subscription_id = ?`,
          [planIdSnapshot, startDate, endDate, subscriptionId]
        );
        console.log(`Owner subscription updated for owner_id: ${ownerId}, subscription_id: ${subscriptionId}`);
      } else {
        // Insert new subscription
        await connection.execute(
          `INSERT INTO owner_subscriptions 
           (owner_id, plan_id, start_date, end_date, status, created_at) 
           VALUES (?, ?, ?, ?, 'active', NOW())`,
          [ownerId, planIdSnapshot, startDate, endDate]
        );
        console.log(`New subscription created for owner_id: ${ownerId}`);
      }
      
      // 4. Log subscription history (optional)
      await connection.execute(
        `INSERT INTO subscription_history 
         (owner_id, plan_id, start_date, end_date, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [ownerId, planIdSnapshot, startDate, endDate]
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật gói đăng ký:", error);
      throw error; 
    }
  }

  // Xóa đơn hàng subscription pending
  static async deleteSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_code } = req.params;      const [result]: any = await pool.execute(
        "DELETE FROM subscriptionpendingorders WHERE subscription_code = ?",
        [subscription_code]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Không tìm thấy đơn hàng subscription để xóa." });
        return;
      }

      res.status(200).json({ message: "Đã xóa đơn hàng subscription pending." });
    } catch (error) {
      console.error("Lỗi khi xóa đơn hàng subscription pending:", error);
      res.status(500).json({ error: "Không thể xóa đơn hàng subscription pending." });
    }
  }
}
