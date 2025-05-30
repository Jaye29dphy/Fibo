import { Request, Response } from "express";
import pool from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";
import moment from "moment";

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
    const { fieldId } = req.params;
    console.log("[getFieldDetail] fieldId:", fieldId);

    if (!fieldId) {
      console.warn("[getFieldDetail] Missing fieldId in request params.");
      res.status(400).json({ error: "Missing fieldId" });
    }

    const [rows]: any = await pool.execute(
      `SELECT f.*, fi.image_name 
       FROM fields f 
       LEFT JOIN Field_Images fi ON f.field_id = fi.field_id 
       WHERE f.field_id = ?`,
      [fieldId]
    );

    console.log("[getFieldDetail] Query result:", rows);

    res.json(rows);
  } catch (error) {
    console.error("[getFieldDetail] Internal server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const getSubFields = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    console.log('[getSubFields] Fetching subfields for field ID:', fieldId);

    const [rows] = await pool.execute("SELECT * FROM SubFields WHERE field_id = ?", [fieldId]);
    console.log('[getSubFields] Found', Array.isArray(rows) ? rows.length : 0, 'subfields');

    res.json(rows);
  } catch (error) {
    console.error('[getSubFields] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    console.log('[getTimeSlots] Fetching time slots for field ID:', fieldId);

    const [rows] = await pool.execute(
      "SELECT ts.slot_id, ts.start_time, ts.end_time, fp.price " +
      "FROM fibo.timeslots ts " +
      "JOIN fibo.field_prices fp ON ts.slot_id = fp.slot_id " +
      "WHERE fp.field_id = ? " +
      "ORDER BY CASE " +
      "WHEN ts.start_time >= '05:00:00' THEN ts.start_time " +
      "ELSE CONCAT('24', ts.start_time) " +
      "END",
      [fieldId]
    );

    console.log('[getTimeSlots] Found', Array.isArray(rows) ? rows.length : 0, 'time slots');
    console.log('[getTimeSlots] Time slots data:', rows);

    res.json(rows);
  } catch (error) {
    console.error('[getTimeSlots] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOccupiedSlots = async (req: Request, res: Response): Promise<void> => {
  const { fieldId } = req.params;
  const { date } = req.query;

  console.log("➡️ API /occupied-slots được gọi với:");
  console.log("   fieldId:", fieldId);
  console.log("   date:", date);

  try {
    const [rows] = await pool.execute(
      `
      SELECT start_time, end_time
      FROM bookings
      WHERE field_id = ? AND DATE(start_time) = ? AND status = 'confirmed'

      UNION

      SELECT 
        jt.startTime AS start_time,
        jt.endTime AS end_time
      FROM pendingorders,
        JSON_TABLE(time_slots, '$[*]'
          COLUMNS (
            startTime VARCHAR(30) PATH '$.startTime',
            endTime VARCHAR(30) PATH '$.endTime'
          )
        ) AS jt
      WHERE field_id = ? AND date = ? AND status IN ('pending', 'paid')
      `,
      [fieldId, date, fieldId, date]
    );

    console.log("🧾 Raw rows trả về từ SQL:", rows);

    const occupiedSlots = (rows as any[])
      .filter(r => r.start_time && r.end_time)
      .map(r =>
        `${String(r.start_time).slice(11, 16)} - ${String(r.end_time).slice(11, 16)}`
      );

    console.log("🕒 occupiedSlots sau xử lý:", occupiedSlots);

    res.json(occupiedSlots);
  } catch (err) {
    console.error("❌ Lỗi khi truy vấn occupied slots:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    console.log('[getServices] Fetching services for field ID:', fieldId);

    const [rows] = await pool.execute("SELECT * FROM fibo.services WHERE field_id = ?", [fieldId]);

    console.log('[getServices] Found', Array.isArray(rows) ? rows.length : 0, 'services');
    console.log('[getServices] Services data:', rows);

    res.json(rows);
  } catch (error) {
    console.error('[getServices] Error:', error);
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

    // Tạo booking
    const [bookingResult] = await pool.execute(
      "INSERT INTO Bookings (user_id, field_id, start_time, end_time, total_cost, booking_code, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, field_id, start_time, end_time, total_cost, booking_code, payment_method, 'confirmed']
    );
    const bookingId = (bookingResult as any).insertId;
    // Thêm dịch vụ nếu có
    if (services && services.length > 0) {
      for (const service of services) {
        await pool.execute(
          "INSERT INTO Booking_Services (booking_id, service_id, quantity, total_price) VALUES (?, ?, ?, ?)",
          [bookingId, service.serviceId, service.quantity, service.quantity * (await getServicePrice(service.serviceId))]
        );
      }
    }

    res.status(201).json({ message: "Booking created successfully"});
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

export const createPendingOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      field_id,
      user_id,
      booking_code,
      date,
      time_slots,
      total_cost,
      services,
      payment_method,
    } = req.body;

    if (!user_id || !booking_code || !field_id || !total_cost) {
      res.status(400).json({ error: "Thiếu thông tin đơn hàng." });
      return;
    }

    const formattedDate = moment(date, "DD/MM").format("YYYY-MM-DD");

    await pool.execute(
      `INSERT INTO PendingOrders (user_id, field_id, booking_code, date, time_slots, total_cost, services, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        user_id,
        field_id,
        booking_code,
        formattedDate, // ✅ đã đúng định dạng YYYY-MM-DD
        JSON.stringify(time_slots),
        total_cost,
        JSON.stringify(services),
        payment_method,
      ]
    );


    res.status(201).json({ message: "Tạo đơn pending thành công" });
  } catch (error) {
    console.error("Lỗi tạo đơn hàng pending:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const sepayWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description } = req.body;

    if (!description || !amount) {
      res.status(400).send("Thiếu dữ liệu");
      return;
    }

    const [rows]: any = await pool.execute(
      "SELECT * FROM PendingOrders WHERE booking_code = ? AND status = 'pending'",
      [description.trim()]
    );

    if (!rows.length) {
      res.status(404).send("Không tìm thấy đơn hàng phù hợp");
      return;
    }

    const order = rows[0];
    if (Number(order.total_cost) !== Number(amount)) {
      res.status(400).send("Sai số tiền chuyển khoản");
      return;
    }

    const timeSlots = JSON.parse(order.time_slots);
    const services = JSON.parse(order.services);

    for (const slot of timeSlots) {
      await pool.execute(
        `INSERT INTO Bookings (user_id, field_id, start_time, end_time, total_cost, booking_code, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
        [
          order.user_id,
          order.field_id,
          slot.startTime,
          slot.endTime,
          order.total_cost / timeSlots.length,
          order.booking_code,
          order.payment_method,
        ]
      );
    }

    await pool.execute(
      "UPDATE PendingOrders SET status = 'paid' WHERE booking_code = ?",
      [order.booking_code]
    );

    res.status(200).send("Đã xác nhận thanh toán thành công");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Lỗi xử lý webhook");
  }
};

export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { booking_code } = req.params;

    const [rows]: any = await pool.execute(
      "SELECT status FROM PendingOrders WHERE booking_code = ?",
      [booking_code]
    );

    if (!rows.length) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng." });
      return;
    }

    res.status(200).json({ status: rows[0].status });
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { booking_code } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "Thiếu trạng thái để cập nhật." });
      return;
    }

    const [result]: any = await pool.execute(
      "UPDATE PendingOrders SET status = ? WHERE booking_code = ?",
      [status, booking_code]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng để cập nhật." });
      return;
    }

    res.status(200).json({ message: "Cập nhật trạng thái thành công." });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const cancelPendingOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { booking_code } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM PendingOrders WHERE booking_code = ?",
      [booking_code]
    );

    res.status(200).json({ message: "Đã xoá đơn pending." });
  } catch (error) {
    console.error("❌ Lỗi khi xoá đơn pending:", error);
    res.status(500).json({ error: "Không thể xoá đơn pending." });
  }

};


export const updateFieldStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const { status } = req.body;

    if (!['available', 'unavailable'].includes(status)) {
      res.status(400).json({ error: "Trạng thái không hợp lệ" });
      return;
    }

    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: "Chỉ admin mới có quyền cập nhật trạng thái sân" });
      return;
    }

    const [result]: any = await pool.execute(
      "UPDATE fields SET status = ? WHERE field_id = ?",
      [status, fieldId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy sân" });
      return;
    }

    res.status(200).json({ message: "Cập nhật trạng thái sân thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái sân:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// New API endpoint to add subfield
export const addSubField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId } = req.params;
    const { name } = req.body;

    console.log('[addSubField] Adding new subfield to field:', fieldId);

    // Validate input
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Insert new subfield
    const [result] = await pool.execute(
      "INSERT INTO SubFields (field_id, name, status) VALUES (?, ?, 'available')",
      [fieldId, name]
    );

    const insertId = (result as any).insertId;

    // Get the newly created subfield
    const [rows] = await pool.execute(
      "SELECT * FROM SubFields WHERE sub_field_id = ?",
      [insertId]
    );

    console.log('[addSubField] Subfield created with ID:', insertId);

    res.status(201).json((rows as any[])[0]);
  } catch (error) {
    console.error('[addSubField] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSubFieldStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, subFieldId } = req.params;
    const { status } = req.body;

    console.log('[updateSubFieldStatus] Updating subfield:', subFieldId, 'of field:', fieldId, 'to status:', status);

    // Validate input
    if (!status || !['available', 'unavailable'].includes(status)) {
      res.status(400).json({ error: "Trạng thái không hợp lệ" });
      return;
    }

    // Update subfield status
    const [result]: any = await pool.execute(
      "UPDATE SubFields SET status = ? WHERE sub_field_id = ? AND field_id = ?",
      [status, subFieldId, fieldId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy sân con" });
      return;
    }

    console.log('[updateSubFieldStatus] Subfield updated successfully');

    // Get the updated subfield
    const [rows] = await pool.execute(
      "SELECT * FROM SubFields WHERE sub_field_id = ?",
      [subFieldId]
    );

    res.status(200).json((rows as any[])[0]);
  } catch (error) {
    console.error('[updateSubFieldStatus] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New API endpoint to delete subfield
export const deleteSubField = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fieldId, subFieldId } = req.params;

    console.log('[deleteSubField] Deleting subfield:', subFieldId, 'from field:', fieldId);

    // Delete the subfield
    const [result]: any = await pool.execute(
      "DELETE FROM SubFields WHERE sub_field_id = ? AND field_id = ?",
      [subFieldId, fieldId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Không tìm thấy sân con" });
      return;
    }

    console.log('[deleteSubField] Subfield deleted successfully');

    res.status(200).json({ message: "Đã xóa sân con thành công" });
  } catch (error) {
    console.error('[deleteSubField] Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};