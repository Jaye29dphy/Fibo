// apiService.ts
import { API_ENDPOINTS, API_URL, AVATAR_BASE_URL } from "./apiConfig"; 
import AsyncStorage from "@react-native-async-storage/async-storage";


export const fetchAPI = async (
  endpoint: string,
  method = "GET",
  body?: any,
  isFormData = false
) => {
  const token = await AsyncStorage.getItem("token");

  const headers: HeadersInit = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      // ✅ Ưu tiên lấy message nếu có
      throw new Error(data.message || data.error || "Lỗi khi gọi API");
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching API:", error);
    throw new Error(error.message || "Lỗi hệ thống");
  }
};


export const uploadAvatar = async (formData: FormData): Promise<{ avatar: string }> => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("Token:", token);

    // Debug: Log FormData entries
    for (const [key, value] of formData.entries()) {
      console.log(`FormData entry: ${key}=${value}`);
    }

    const response = await fetch(API_ENDPOINTS.UPLOAD_AVATAR, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    const data = await response.json();
    console.log("API response data:", data);

    if (!response.ok) {
      console.error("Lỗi upload avatar:", data);
      throw new Error(data.error || "Lỗi khi upload ảnh");
    }

    const avatarUrl = `${AVATAR_BASE_URL}/${data.avatar}?t=${Date.now()}`;
    console.log("Constructed avatar URL:", avatarUrl);
    return { avatar: avatarUrl };
  } catch (error) {
    console.error("Lỗi khi gọi API upload avatar:", error);
    throw error;
  }
};

export const formatCurrency = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "Giá không khả dụng";

  const formattedNum = num.toFixed(2).replace(/\.00$/, "");
  const parts = formattedNum.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${parts.join(",")} VND/giờ`;
};

export const formatServicePr = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "Giá không khả dụng";

  const formattedNum = num.toFixed(2).replace(/\.00$/, "");
  const parts = formattedNum.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${parts.join(",")} VND`;
};

export const getStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
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
// lịch của tôi
export const getCalendarData = async () => {
  try {
    const data = await fetchAPI(API_ENDPOINTS.GET_CALENDAR, "GET");
    return data.map((booking: any) => ({
      id: booking.id,
      user_id: booking.user_id,
      fieldId: booking.fieldId,
      fieldName: booking.fieldName,
      customerName: booking.customerName,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      totalCost: booking.totalCost,
    }));
  } catch (error) {
    console.error("Lỗi lấy dữ liệu từ API:", error);
    return [];
  }
};

// Interface để định nghĩa cấu trúc dữ liệu của release từ GitHub
interface GitHubRelease {
  tag_name: string;
  published_at: string;
  name?: string;
  body?: string;
}

// Hàm lấy release mới nhất từ GitHub
export const fetchLatestRelease = async (): Promise<GitHubRelease | null> => {
  try {
    const response = await fetch(API_ENDPOINTS.GET_VERSION, {
      headers: {
        Accept: 'application/vnd.github.v3+json', // Yêu cầu của GitHub API
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub release: ${response.statusText}`);
    }

    const release: GitHubRelease = await response.json();
    return release;
  } catch (error) {
    console.error('Error fetching GitHub release:', error);
    return null;
  }
};

// Lấy danh sách sân theo loại thể thao

export const getFields = async (sportType: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}?sport_type=${encodeURIComponent(sportType)}`;
  return fetchAPI(url, "GET");
};

// Lấy danh sách SubFields theo field_id
export const getSubFields = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/subfields`; 
  return fetchAPI(url, "GET");
};

// Lấy danh sách TimeSlots và giá theo field_id
export const getTimeSlots = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/time-slots`; 
  return fetchAPI(url, "GET");
};

// Lấy danh sách Services theo field_id
export const getServices = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/services`; 
  return fetchAPI(url, "GET");
};

// apiService.ts
export const createBooking = async (
  fieldId: string,
  userId: string,
  bookingCode: string,
  startTime: string,
  endTime: string,
  totalCost: number,
  services: { serviceId: number; quantity: number }[], // Thay đổi ở đây
  paymentMethod: string
) => {
  const url = `${API_ENDPOINTS.GET_ORDER}`;
  const body = {
    field_id: fieldId,
    user_id: userId,
    booking_code: bookingCode,
    start_time: startTime,
    end_time: endTime,
    total_cost: totalCost,
    services,
    payment_method: paymentMethod,
  };
  return fetchAPI(url, "POST", body);
};

export const getAllUsers = async () => {
  return fetchAPI(API_ENDPOINTS.GET_ALL_USERS);
};

export const deactivateAccountWithPassword = async (password: string) => {
  return fetchAPI(API_ENDPOINTS.DEACTIVATE_WITH_PASSWORD, "POST", { password });
};


export const getNotifications = async () => {
  return fetchAPI(API_ENDPOINTS.GET_NOTIFICATIONS, "GET");
};


export const getNotification = async () => {
  return fetchAPI(API_ENDPOINTS.GET_NOTIFICATION, "GET");
}


export const sendNotificationToUsers = async (message: string, userGroup: 'all' | 'owner' | 'customer') => {
  const url = `${API_URL}/api/notifications/send`;
  return fetchAPI(url, "POST", { message, userGroup });
};

export const createPendingOrder = async (
  fieldId: string,
  userId: string,
  bookingCode: string,
  date: string,
  timeSlots: { startTime: string; endTime: string }[],
  totalCost: number,
  services: { serviceId: number; quantity: number }[],
  paymentMethod: string
) => {
  const body = {
    field_id: fieldId,
    user_id: userId,
    booking_code: bookingCode,
    date,
    time_slots: timeSlots,
    total_cost: totalCost,
    services,
    payment_method: paymentMethod,
  };

  return fetchAPI(API_ENDPOINTS.CREATE_PENDING_ORDER, "POST", body);
};

export const createSubscriptionPendingOrder = async (
  userId: string,
  subscriptionCode: string,
  plan: string, // plan_code e.g. 'classic', 'pro'
  planDisplayName: string, // plan_name e.g. 'Gói Standard', 'Gói Pro' 
  months: number,
  totalCost: number,
  paymentMethod: string = "banking"
) => {
  const body = {
    user_id: userId,
    subscription_code: subscriptionCode,
    plan, // This is plan_code
    plan_display_name: planDisplayName, // This is for snapshotting the display name
    months,
    total_cost: totalCost,
    payment_method: paymentMethod
  };

  return fetchAPI(API_ENDPOINTS.CREATE_SUBSCRIPTION_PENDING_ORDER, "POST", body);
};


export const getOrderStatus = async (bookingCode: string) => {
  const url = `${API_ENDPOINTS.GET_ORDER_STATUS}/${bookingCode}`;
  return fetchAPI(url, "GET");
};

export const updateOrderStatus = async (bookingCode: string, status: string) => {
  const url = `${API_ENDPOINTS.UPDATE_ORDER_STATUS}/${bookingCode}`;
  return fetchAPI(url, "POST", { status });
};

export const deletePendingOrder = async (bookingCode: string) => {
  const url = `${API_ENDPOINTS.DELETE_PENDING_ORDER}/${bookingCode}`;
  return fetchAPI(url, "DELETE");
};

export const getSubscriptionOrderStatus = async (subscriptionCode: string) => {
  const url = `${API_ENDPOINTS.GET_SUBSCRIPTION_ORDER_STATUS}/${subscriptionCode}`;
  return fetchAPI(url, "GET");
};

export const updateSubscriptionOrderStatus = async (orderId: string, status: string) => {
  return fetchAPI(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION_ORDER_STATUS}/${orderId}`, "POST", { new_status: status });
};

export const deleteSubscriptionPendingOrder = async (subscriptionCode: string) => {
  const url = `${API_ENDPOINTS.DELETE_SUBSCRIPTION_PENDING_ORDER}/${subscriptionCode}`;
  return fetchAPI(url, "DELETE");
};

export const updateFieldStatus = async (fieldId: string, status: 'available' | 'unavailable') => {
  const url = `${API_URL}/api/fields/${fieldId}/status`;
  return fetchAPI(url, "PUT", { status });
};


export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'banned') => {
  const url = `${API_URL}/api/users/${userId}/status`;
  return fetchAPI(url, "PUT", { status });
};

export const markNotificationAsRead = async (notificationId: number) => {
  const url = `${API_URL}/api/notifications/notifications/${notificationId}/read`;
  return fetchAPI(url, "PUT");
};


export const getAllReviews = async () => {
  const url = `${API_URL}/api/reviews`;
  return fetchAPI(url, "GET");
};


export const deleteReview = async (reviewId: number) => {
  const url = `${API_URL}/api/reviews/${reviewId}`;
  return fetchAPI(url, "DELETE");
};

export const updateUserInfo = async (
  userId: number,
  updatedData: { full_name: string; email: string; phone: string; business_name?: string; address?: string }
) => {
  // Nếu là owner, sử dụng endpoint updateProfile của owner
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("Not authorized");
  }
  
  // Giải mã token để lấy vai trò của người dùng
  const decoded = decodeToken(token);
  if (decoded && decoded.role === "owner") {
    return fetchAPI(API_ENDPOINTS.UPDATE_OWNER_PROFILE, "PUT", updatedData);
  }
  
  // Nếu không phải owner, sử dụng endpoint update user thông thường
  return fetchAPI(API_ENDPOINTS.UPDATE_USER_INFO(userId), "PUT", updatedData);
};

// Hàm phụ trợ để giải mã token JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Subscription related functions
export const getOwnerSubscription = async () => {
  try {
    const response = await fetchAPI(API_ENDPOINTS.GET_OWNER_SUBSCRIPTION, "GET");
    // Transform dates to proper format if needed
    if (response.start_date) {
      response.start_date = new Date(response.start_date).toISOString();
    }
    if (response.end_date) {
      response.end_date = new Date(response.end_date).toISOString();
    }
    return response;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    // Return Basic plan if no subscription found
    return {
      subscription_id: 0,
      owner_id: 0,
      plan_id: 1, 
      plan_name: "Basic",
      price: 0,
      max_fields: 1,
      start_date: null,
      end_date: null,
      status: "active",
      description: "Basic plan for small field owners"
    };
  }
};

export const purchaseSubscription = async (plan: string, months: number) => {
  const response = await fetchAPI(API_ENDPOINTS.PURCHASE_SUBSCRIPTION, "POST", {
    plan,
    months
  });
  
  // Return the subscription data from the response
  return response.subscription || response;
};

export const getSubscriptionPlans = async () => {
  try {
    console.log("Calling getSubscriptionPlans API...");
    const response = await fetchAPI(API_ENDPOINTS.GET_SUBSCRIPTION_PLANS, "GET");
    console.log("Subscription plans API response:", response);
    
    // Ensure we're returning an array of plans
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object') {
      // Some APIs wrap the data in an object
      const plans = response.plans || response.data || [];
      console.log("Extracted plans:", plans);
      return plans;
    }
    return [];
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return [];
  }
};

export const getSubscriptionHistory = async () => {
  try {
    const response = await fetchAPI(API_ENDPOINTS.GET_SUBSCRIPTION_HISTORY, "GET");
    // Transform dates to proper format
    if (Array.isArray(response)) {
      return response.map(subscription => {
        if (subscription.start_date) {
          subscription.start_date = new Date(subscription.start_date).toISOString();
        }
        if (subscription.end_date) {
          subscription.end_date = new Date(subscription.end_date).toISOString();
        }
        return subscription;
      });
    }
    return response;
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    return [];
  }
};

export const getOccupiedSlots = async (fieldId: string, date: string): Promise<string[]> => {
  const endpoint = API_ENDPOINTS.GET_OCCUPIED_SLOTS(fieldId, date);
  return fetchAPI(endpoint, "GET");
};


export const getAllOwnerSubscriptions = async () => {
  try {
    console.log("Calling getAllOwnerSubscriptions API...");
    const response = await fetchAPI(`${API_ENDPOINTS.GET_ALL_SUBSCRIPTIONS}`, "GET");
    console.log("Subscriptions API response:", response);
    return response;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
};

