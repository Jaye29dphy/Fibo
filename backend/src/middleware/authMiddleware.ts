import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: { id: number; role: string; email?: string }; // ✅ Cho phép email là tùy chọn
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            res.status(401).json({ error: "Unauthorized: No token provided" });
            return; // ✅ Thêm return để dừng hàm
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            res.status(401).json({ error: "Unauthorized: Invalid token format" });
            return; // ✅ Thêm return để dừng hàm
        }

        const token = tokenParts[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: string; email?: string };

        req.user = decoded;
        next(); // ✅ Bảo đảm gọi next()
    } catch (err) {
        res.status(401).json({ error: "Unauthorized: Invalid token" });
        return; // ✅ Thêm return để dừng hàm
    }
};
