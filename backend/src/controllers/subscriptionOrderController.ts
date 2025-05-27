import { Request, Response } from "express";
import pool from "../config/database"; // Assuming pool is your database connection pool

export class SubscriptionOrderController {
  // Tạo đơn hàng subscription pending
  static async createSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    let connection;
    try {
      const {
        user_id,
        subscription_code,
        plan: plan_code_from_req, // This is 'classic' or 'pro' from frontend
        plan_display_name,      // This is 'Gói Standard' etc. from frontend
        months,
        total_cost,
        payment_method = 'banking'
      } = req.body;

      if (!user_id || !subscription_code || !plan_code_from_req || !plan_display_name || !months || total_cost === undefined) {
        res.status(400).json({ error: "Missing required fields for pending order (user_id, subscription_code, plan, plan_display_name, months, total_cost)." });
        return;
      }

      connection = await pool.getConnection();
      const [planRows]: any = await connection.query(
        "SELECT plan_id, plan_code, price FROM subscription_plans WHERE plan_code = ?",
        [plan_code_from_req.toLowerCase()]
      );

      if (planRows.length === 0) {
        res.status(400).json({ error: `Invalid plan code from request: ${plan_code_from_req}` });
        return;
      }
      const planDetails = planRows[0]; // planDetails.plan_code will be from DB (e.g. 'standard')

      // Calculate expiration time (e.g., 15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const [result]: any = await connection.query(
        `INSERT INTO subscriptionpendingorders 
          (user_id, subscription_code, plan_name_snapshot, plan_id_snapshot, months_purchased, price_per_month_snapshot, total_cost, payment_method, status, expires_at, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
        [
          user_id,
          subscription_code,
          plan_display_name,       // Use the display name sent from frontend
          planDetails.plan_id,     // Use the plan_id from DB
          months,
          planDetails.price,       // Price per month from DB
          total_cost, 
          payment_method,
          expiresAt
        ]
      );

      await connection.commit();
      // Return the newly created order_id
      res.status(201).json({ 
        message: 'Subscription pending order created successfully.', 
        order_id: result.insertId, // Send back the insertId as order_id
        subscription_code: subscription_code // Also send back the generated subscription_code for reference
      });
    } catch (error) {
      console.error("Error in createSubscriptionPendingOrder:", error);
      res.status(500).json({ error: "Internal Server Error creating pending order." });
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

  // Cập nhật trạng thái đơn hàng subscription
  static async updateSubscriptionOrderStatus(req: Request, res: Response): Promise<void> {
    const { order_id } = req.params;
    const { new_status } = req.body; // Should be 'paid' or 'cancelled'

    if (!order_id || !new_status) {
      res.status(400).json({ message: 'Order ID and new status are required.' });
      return;
    }

    if (!['paid', 'cancelled'].includes(new_status)) {
      res.status(400).json({ message: "Invalid status. Must be 'paid' or 'cancelled'." });
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Fetch order details first
      const [orderDetailsRows]: any = await connection.query(
        'SELECT * FROM subscriptionpendingorders WHERE order_id = ?',
        [order_id]
      );

      if (orderDetailsRows.length === 0) {
        await connection.rollback();
        res.status(404).json({ message: 'Pending order not found.' });
        return;
      }
      const orderDetails = orderDetailsRows[0];

      // Update the status of the pending order
      await connection.query(
        'UPDATE subscriptionpendingorders SET status = ?, updated_at = NOW() WHERE order_id = ?',
        [new_status, order_id]
      );

      if (new_status === 'paid') {
        // Record the payment
        await SubscriptionOrderController.recordSubscriptionPayment(
          connection,
          orderDetails.order_id,
          orderDetails.subscription_code_snapshot, // Ensure this is passed
          orderDetails.amount_due,
          'ConfirmedManually', // Payment method
          null // Payment gateway transaction ID
        );

        // Activate or update the owner's subscription
        await SubscriptionOrderController.activateOrUpdateOwnerSubscription(
          connection,
          orderDetails.owner_id,
          orderDetails.plan_id_snapshot, // Corrected to plan_id_snapshot
          orderDetails.months_snapshot
        );
      }
      // If 'cancelled', no further action is needed beyond updating the status.

      await connection.commit();
      res.status(200).json({ message: `Subscription order ${order_id} status updated to ${new_status}.` });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating subscription order status:', error);
      res.status(500).json({ message: 'Failed to update subscription order status.', error: (error as Error).message });
    } finally {
      connection.release();
    }
  }

  // Helper method to record payment
  private static async recordSubscriptionPayment(
    connection: any, // Accept connection for transaction
    orderId: number, // This is subscriptionpendingorders.order_id
    subscriptionCode: string, // This parameter is kept for now, might be useful for logging or other non-DB purposes
    amountPaid: number,
    paymentMethod: string,
    paymentGatewayTransactionId: string | null
  ): Promise<void> {
    // Assuming subscription_payments table exists with appropriate columns
    // Removed subscription_code from the INSERT statement as the column does not exist in the table.
    await connection.query(
      `INSERT INTO subscription_payments 
        (order_id, amount_paid, payment_date, payment_method, status, payment_gateway_transaction_id) 
        VALUES (?, ?, NOW(), ?, 'completed', ?)`,
      [orderId, amountPaid, paymentMethod, paymentGatewayTransactionId]
    );
  }

  private static async activateOrUpdateOwnerSubscription(
    connection: any,
    userId: number,
    planIdSnapshot: number, // Changed from planSkuSnapshot: string to planIdSnapshot: number
    monthsPurchased: number
  ): Promise<void> {
    // The planId is now directly passed as planIdSnapshot
    const planId = planIdSnapshot;

    const [ownerRows]: any = await connection.query("SELECT owner_id FROM owners WHERE user_id = ?", [userId]);
    let ownerId: number;

    if (ownerRows.length === 0) {
      // This case should ideally be handled, e.g., by creating an owner record or throwing a specific error
      console.error(`No owner record found for user_id: ${userId} during subscription activation.`);
      throw new Error(`Owner record not found for user ${userId}.`);
    } else {
      ownerId = ownerRows[0].owner_id;
    }
    
    const now = new Date();
    const startDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + monthsPurchased);
    const formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');

    // Mark any existing active subscriptions for this owner as 'expired'
    await connection.query(
      "UPDATE owner_subscriptions SET status = 'expired' WHERE owner_id = ? AND status = 'active'",
      [ownerId]
    );

    // Insert the new subscription
    await connection.query(
      `INSERT INTO owner_subscriptions 
       (owner_id, plan_id, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, 'active')`,
      [ownerId, planId, startDate, formattedEndDate]
    );
  }

  // Xóa đơn hàng subscription pending (Optional: if needed)
  static async deleteSubscriptionPendingOrder(req: Request, res: Response): Promise<void> {
    try {
      const { subscription_code } = req.params;
      if (!subscription_code) {
        res.status(400).json({ error: "Subscription code is required." });
        return;
      }

      const [result]: any = await pool.query(
        "DELETE FROM subscriptionpendingorders WHERE subscription_code = ? AND status = 'pending'", // Only delete if still pending
        [subscription_code]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Pending order not found or not in deletable state." });
        return;
      }
      res.status(200).json({ message: "Pending subscription order deleted successfully." });
    } catch (error) {
      console.error("Error in deleteSubscriptionPendingOrder:", error);
      res.status(500).json({ error: "Internal Server Error." });
    }
  }
}
