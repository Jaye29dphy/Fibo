import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware"; // Import kiểu mở rộng

interface Field {
  id: number;
  name: string;
  price: number;
  location: string;
  image: string;
  description: string;
}

export const createCourt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, price } = req.body;
    const owner_id = req.user?.id;

    if (!owner_id) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    await pool.execute(
      "INSERT INTO Fields (name, location, price_per_hour, owner_id) VALUES (?, ?, ?, ?)",
      [name, location, price, owner_id]
    );

    res.status(201).json({ message: "Court created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport_type } = req.query;

    let query = "SELECT * FROM fields";
    let params: any[] = [];

    if (sport_type) {
      query += " WHERE sport_type = ?";
      params.push(sport_type);
    }

    const [rows] = await pool.execute(query, params);

    if (Array.isArray(rows) && rows.length === 0) {
      res.status(404).json({ error: "No fields found" });
      return;
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getFieldDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Lấy ID của sân từ params

    const [rows] = await pool.execute("SELECT * FROM fields WHERE field_id = ?", [id]); // Lấy sân theo ID

    if (Array.isArray(rows) && rows.length > 0) { // Kiểm tra nếu rows là mảng và có kết quả
      const field = rows[0] as Field; // Ép kiểu cho dữ liệu

      res.json(field); // Trả về sân chi tiết
    } else {
      res.status(404).json({ error: "Field not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const [rows] = await pool.execute("SELECT * FROM SubFields WHERE field_id = ?", [fieldId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const [rows] = await pool.execute(
      "SELECT ts.slot_id, ts.start_time, ts.end_time, fp.price " +
      "FROM TimeSlots ts " +
      "JOIN Field_Prices fp ON ts.slot_id = fp.slot_id " +
      "WHERE fp.field_id = ?",
      [fieldId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const [rows] = await pool.execute("SELECT * FROM Services WHERE field_id = ?", [fieldId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// courtController.ts

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      field_id,
      start_time,
      end_time,
      total_cost,
      services,
      payment_method,
    } = req.body;
    const customer_id = req.user?.customer_id; // Lấy từ token/user info

    if (!customer_id) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    // Kiểm tra khung giờ đã được đặt chưa
    const [existingBookings] = await pool.execute(
      "SELECT * FROM Bookings WHERE field_id = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?)) AND status != 'cancelled'",
      [field_id, start_time, start_time, end_time, end_time]
    );

    if (Array.isArray(existingBookings) && existingBookings.length > 0) {
      res.status(400).json({ error: "Khung giờ này đã được đặt." });
      return;
    }

    // Tạo booking
    const [bookingResult] = await pool.execute(
      "INSERT INTO Bookings (customer_id, field_id, start_time, end_time, total_cost, status) VALUES (?, ?, ?, ?, ?, 'confirmed')",
      [customer_id, field_id, start_time, end_time, total_cost]
    );
    const bookingId = (bookingResult as any).insertId;

    // Tạo payment
    const [paymentResult] = await pool.execute(
      "INSERT INTO Payments (booking_id, amount, payment_method, status) VALUES (?, ?, ?, 'completed')",
      [bookingId, total_cost, payment_method]
    );

    // Thêm dịch vụ nếu có
    if (services && services.length > 0) {
      for (const service of services) {
        await pool.execute(
          "INSERT INTO Booking_Services (booking_id, service_id, quantity, total_price) VALUES (?, ?, ?, ?)",
          [bookingId, service.serviceId, service.quantity, service.quantity * (await getServicePrice(service.serviceId))]
        );
      }
    }

    res.status(201).json({ message: "Booking created successfully", booking_id: bookingId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Hàm phụ để lấy giá dịch vụ (giả định)
const getServicePrice = async (serviceId: number) => {
  const [rows] = await pool.execute("SELECT price FROM Services WHERE service_id = ?", [serviceId]);
  return (rows as any[])[0]?.price || 0;
};

export const generateQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accountNo, accountName, bankId, amount, addInfo } = req.body;
    const response = await fetch("https://api.vietqr.io/v2/generate", {
      method: "POST",
      headers: {
        "x-client-id": "YOUR_CLIENT_ID",
        "x-api-key": "YOUR_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId: bankId,
        amount,
        addInfo,
        template: "compact",
      }),
    });

    const data = await response.json();
    res.status(200).json({ qrCodeUrl: data.data.qrDataURL });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};