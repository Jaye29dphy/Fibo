import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database"; // Thêm import để truy vấn database

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        email?: string;
        customer_id?: number; // Thêm customer_id
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            res.status(401).json({ error: "Unauthorized: No token provided" });
            return;
        }

        const tokenParts = authHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            res.status(401).json({ error: "Unauthorized: Invalid token format" });
            return;
        }

        const token = tokenParts[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: number;
            role: string;
            email?: string;
            customer_id?: number; // Thêm customer_id vào decoded
        };

        // Truy vấn database để lấy customer_id nếu cần
        const [users] = await pool.execute(
            "SELECT user_id AS id, role, email, customer_id FROM Users LEFT JOIN Customers ON Users.user_id = Customers.user_id WHERE Users.user_id = ?",
            [decoded.id]
        );
        const user = (users as any[])[0];

        if (!user) {
            res.status(401).json({ error: "Unauthorized: User not found" });
            return;
        }

        req.user = {
            id: user.id,
            role: user.role,
            email: user.email,
            customer_id: user.customer_id, // Gán customer_id từ database
        };
        next();
    } catch (err) {
        res.status(401).json({ error: "Unauthorized: Invalid token" });
        return;
    }
};