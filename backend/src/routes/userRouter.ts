import { Router, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database";
import { getAllUsers, updateUserStatus } from "../controllers/userController";
import { authenticate, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getAllUsers);
router.put("/:userId/status", authenticate, updateUserStatus);

// ✅ Hợp nhất xác thực mật khẩu và vô hiệu hóa tài khoản
const deactivateWithPasswordHandler: RequestHandler = async (req, res) => {
    const authReq = req as AuthRequest;
    try {
      const { password } = authReq.body;
      const userId = authReq.user?.id;
  
      const [users]: any = await pool.execute("SELECT * FROM users WHERE user_id = ?", [userId]);
      if (!Array.isArray(users) || users.length === 0) {
        res.status(404).json({ error: "Người dùng không tồn tại!" });
        return;
      }
  
      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: "Mật khẩu không chính xác!" });
        return;
      }
  
      await pool.execute("UPDATE users SET status = 'inactive' WHERE user_id = ?", [userId]);
      res.status(200).json({ message: "Tài khoản đã bị vô hiệu hóa!" });
    } catch (error) {
      console.error("Lỗi khi vô hiệu hóa có xác thực:", error);
      res.status(500).json({ error: "Lỗi máy chủ!" });
    }
  };
  

router.post("/deactivate", authenticate, deactivateWithPasswordHandler);

export default router;
