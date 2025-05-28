export const API_URL = "http://192.168.1.3:5000";

export const GITHUB_REPO = "https://api.github.com/repos/Jaye29dphy/Fibo";
export const FIELD_IMAGE_BASE_URL = `${API_URL}/fields`;
export const AVATAR_BASE_URL = `${API_URL}/avatars`;

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  GET_USER: `${API_URL}/api/auth/me`,
  SEND_OTP: `${API_URL}/api/auth/send-otp`,
  CHANGE_PASSWORD: `${API_URL}/api/auth/change-password`,
  GET_FIELDS: `${API_URL}/courts`,
  GET_FIELD_DETAIL: `${API_URL}/courts`,
  GET_CALENDAR: `${API_URL}/api/calendar`,
  GET_VERSION: `${GITHUB_REPO}/releases/latest`,
  UPLOAD_AVATAR: `${API_URL}/upload-avatar`,
  GET_ALL_USERS: `${API_URL}/api/users`,
  DEACTIVATE_WITH_PASSWORD: `${API_URL}/api/users/deactivate`,
  REGISTER_FIELD: `${API_URL}/api/fields/register`,
  GET_ORDER: `${API_URL}/courts/bookings`,
  GET_OWNER_FIELDS: `${API_URL}/api/fields/owner`,
  GET_NOTIFICATIONS: `${API_URL}/api/auth/notifications`,
  GET_NOTIFICATION: `${API_URL}/api/notifications/notifications`,
  GET_TIME_SLOTS: `${API_URL}/api/fields/time-slots`, 
  SEND_NOTIFICATION_ALL: `${API_URL}/api/notifications/send-all`,
  GET_REVIEWS: `${API_URL}/api/reviews/fields`, 
  CREATE_PENDING_ORDER: `${API_URL}/courts/orders/pending`,
  DELETE_PENDING_ORDER: `${API_URL}/courts/orders/delete-pending`,
  GET_ORDER_STATUS: `${API_URL}/courts/orders/status`,
  UPDATE_ORDER_STATUS: `${API_URL}/courts/orders/update-status`,  
  UPDATE_FIELD_STATUS: `${API_URL}/courts/:fieldId/status`,  
  GET_OWNER_SUBSCRIPTION: `${API_URL}/api/owner/subscription`,
  PURCHASE_SUBSCRIPTION: `${API_URL}/api/owner/subscription`, 
  GET_SUBSCRIPTION_PLANS: `${API_URL}/api/subscriptions/plans`,
  GET_SUBSCRIPTION_HISTORY: `${API_URL}/api/subscriptions/history`,
  CREATE_SUBSCRIPTION_PENDING_ORDER: `${API_URL}/api/subscription-orders/pending`,
  DELETE_SUBSCRIPTION_PENDING_ORDER: `${API_URL}/api/subscription-orders/delete-pending`,
  GET_SUBSCRIPTION_ORDER_STATUS: `${API_URL}/api/subscription-orders/status`,
  UPDATE_SUBSCRIPTION_ORDER_STATUS: `${API_URL}/api/subscription-orders/update-status`,
  UPDATE_OWNER_PROFILE: `${API_URL}/api/owner/profile`,
  UPDATE_USER_INFO: (userId: number | string) => `${API_URL}/api/auth/${userId}`,
};