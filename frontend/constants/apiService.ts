// apiService.ts
import { API_ENDPOINTS , API_URL} from "./apiConfig"; // Định nghĩa các endpoint ở đây
import AsyncStorage from "@react-native-async-storage/async-storage";


const fetchAPI = async (endpoint: string, method = "GET", body?: any, isFormData = false) => {
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
      throw new Error(data.error || "Lỗi khi gọi API");
    }

    return data;
  } catch (error) {
    console.error("Error fetching API:", error);
    throw error;
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
// lịch của tôi
export const getCalendarData = async () => {
  try {
    console.log("Fetching calendar data..."); // Log trước khi fetch
    const response = await fetch(API_ENDPOINTS.GET_CALENDAR);
    console.log("Response status:", response.status); // Kiểm tra status

    if (!response.ok) {
      throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Dữ liệu từ API:", data); // Kiểm tra dữ liệu nhận được

    return data.map((booking: any) => ({
      id: booking.booking_id,
      customerId: booking.customer_id,
      fieldId: booking.field_id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
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

export const uploadAvatar = async (formData: FormData): Promise<{ avatar: string }> => {
  try {
    const token = await AsyncStorage.getItem("token");
    console.log("Token:", token);

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

    const avatarUrl = `${API_URL}/avatars/${data.avatar}`;
    return { avatar: avatarUrl };
  } catch (error) {
    console.error("Lỗi khi gọi API upload avatar:", error);
    throw error;
  }
};

export const getFields = async (sportType: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}?sport_type=${encodeURIComponent(sportType)}`;
  return fetchAPI(url, "GET");
};

// Lấy danh sách SubFields theo field_id
export const getSubFields = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/subfields`; // Giả định endpoint
  return fetchAPI(url, "GET");
};

// Lấy danh sách TimeSlots và giá theo field_id
export const getTimeSlots = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/timeslots`; // Giả định endpoint
  return fetchAPI(url, "GET");
};

// Lấy danh sách Services theo field_id
export const getServices = async (fieldId: string) => {
  const url = `${API_ENDPOINTS.GET_FIELDS}/${fieldId}/services`; // Giả định endpoint
  return fetchAPI(url, "GET");
};

// apiService.ts
export const createBooking = async (
  fieldId: string,
  customerId: string,
  startTime: string,
  endTime: string,
  totalCost: number,
  services: { serviceId: number; quantity: number }[], // Thay đổi ở đây
  paymentMethod: string
) => {
  const url = `${API_ENDPOINTS.GET_CALENDAR}`;
  const body = {
    field_id: fieldId,
    customer_id: customerId,
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

// Xác thực mật khẩu
export const deactivateAccountWithPassword = async (password: string) => {
  return fetchAPI(API_ENDPOINTS.DEACTIVATE_WITH_PASSWORD, "POST", { password });
};


