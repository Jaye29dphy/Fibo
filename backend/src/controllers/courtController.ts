import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware"; // Import kiểu mở rộng

interface Field {
  field_id: number;
  name: string;
  price_per_hour: number;
  location: string;
  image_name: string;
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

    let query = `
      SELECT f.*, fi.image_name
      FROM fields f
      LEFT JOIN Field_Images fi ON f.field_id = fi.field_id AND fi.image_type = 'main'
    `;
    let params: any[] = [];

    if (sport_type) {
      query += " WHERE f.sport_type = ?";
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
    const { field_id } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT f.*, fi.image_name
      FROM fields f
      LEFT JOIN Field_Images fi ON f.field_id = fi.field_id AND fi.image_type = 'main'
      WHERE f.field_id = ?
      `,
      [field_id]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const field = rows[0] as Field;
      res.json(field);
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
      booking_code,
      user_id,
      end_time,
      total_cost,
      services,
      payment_method,
    } = req.body;

    if (!user_id) {
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
      "INSERT INTO Bookings (user_id, field_id, start_time, end_time, total_cost, booking_code, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  [user_id, field_id, start_time, end_time, total_cost, booking_code, payment_method, 'confirmed']
    );
    const bookingId = (bookingResult as any).insertId;

    // Tạo payment
    // const [paymentResult] = await pool.execute(
    //   "INSERT INTO Payments (booking_id, amount, payment_method, status) VALUES (?, ?, ?, 'completed')",
    //   [bookingId, total_cost, payment_method]
    // );

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

export const getFieldImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const [rows] = await pool.execute(
      "SELECT image_id, image_name, image_type, upload_date FROM Field_Images WHERE field_id = ? ORDER BY image_type ASC",
      [fieldId]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      res.status(404).json({ error: "No images found for this field" });
      return;
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching field images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

