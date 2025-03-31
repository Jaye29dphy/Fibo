<<<<<<< HEAD
import { API_ENDPOINTS } from "../constants/api";
=======
import { API_ENDPOINTS } from "../constants/apiConfig";

>>>>>>> cfeaae9b9794176343273d38d0341b24c9f60ba0
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Đăng nhập thất bại!");
    }
    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return null;
  }
};
