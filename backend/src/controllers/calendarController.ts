import { Request, Response } from 'express';
import db from '../config/database';
import pool from '../config/database';
import { RequestWithUser } from '../type/review';

interface Booking {
  id: number;
  booking_code: string | null;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_cost: number;
  field_name: string;
  customer_name: string;
}

interface BookingRow {
  id: number;
  booking_code: string | null;
  start_time: string | Date;
  end_time: string | Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_cost: number;
  field_name: string;
  customer_name: string;
}

export const getCalendarBookings = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        b.booking_id,
        b.booking_code,
        b.user_id,
        b.field_id,
        b.start_time,
        b.end_time,
        b.status,
        b.total_cost,
        f.name AS field_name
      FROM bookings b
      JOIN fields f ON b.field_id = f.field_id
      ORDER BY b.start_time ASC;
    `;
    const [rows] = await db.execute(query) as [any[], any];
    const bookings: Booking[] = rows.map((row) => {
      const formatDate = (date: string | Date): string => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`;
      };

      return {
        id: row.booking_id,
        booking_code: row.booking_code,
        start_time: formatDate(row.start_time),
        end_time: formatDate(row.end_time),
        status: row.status,
        total_cost: row.total_cost,
        field_name: row.field_name,
        field_id: row.field_id,
        customer_name: '', // Không sử dụng trong endpoint này
      };
    });
    res.json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getCalendarData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        b.booking_id AS id,
        b.booking_code,
        b.start_time,
        b.end_time,
        b.status,
        b.total_cost,
        f.name AS field_name,
        u.full_name AS customer_name
      FROM bookings b
      JOIN fields f ON b.field_id = f.field_id
      JOIN users u ON b.user_id = u.user_id
      ORDER BY b.start_time ASC;
    `;
    const [rows] = await db.execute(query) as [BookingRow[], any];
    const bookings: Booking[] = rows.map((row) => {
      const formatDate = (date: string | Date): string => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`;
      };

      return {
        id: row.id,
        booking_code: row.booking_code,
        start_time: formatDate(row.start_time),
        end_time: formatDate(row.end_time),
        status: row.status,
        total_cost: row.total_cost,
        field_name: row.field_name,
        customer_name: row.customer_name,
      };
    });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Hàm lấy lịch sử đặt sân của người dùng cho một sân cụ thể
export const getUserBookingsForField = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const fieldId = parseInt(req.params.field_id);
    const userId = req.user?.id;

    if (!fieldId || isNaN(fieldId)) {
      res.status(400).json({ message: 'Invalid field ID' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Lấy lịch sử đặt sân của người dùng cho sân cụ thể
    const [rows] = await pool.query(
      `SELECT b.*, f.name as field_name 
       FROM bookings b 
       JOIN fields f ON b.field_id = f.field_id 
       WHERE b.field_id = ? AND b.user_id = ? 
       ORDER BY b.start_time DESC`,
      [fieldId, userId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching user bookings for field:', error);
    res.status(500).json({ message: 'Server error' });
  }
};