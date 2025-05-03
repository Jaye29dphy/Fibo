import { Request } from 'express';

export interface Review {
  id: number;
  field_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    role: string;
    [key: string]: any;
  };

  role?: string;
  email?: string;
  [key: string]: any;
}