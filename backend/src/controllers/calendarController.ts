// controllers/calendarController.ts
import { Request, Response } from 'express';
import db from '../config/database';

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  field_id: number;
}

interface BookingRow {
  booking_id: number;
  customer_id: number;
  field_id: number;
  start_time: string | Date; // Allow for Date object from MySQL
  end_time: string | Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

export const getCalendarBookings = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT booking_id, customer_id, field_id, start_time, end_time, status 
      FROM bookings
      ORDER BY start_time ASC;
    `;
    const [rows] = await db.execute(query) as [BookingRow[], any];
    const bookings: Booking[] = rows.map((row) => {
      // Format the date to "YYYY-MM-DD HH:mm:ssZ"
      const formatDate = (date: string | Date): string => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`;
      };

      return {
        id: row.booking_id,
        start_time: formatDate(row.start_time),
        end_time: formatDate(row.end_time),
        status: row.status,
        field_id: row.field_id,
      };
    });
    res.json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu lịch hẹn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};