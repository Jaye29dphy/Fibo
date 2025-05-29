export const API_URL = "http://192.168.1.3:5000";


export const GITHUB_REPO = "https://api.github.com/repos/Jaye29dphy/Fibo";
export const FIELD_IMAGE_BASE_URL = `${API_URL}/fields`;
export const AVATAR_BASE_URL = `${API_URL}/avatars`;

export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  GET_USER: `${API_URL}/api/auth/me`,
  SEND_OTP: `${API_URL}/api/auth/send-otp`,
  CHANGE_PASSWORD: `${API_URL}/api/auth/change-password`,

  // General endpoints
  GET_CALENDAR: `${API_URL}/api/calendar`,
  GET_VERSION: `${GITHUB_REPO}/releases/latest`,
  UPLOAD_AVATAR: `${API_URL}/upload-avatar`,
  GET_ALL_USERS: `${API_URL}/api/users`,
  DEACTIVATE_WITH_PASSWORD: `${API_URL}/api/users/deactivate`,
  UPDATE_USER_INFO: (userId: number | string) => `${API_URL}/api/auth/${userId}`,

  // Customer endpoints (courts) - Existing endpoints for Customer app
  GET_FIELDS: `${API_URL}/courts`,
  GET_FIELD_DETAIL: `${API_URL}/courts`,
  GET_ORDER: `${API_URL}/courts/bookings`,
  CREATE_PENDING_ORDER: `${API_URL}/courts/orders/pending`,
  DELETE_PENDING_ORDER: `${API_URL}/courts/orders/delete-pending`,
  GET_ORDER_STATUS: `${API_URL}/courts/orders/status`,
  UPDATE_ORDER_STATUS: `${API_URL}/courts/orders/update-status`,
  GET_OCCUPIED_SLOTS: (fieldId: string, date: string) => `${API_URL}/courts/fields/${fieldId}/occupied-slots?date=${date}`,


  // Owner endpoints (fields) - New endpoints for Owner app
  REGISTER_FIELD: `${API_URL}/api/fields/register`,
  GET_OWNER_FIELDS: `${API_URL}/api/fields/owner`,
  GET_OWNER_FIELD_DETAIL: `${API_URL}/api/fields`,
  UPDATE_OWNER_FIELD: `${API_URL}/api/fields`,

  // Owner field sub-data endpoints (using courts for now)
  GET_OWNER_FIELD_SUB_FIELDS: `${API_URL}/courts`,
  GET_OWNER_FIELD_SERVICES: `${API_URL}/courts`,
  GET_OWNER_FIELD_TIME_SLOTS: `${API_URL}/courts`,
  GET_TIME_SLOTS: `${API_URL}/api/fields/time-slots`,
  UPDATE_FIELD_STATUS: `${API_URL}/courts/:fieldId/status`,

  // Notifications
  GET_NOTIFICATIONS: `${API_URL}/api/auth/notifications`,
  GET_NOTIFICATION: `${API_URL}/api/notifications/notifications`,
  SEND_NOTIFICATION: `${API_URL}/api/notifications/send`,

  // Reviews
  GET_REVIEWS: `${API_URL}/api/reviews/fields`,

  // Owner profile and subscription
  UPDATE_OWNER_PROFILE: `${API_URL}/api/owner/profile`,
  GET_OWNER_SUBSCRIPTION: `${API_URL}/api/owner/subscription`,
  PURCHASE_SUBSCRIPTION: `${API_URL}/api/owner/subscription`,
  GET_SUBSCRIPTION_PLANS: `${API_URL}/api/subscriptions/plans`,
  GET_SUBSCRIPTION_HISTORY: `${API_URL}/api/subscriptions/history`,
  CREATE_SUBSCRIPTION_PENDING_ORDER: `${API_URL}/api/subscription-orders/pending`,
  DELETE_SUBSCRIPTION_PENDING_ORDER: `${API_URL}/api/subscription-orders/delete-pending`,
  GET_SUBSCRIPTION_ORDER_STATUS: `${API_URL}/api/subscription-orders/status`,
  UPDATE_SUBSCRIPTION_ORDER_STATUS: `${API_URL}/api/subscription-orders/update-status`,
  GET_ALL_SUBSCRIPTIONS: `${API_URL}/api/subscriptions/all`,
};