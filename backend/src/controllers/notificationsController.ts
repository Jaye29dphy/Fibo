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

export const getNotification = async (_req: Request, res: Response) => {
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
    console.error("Lỗi khi lấy danh sách thông báo:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};