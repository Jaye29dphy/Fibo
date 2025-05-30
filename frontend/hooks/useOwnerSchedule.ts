// hooks/useOwnerSchedule.ts
import { API_ENDPOINTS } from "../constants/apiConfig";
import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa kiểu Booking cho Owner
export interface OwnerBooking {
  booking_id: number;
  booking_code: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  field_id: number;
  field_name: string;
  field_description?: string;
  user_id: number;
  customer_name?: string;
  total_cost?: number;
  payment_method?: string;
  booking_date?: string; // Added booking_date field
}

// Định nghĩa kiểu trả về của hook
export interface UseOwnerScheduleReturn {
  bookings: OwnerBooking[];
  loading: boolean;
  error: string | null;
  refreshBookings: () => void;
  updateBookingStatus: (bookingCode: string, status: string) => Promise<boolean>;
}

export const useOwnerSchedule = (): UseOwnerScheduleReturn => {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      console.log('Fetching owner bookings from:', API_ENDPOINTS.GET_OWNER_FIELD_BOOKINGS);

      // Create API endpoint for owner bookings
      const response = await fetch(`${API_ENDPOINTS.GET_OWNER_FIELD_BOOKINGS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi lấy dữ liệu lịch đặt sân: ${response.status} - ${errorText}`);
      }

      const data: OwnerBooking[] = await response.json();
      console.log("Owner bookings data received:", data.length, "bookings");

      // Process data if available
      if (Array.isArray(data)) {
        // Ensure all date fields are properly formatted
        const processedData = data.map(booking => {
          // Ensure booking_date is available
          if (!booking.booking_date && booking.start_time) {
            const startDate = booking.start_time.split(' ')[0] ||
              booking.start_time.split('T')[0];
            booking.booking_date = startDate;
          }
          return booking;
        });

        console.log("Processed bookings data:", processedData.length, "bookings");
        if (processedData.length > 0) {
          console.log("Sample booking date:", processedData[0].booking_date);
          console.log("Sample start time:", processedData[0].start_time);
        }

        setBookings(processedData);
      } else {
        console.log("No bookings found or unexpected data format");
        setBookings([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };  // Update booking status function
  const updateBookingStatus = async (bookingCode: string, status: string): Promise<boolean> => {
    try {
      console.log(`Updating booking ${bookingCode} to status ${status}`);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const endpoint = `${API_ENDPOINTS.UPDATE_BOOKING_STATUS}/${bookingCode}/status`;
      console.log(`Making API request to: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }
      );

      const responseData = await response.json();
      console.log("API response:", responseData);

      if (!response.ok) {
        throw new Error(`Lỗi khi cập nhật trạng thái: ${response.status} - ${responseData.message || JSON.stringify(responseData)}`);
      }

      // Update the local state directly to avoid a full refresh
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.booking_code === bookingCode ? { ...booking, status: status as any } : booking
        )
      );

      // Also refresh bookings from the server
      console.log("Booking status updated successfully, refreshing bookings list");
      await fetchBookings();
      return true;
    } catch (err) {
      console.error("Update booking status error:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    refreshBookings: fetchBookings,
    updateBookingStatus
  };
};