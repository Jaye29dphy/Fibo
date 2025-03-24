// useGetFields.ts
import { API_ENDPOINTS } from "../constants/apiConfig";

// Hàm lấy dữ liệu sân bóng
export const getFields = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.GET_FIELDS); // Gọi API để lấy dữ liệu sân
    const data = await response.json();
    return data; // Trả về dữ liệu sân
  } catch (error) {
    console.error("Error fetching fields:", error);
    throw error; // Ném lỗi nếu có
  }
};
