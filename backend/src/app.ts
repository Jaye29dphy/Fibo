import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courtRoutes from "./routes/courtRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import uploadRoutes from "./routes/uploadRoutes"; // ✅ Import upload routes
import os from "os";

dotenv.config();
const app = express();

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// 🔹 API Routes
app.use("/api/auth", authRoutes);
app.use("/courts", courtRoutes);
app.use("/bookings", calendarRoutes);
app.use("/upload-avatar", uploadRoutes);
app.use("/avatars", express.static("C:\\Users\\hungd\\OneDrive\\Desktop\\FiboImage\\avatar"));


const PORT: number = Number(process.env.PORT) || 5000;
const localIP = Object.values(os.networkInterfaces())
  .flat()
  .find((iface: any) =>
    iface?.family === "IPv4" &&
    !iface.internal &&
    iface?.address.startsWith("192.168.") // Ưu tiên IP LAN chính, không chọn IP VPN
  )?.address;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Máy chủ đang chạy ở cổng ${PORT}`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- LAN: http://${localIP}:${PORT}`);
});
