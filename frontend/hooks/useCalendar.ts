// hooks/useCalendar.ts
import { API_ENDPOINTS } from "../constants/apiConfig";
import { useState, useEffect } from "react";

// Định nghĩa kiểu Booking (đồng bộ với các file khác)
export interface Booking {
  id: string; // Thay đổi từ number thành string
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: string; // Thay đổi từ number thành string
}

// Định nghĩa kiểu trả về của hook
export interface UseCalendarReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refreshBookings: () => void;
}

// Định nghĩa kiểu dữ liệu thô từ API (nếu API trả về number)
export interface RawBooking {
  id: number;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: number;
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
      
      // Chuyển đổi dữ liệu thô thành kiểu Booking
      const data: Booking[] = rawData.map((item) => ({
        ...item,
        id: String(item.id), // Chuyển number thành string
        field_id: String(item.field_id), // Chuyển number thành string
      }));

      console.log("Fetched bookings:", data);
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