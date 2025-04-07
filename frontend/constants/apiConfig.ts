export const API_URL = "http://192.168.1.8:5000"; // Đổi IP của máy chủ
export const GITHUB_REPO = "https://api.github.com/repos/Jaye29dphy/Fibo"; // Thay owner & repo

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  GET_USER: `${API_URL}/api/auth/me`,
  SEND_OTP: `${API_URL}/api/auth/send-otp`,
  CHANGE_PASSWORD: `${API_URL}/api/auth/change-password`,
  GET_FIELDS: `${API_URL}/courts`,
  GET_FIELD_DETAIL: `${API_URL}/courts`,
  GET_CALENDAR: `${API_URL}/bookings`,
  GET_VERSION: `${GITHUB_REPO}/releases/latest`,
  UPLOAD_AVATAR: `${API_URL}/upload-avatar`,
};
