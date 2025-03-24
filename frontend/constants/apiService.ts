// apiService.ts
import { API_ENDPOINTS } from "./apiConfig"; // Định nghĩa các endpoint ở đây
import AsyncStorage from "@react-native-async-storage/async-storage";

const fetchAPI = async (endpoint: string, method = "GET", body?: any) => {
  const token = await AsyncStorage.getItem("token"); // Lấy token từ AsyncStorage

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`; // Thêm token vào headers nếu có

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(data.error || "Lỗi khi gọi API");
    }

    return data; // Trả về dữ liệu sau khi kiểm tra trạng thái thành công
  } catch (error) {
    console.error("Error fetching API:", error);
    throw error; // Throw lại lỗi để xử lý ở nơi gọi hàm
  }
};

// Login API (POST)
export const loginUser = async (email: string, password: string) => {
  return fetchAPI(API_ENDPOINTS.LOGIN, "POST", { email, password });
};

// Lấy thông tin người dùng (GET)
export const getUserInfo = async () => {
  console.log("Calling getUserInfo API...");
  return fetchAPI(API_ENDPOINTS.GET_USER); // Gọi trực tiếp hàm fetchAPI mà không lặp lại việc lấy token
};
// gửi otp
export const sendOtp = async (email: string) => {
    return fetchAPI(API_ENDPOINTS.SEND_OTP, "POST", { email });
  };
//thay đổi mk
export const changePassword = async (email: string, newPassword: string, otp: string) => {
    return fetchAPI(API_ENDPOINTS.CHANGE_PASSWORD, "POST", { email, newPassword, otp });
  };
// đăng ký tài khoản
  export const registerUser = async (
    fullName: string,
    email: string,
    phone: string,
    password: string,
    role: string
  ) => {
    return fetchAPI(API_ENDPOINTS.REGISTER, "POST", { full_name: fullName, email, phone, password, role });
  };