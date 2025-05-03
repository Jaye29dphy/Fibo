// hooks/useCalendar.ts
import { API_ENDPOINTS } from "../constants/apiConfig";
import { useState, useEffect } from "react";

// Định nghĩa kiểu Booking
export interface Booking {
  fieldName: any;
  customerName: any;
  booking_code: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: string;
  total_cost?: number; // Thêm optional để tránh lỗi nếu không có
  payment_method?: string; // Thêm optional để tránh lỗi nếu không có
  field_name?: string; // Thêm trường từ API
}

// Định nghĩa kiểu trả về của hook
export interface UseCalendarReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refreshBookings: () => void;
}

// Định nghĩa kiểu dữ liệu thô từ API
export interface RawBooking {
  booking_code: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: number;
  field_name?: string;  // Thêm trường từ API
  total_cost?: number; // Thêm optional
  payment_method?: string; // Thêm optional
}

export const useCalendar = (): UseCalendarReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching from:", API_ENDPOINTS.GET_CALENDAR);
      const response = await fetch(API_ENDPOINTS.GET_CALENDAR);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi lấy dữ liệu lịch hẹn: ${response.status} - ${errorText}`);
      }
      const rawData: RawBooking[] = await response.json();
      console.log("Raw API response:", rawData); // Thêm log để kiểm tra dữ liệu thô
      
      // Chuyển đổi dữ liệu thô thành kiểu Booking
      const data: Booking[] = rawData.map((item) => ({
        ...item,
        booking_code: String(item.booking_code),
        field_id: String(item.field_id),
        total_cost: item.total_cost ?? undefined,
        payment_method: item.payment_method ?? undefined,
        fieldName: item.field_name || String(item.field_id), // Sử dụng field_name nếu có, nếu không dùng field_id
        customerName: item.booking_code,
      }));

      console.log("Transformed bookings:", data); // Thêm log để kiểm tra dữ liệu sau khi chuyển đổi
      setBookings(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return { bookings, loading, error, refreshBookings: fetchBookings };
};