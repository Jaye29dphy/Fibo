// hooks/useCalendar.ts
import { API_ENDPOINTS } from "../constants/apiConfig";
import { useState, useEffect } from "react";

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: number;
}

export const useCalendar = () => {
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
      const data: Booking[] = await response.json();
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