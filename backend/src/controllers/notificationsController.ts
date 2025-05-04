import { Request, Response } from 'express';
import db from '../config/database';

interface Notification {
  notification_id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_read: 'read' | 'unread';
  created_at: string;
}

interface NotificationRow {
  notification_id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_read: number;
  created_at: string | Date;
}

export const getNotification = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Kiểm tra kết nối database
    await db.query('SELECT 1');
    console.log("Kết nối database thành công");

    const query = `
      SELECT 
        n.notification_id,
        n.user_id,
        u.full_name AS user_name,
        n.message,
        n.is_read,
        n.created_at
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.user_id
      ORDER BY n.created_at DESC;
    `;
    console.log("Thực thi truy vấn:", query);

    const [rows] = await db.execute(query) as [NotificationRow[], any];
    console.log("Dữ liệu thô từ database:", rows);

    const notifications: Notification[] = rows.map((row) => {
      if (typeof row.is_read !== 'number') {
        console.warn(`Dữ liệu is_read không hợp lệ cho notification_id ${row.notification_id}:`, row.is_read);
        row.is_read = 0; // Giá trị mặc định nếu không hợp lệ
      }
      return {
        notification_id: row.notification_id,
        user_id: row.user_id,
        user_name: row.user_name || 'Unknown',
        message: row.message,
        is_read: row.is_read === 1 ? 'read' : 'unread',
        created_at: new Date(row.created_at).toISOString(),
      };
    });

    console.log("Dữ liệu trả về:", notifications);
    res.json(notifications);
  } catch (error: any) {
    console.error('error', "Lỗi khi lấy danh sách thông báo:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const sendNotificationToAllUsers = async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ message: "Nội dung thông báo không hợp lệ" });
    return;
  }

  try {
    // Lấy danh sách tất cả người dùng
    const [users] = await db.execute('SELECT user_id FROM users') as [{ user_id: number }[], any];

    if (!users.length) {
      res.status(404).json({ message: "Không tìm thấy người dùng nào" });
      return;
    }

    // Tạo thông báo cho từng người dùng
    const values = users.map(user => [user.user_id, message, 0, new Date()]);
    const query = `
      INSERT INTO notifications (user_id, message, is_read, created_at)
      VALUES ?;
    `;

    await db.query(query, [values]);
    console.log(`Đã gửi thông báo đến ${users.length} người dùng`);

    res.status(200).json({ message: "Thông báo đã được gửi đến tất cả người dùng" });
  } catch (error: any) {
    console.error("Lỗi khi gửi thông báo:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  const { notification_id } = req.params;

  if (!notification_id || isNaN(Number(notification_id))) {
    res.status(400).json({ message: "ID thông báo không hợp lệ" });
    return;
  }

  try {
    const query = `
      UPDATE notifications
      SET is_read = 1
      WHERE notification_id = ?;
    `;
    const [result] = await db.execute(query, [notification_id]) as [{ affectedRows: number }, any];

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Không tìm thấy thông báo" });
      return;
    }

    console.log(`Đã đánh dấu thông báo ${notification_id} là đã đọc`);
    res.status(200).json({ message: "Thông báo đã được đánh dấu là đã đọc" });
  } catch (error: any) {
    console.error("Lỗi khi cập nhật trạng thái thông báo:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};