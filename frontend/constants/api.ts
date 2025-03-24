export const API_URL = "http://192.168.2.3:5000"; // Đổi IP của máy chủ

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  GET_USER: `${API_URL}/api/auth/user`,
  GET_FIELDS: `${API_URL}/courts`, 
  GET_FIELD_DETAIL: `${API_URL}/courts`,
};
