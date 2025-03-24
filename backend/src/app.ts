import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import courtRoutes from "./routes/courtRoutes";
import os from "os";

dotenv.config();
const app = express();

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/courts", courtRoutes);

const PORT: number = Number(process.env.PORT) || 5000;

// Lấy địa chỉ IP LAN nhưng bỏ qua IP từ adapter Radmin VPN
const localIP = Object.values(os.networkInterfaces())
  .flat()
  .find((iface: any) => 
    iface?.family === "IPv4" && 
    !iface.internal && 
    iface?.address.startsWith("192.168.") // Ưu tiên IP LAN chính, không chọn IP VPN
  )?.address;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Máy chủ được chạy ở cổng ${PORT}`);
  console.log(`Truy cập bằng địa chỉ:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- LAN: http://${localIP}:${PORT}`);
});

