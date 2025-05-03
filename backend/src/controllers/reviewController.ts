import { Request, Response } from 'express';
import pool from '../config/database';
import { Review, RequestWithUser } from '../type/review';

export const getFieldReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lấy field_id từ params hoặc query
    const fieldIdParam = req.params.field_id;
    const fieldIdQuery = req.query.field_id;
    
    // Ưu tiên lấy từ params, nếu không có thì lấy từ query
    const fieldIdStr = fieldIdParam || fieldIdQuery;
    
    // Nếu không có field_id, trả về lỗi
    if (!fieldIdStr) {
      res.status(400).json({ message: 'Field ID is required. Provide it as a path parameter or query parameter.' });
      return;
    }
    
    const fieldId = parseInt(fieldIdStr as string);
    if (isNaN(fieldId)) {
      res.status(400).json({ message: 'Invalid field ID' });
      return;
    }

    const [rows] = await pool.query(
      `SELECT r.*, u.full_name, u.avatar 
       FROM reviews r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.field_id = ? 
       ORDER BY r.created_at DESC`,
      [fieldId]
    );
    const reviews = rows as Review[];

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addFieldReview = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Lấy field_id từ params, query, hoặc từ body
    const fieldIdParam = req.params.field_id;
    const fieldIdQuery = req.query.field_id;
    const fieldIdBody = req.body.field_id;
    
    // Ưu tiên lấy từ params, sau đó đến query, cuối cùng là body
    const fieldIdStr = fieldIdParam || fieldIdQuery || fieldIdBody;
    
    if (!fieldIdStr) {
      res.status(400).json({ message: 'Field ID is required' });
      return;
    }
    
    const fieldId = parseInt(fieldIdStr as string);
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (isNaN(fieldId) || !userId) {
      res.status(400).json({ message: 'Invalid field ID or user not authenticated' });
      return;
    }

    if (!rating || rating < 1 || rating > 5 || !comment) {
      res.status(400).json({ message: 'Rating (1-5) and comment are required' });
      return;
    }

    // Start a transaction to ensure data consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Sử dụng trực tiếp user_id thay vì customer_id
      const [result] = await connection.query(
        'INSERT INTO reviews (field_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
        [fieldId, userId, rating, comment]
      );
      const reviewId = (result as any).insertId;

      // Calculate the new average rating for the field
      const [ratingResults] = await connection.query(
        'SELECT AVG(rating) as avgRating FROM reviews WHERE field_id = ?',
        [fieldId]
      );
      
      const avgRating = (ratingResults as any)[0].avgRating;
      
      // Update the field rating in the fields table
      await connection.query(
        'UPDATE fields SET rating = ? WHERE field_id = ?',
        [avgRating, fieldId]
      );

      // Commit the transaction
      await connection.commit();
      
      // Return the new review data with user info
      const [userInfo] = await pool.query(
        'SELECT full_name, avatar FROM users WHERE user_id = ?',
        [userId]
      );
      
      res.status(201).json({ 
        review_id: reviewId,
        field_id: fieldId,
        user_id: userId,
        rating,
        comment,
        full_name: (userInfo as any)[0].full_name,
        avatar: (userInfo as any)[0].avatar,
        created_at: new Date().toISOString(),
        fieldRating: avgRating // Thêm field rating để cập nhật UI
      });
      
    } catch (error) {
      // If anything fails, roll back the transaction
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to recalculate field rating
export const recalculateFieldRating = async (fieldId: number): Promise<number> => {
  try {
    const [result] = await pool.query(
      'SELECT AVG(rating) as avgRating FROM reviews WHERE field_id = ?',
      [fieldId]
    );
    
    const avgRating = (result as any)[0].avgRating || 0;
    
    await pool.query(
      'UPDATE fields SET rating = ? WHERE field_id = ?',
      [avgRating, fieldId]
    );
    
    return avgRating;
  } catch (error) {
    console.error('Error recalculating field rating:', error);
    throw error;
  }
};