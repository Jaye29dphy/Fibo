import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database"; // Kết nối database

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
        email?: string;
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
        };

        const [users] = await pool.execute(
            "SELECT user_id AS id, role, email FROM users WHERE user_id = ?",
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
        };
        next();
    } catch (err) {
        res.status(401).json({ error: "Unauthorized: Invalid token" });
        return;
    }
};
