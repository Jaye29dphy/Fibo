import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courtRoutes from "./routes/courtRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRouter";
import fieldRoutes from "./routes/fieldRoutes";
import os from "os";
import imageMiddleware from "./middleware/imageMiddleware";
import notificationsRoutes from "./routes/notificationsRoutes";

dotenv.config();
const app = express();

// Cấu hình CORS nâng cao để cho phép các thiết bị mobile truy cập API
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Thêm endpoint kiểm tra sức khỏe
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'API server is running properly'
  });
});

// Sử dụng middleware để xử lý route /fields
app.use("/fields", imageMiddleware, express.static("D:\\img\\field"));

// Sử dụng middleware để xử lý route /avatars
app.use("/avatars", express.static("D:\\img\\ava"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/courts", courtRoutes);
app.use("/bookings", calendarRoutes);
app.use("/upload-avatar", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/notifications", notificationsRoutes);

const PORT: number = Number(process.env.PORT) || 5000;
const localIP = Object.values(os.networkInterfaces())
  .flat()
  .find((iface: any) =>
    iface?.family === "IPv4" &&
    !iface.internal &&
    iface?.address.startsWith("192.168.")
  )?.address;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Máy chủ đang chạy ở cổng ${PORT}`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- LAN: http://${localIP}:${PORT}`);
});