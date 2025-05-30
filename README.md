# FIBO - Field Booking Application 🏟️

FIBO (Field Booking) là một ứng dụng toàn diện cho phép người dùng dễ dàng tìm kiếm, đặt và quản lý việc đặt sân thể thao. Ứng dụng hỗ trợ nhiều loại sân khác nhau, cung cấp thông tin chi tiết về giá cả, tình trạng sân và hệ thống đánh giá từ khách hàng. Với giao diện thân thiện, tính năng bảo mật cao và hệ thống thanh toán linh hoạt, FIBO mang đến trải nghiệm đặt sân tối ưu cho tất cả người dùng.

## 📋 Tổng quan tính năng

### 🎯 Ba vai trò người dùng chính:
- **Customer (Khách hàng)**: Tìm kiếm và đặt sân
- **Owner (Chủ sân)**: Quản lý sân và gói đăng ký
- **Admin (Quản trị viên)**: Quản lý toàn bộ hệ thống

---

## 👤 Chức năng Customer (Khách hàng)

### 🏟️ Hệ thống đặt sân thông minh
- **Tìm kiếm nâng cao**: Lọc theo vị trí, loại sân, khoảng giá, thời gian
- **Chi tiết sân đầy đủ**: Hình ảnh HD, giá theo khung giờ, đánh giá và bình luận
- **Đặt sân linh hoạt**: Chọn khung giờ, thời gian, số lượng sân con
- **Dịch vụ bổ sung**: Thuê thiết bị, nước uống, đồ ăn nhẹ
- **Thanh toán đa dạng**: 
  - VNPay gateway với bảo mật cao
  - QR Code payment với Agribank
  - Hệ thống đếm ngược thời gian thanh toán (60 giây)
  - Tự động hủy đơn nếu không thanh toán trong thời hạn

### 📅 Quản lý lịch hẹn và đặt sân
- **Lịch sử đặt sân**: 3 dạng hiển thị (danh sách, lịch, timeline)
- **Theo dõi trạng thái real-time**: 
  - ⏳ Pending (Chờ xác nhận)
  - ✅ Confirmed (Đã xác nhận) 
  - ❌ Cancelled (Đã hủy)
  - 🏁 Completed (Hoàn thành)
- **Thông báo push**: Cập nhật trạng thái đơn đặt ngay lập tức
- **Đánh giá và nhận xét**: Hệ thống rating 5 sao sau khi hoàn thành

### 👥 Quản lý hồ sơ cá nhân
- **Bảo mật tài khoản**: Đổi mật khẩu với xác thực OTP qua email
- **Thông tin cá nhân**: Cập nhật họ tên, email, số điện thoại
- **Ảnh đại diện**: Upload và thay đổi avatar
- **Cài đặt thông báo**: Tùy chỉnh loại thông báo nhận được

---

## 🏢 Chức năng Owner (Chủ sân)

### 🏗️ Đăng ký và quản lý sân thể thao
- **Đăng ký sân mới**: Wizard hướng dẫn từng bước
- **Thông tin chi tiết**: Tên sân, địa chỉ, mô tả, loại sân, tiện nghi
- **Quản lý hình ảnh**: Upload nhiều ảnh HD, sắp xếp thứ tự hiển thị
- **Thiết lập giá linh hoạt**: 
  - Giá theo từng khung giờ (6:00-22:00)
  - Chức năng đồng bộ giá nhanh
  - Giá cuối tuần và ngày lễ khác biệt
- **Dịch vụ bổ sung**: Thêm/sửa/xóa các dịch vụ đi kèm
- **Quản lý sân con**: Thiết lập số lượng và trạng thái từng sân con
- **Hỗ trợ đa loại sân**: Bóng đá, cầu lông, tennis, bóng rổ

### 📊 Hệ thống gói đăng ký (Subscription)
- **Gói Basic (Miễn phí)**: 
  - Tính năng cơ bản
- **Gói Standard/Classic**: 
  - Tối đa 10 sân
  - Hỗ trợ 16/7
  - Giảm 10% phí dịch vụ
- **Gói Premium/Pro**: 
  - Tối đa 30 sân  
  - Hỗ trợ 24/7
  - Giảm 15% phí dịch vụ
  - Tính năng ưu tiên

### 📅 Quản lý lịch trình và đặt sân
- **Calendar view**: Hiển thị trực quan tất cả đặt sân
- **Quản lý booking**: 
  - Xác nhận/từ chối yêu cầu đặt sân
  - Cập nhật trạng thái đặt sân
  - Xem chi tiết khách hàng và dịch vụ đặt kèm
- **Thống kê sân**: Theo dõi tỷ lệ sử dụng, doanh thu theo ngày/tháng
- **Thông báo real-time**: Nhận thông báo khi có đặt sân mới

### 💰 Quản lý doanh thu và thanh toán gói
- **Thanh toán gói đăng ký**:
  - QR Code payment qua ngân hàng
  - Hệ thống đếm ngược 60 giây
  - Xác nhận thanh toán thủ công
- **Lịch sử đăng ký**: Theo dõi tất cả gói đã mua
- **Gia hạn tự động**: Thông báo trước khi hết hạn
- **Theo dõi doanh thu**: Dashboard hiển thị thu nhập từ đặt sân

---

## ⚙️ Chức năng Admin (Quản trị viên)

### 🏢 Quản lý đối tác và sân bãi
- **Quản lý chủ sân (Partners)**:
  - Danh sách tất cả owners đã đăng ký
  - Thay đổi trạng thái sân (available/unavailable)
  - Thống kê theo loại sân và trạng thái
  - Biểu đồ phân tích chi tiết
- **Phê duyệt sân mới**: Xem xét và phê duyệt sân đăng ký mới
- **Quản lý hình ảnh**: Kiểm duyệt hình ảnh upload

### 👥 Quản lý người dùng
- **Database người dùng**: Danh sách đầy đủ customers, owners, admins
- **Phân quyền**: Thay đổi role và trạng thái tài khoản
- **Thống kê users**: 
  - Số lượng theo từng loại
  - Biểu đồ active/inactive users
  - Tỷ lệ phân bố địa lý

### 📋 Quản lý đặt sân
- **Dashboard tổng quan**: Tất cả bookings trong hệ thống
- **Lọc và tìm kiếm**: Theo trạng thái, thời gian, khách hàng, sân
- **Thống kê booking**:
  - Biểu đồ trạng thái đặt sân
  - Top 3 sân được đặt nhiều nhất
  - Top 3 khách hàng đặt sân nhiều nhất
- **Xử lý tranh chấp**: Hỗ trợ giải quyết vấn đề giữa customer và owner

### 💬 Quản lý phản hồi và đánh giá
- **Review management**: Xem tất cả đánh giá trong hệ thống
- **Lọc theo rating**: 1-5 sao
- **Xóa đánh giá**: Xử lý những đánh giá không phù hợp
- **Thống kê feedback**:
  - Điểm đánh giá trung bình toàn hệ thống
  - Biểu đồ phân bố rating
  - Phân tích xu hướng đánh giá

### 🔔 Hệ thống thông báo
- **Gửi thông báo hàng loạt**: Tới tất cả users hoặc theo nhóm
- **Quản lý notification**: Xem trạng thái đã đọc/chưa đọc
- **Thống kê thông báo**: Tỷ lệ mở và tương tác
- **Template thông báo**: Mẫu có sẵn cho các sự kiện thường gặp

### 📊 Báo cáo và thống kê doanh thu
- **Revenue dashboard**: Tổng quan doanh thu từ subscription
- **Thống kê theo thời gian**: Năm, tháng, quý
- **Phân tích gói đăng ký**:
  - Top 3 gói phổ biến nhất
  - Doanh thu theo từng gói
  - Xu hướng nâng cấp gói
- **Top performers**:
  - Top 3 chủ sân có doanh thu cao nhất
  - Phân tích hiệu suất kinh doanh
- **Export báo cáo**: Xuất dữ liệu Excel/PDF

---

## 🛠️ Công nghệ sử dụng

### 🖥️ Backend
- **Framework**: Node.js với Express.js
- **Database**: MySQL với connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer middleware
- **Email Service**: Nodemailer với Gmail SMTP
- **Security**: bcrypt cho hash password, helmet cho HTTP headers
- **API Documentation**: Swagger/OpenAPI

### 📱 Frontend  
- **Framework**: React Native với Expo SDK
- **Navigation**: React Navigation v6
- **State Management**: React Hooks và Context API
- **Storage**: AsyncStorage cho lưu trữ cục bộ
- **UI Components**: Custom components với animations
- **Charts**: react-native-chart-kit cho thống kê
- **Image Handling**: Expo ImagePicker và ImageManipulator
- **Maps**: React Native Maps cho hiển thị vị trí

### 💳 Tích hợp thanh toán
- **VNPay Gateway**: Thanh toán trực tuyến an toàn
- **QR Code Payment**: Tích hợp VietQR với Agribank
- **Banking**: Chuyển khoản ngân hàng với thông tin tự động

### 🔒 Bảo mật
- **Password Security**: bcrypt hashing với salt rounds
- **OTP Verification**: Email OTP cho các tác vụ quan trọng  
- **JWT Authentication**: Refresh token mechanism
- **API Rate Limiting**: Giới hạn số request để tránh abuse
- **Input Validation**: Sanitization và validation tất cả inputs
- **HTTPS**: SSL/TLS encryption cho tất cả API calls

### 📊 Analytics và Monitoring
- **Performance Monitoring**: Theo dõi hiệu suất app
- **Error Tracking**: Log và theo dõi lỗi real-time
- **Usage Analytics**: Thống kê người dùng và tính năng
- **Database Monitoring**: Query performance và optimization

---

## 🚀 Tính năng nổi bật

### ⚡ Hiệu suất cao
- **Lazy Loading**: Tải dữ liệu theo yêu cầu
- **Image Optimization**: Nén và resize ảnh tự động
- **Caching Strategy**: Cache API responses và hình ảnh
- **Background Sync**: Đồng bộ dữ liệu khi có mạng

### 🎨 Trải nghiệm người dùng
- **Responsive Design**: Tối ưu cho mọi kích thước màn hình
- **Dark Mode**: Chế độ tối bảo vệ mắt
- **Offline Support**: Một số tính năng hoạt động offline
- **Animation**: Micro-interactions mượt mà

### 🔄 Tích hợp và API
- **RESTful API**: Chuẩn REST với HTTP status codes
- **Real-time Updates**: WebSocket cho notifications
- **Third-party Integration**: Google Maps, Payment gateways
- **API Versioning**: Hỗ trợ multiple API versions

### 🎯 Tính năng đặc biệt nâng cao

#### 📊 Hệ thống thống kê và báo cáo chi tiết
- **Dashboard owner**: Biểu đồ doanh thu theo ngày/tháng/năm
- **Top 3 analytics**: 
  - Sân được đặt nhiều nhất
  - Khách hàng VIP (đặt sân thường xuyên)
  - Gói đăng ký phổ biến nhất
- **Revenue tracking**: Theo dõi doanh thu real-time từ bookings và subscriptions
- **Utilization metrics**: Tỷ lệ sử dụng sân theo khung giờ

#### 🔄 Hệ thống đồng bộ và backup
- **Auto backup**: Sao lưu database tự động hàng ngày
- **Connection pooling**: Tối ưu kết nối MySQL với pool management
- **Transaction management**: Đảm bảo tính nhất quán dữ liệu
- **Error recovery**: Tự động rollback khi có lỗi xảy ra

#### 🛡️ Bảo mật nâng cao
- **Rate limiting**: Giới hạn số request API để chống spam
- **Input sanitization**: Lọc và validate tất cả đầu vào
- **CORS security**: Cấu hình CORS chặt chẽ cho mobile apps
- **Helmet middleware**: Bảo vệ HTTP headers
- **JWT refresh mechanism**: Tự động làm mới token

#### 🌐 Tích hợp và mở rộng
- **Multi-device sync**: Đồng bộ dữ liệu giữa các thiết bị
- **Offline capability**: Lưu cache cục bộ cho một số tính năng
- **Network optimization**: Tối ưu băng thông với image compression
- **Health monitoring**: API endpoint kiểm tra sức khỏe hệ thống (`/api/health`)

#### 📱 Mobile-specific features
- **AsyncStorage**: Lưu trữ cục bộ an toàn
- **Image optimization**: Tự động nén và resize ảnh
- **Background sync**: Đồng bộ dữ liệu khi có mạng
- **Push notifications**: Thông báo real-time qua Expo
- **Deep linking**: Liên kết sâu đến các màn hình cụ thể

#### 🎨 UI/UX nâng cao  
- **Dark mode support**: Chế độ tối bảo vệ mắt
- **Responsive design**: Tối ưu cho mọi kích thước màn hình
- **Smooth animations**: Micro-interactions mượt mà
- **Loading states**: Skeleton screens và progress indicators
- **Error boundaries**: Xử lý lỗi UI một cách graceful

#### 🔧 Developer tools
- **API documentation**: Swagger/OpenAPI integration
- **Logging system**: Chi tiết logs với Morgan
- **Environment management**: Cấu hình đa môi trường
- **Hot reload**: Development server với auto-refresh

---

## 📈 Thống kê và số liệu

### 📊 Dashboard Metrics
- **Total Users**: Tổng số người dùng đăng ký
- **Active Bookings**: Số đặt sân đang hoạt động
- **Revenue Tracking**: Doanh thu theo thời gian thực
- **Field Utilization**: Tỷ lệ sử dụng sân
- **Customer Satisfaction**: Điểm đánh giá trung bình

### 📈 Báo cáo tự động
- **Daily Reports**: Báo cáo hoạt động hàng ngày
- **Weekly Summary**: Tổng kết tuần gửi email
- **Monthly Analytics**: Phân tích chi tiết theo tháng
- **Growth Metrics**: Chỉ số tăng trưởng và retention

---

## 🛡️ Xử lý tình huống đặc biệt

### ⚠️ Các trường hợp xảy ra trong quá trình đặt sân:
1. **Thanh toán quá hạn**: Tự động hủy đơn và giải phóng slot
2. **Lỗi thanh toán**: Retry mechanism và thông báo lỗi chi tiết
3. **Thay đổi booking**: Cho phép sửa đổi trong thời gian nhất định
4. **Hủy phút chót**: Chính sách hoàn tiền theo quy định
5. **Đánh giá tiêu cực**: Hệ thống kiểm duyệt và phản hồi
6. **Thời tiết xấu**: Chính sách hủy/hoãn do force majeure
7. **Thiệt hại trang thiết bị**: Quy trình báo cáo và bồi thường
8. **Gói subscription hết hạn**: Thông báo và gia hạn tự động

### 🔧 Recovery và Backup
- **Database Backup**: Sao lưu tự động hàng ngày
- **Disaster Recovery**: Kế hoạch khôi phục dữ liệu
- **Data Migration**: Scripts cho việc di chuyển dữ liệu
- **Version Control**: Git với branch strategy rõ ràng

---

### 🔐 Authentication APIs
```
POST /api/auth/register     - Đăng ký tài khoản
POST /api/auth/login        - Đăng nhập
GET  /api/auth/me          - Lấy thông tin user
POST /api/auth/send-otp    - Gửi mã OTP
POST /api/auth/change-password - Đổi mật khẩu
GET  /api/auth/notifications - Lấy thông báo
PUT  /api/auth/:id         - Cập nhật thông tin user
```

### 🏟️ Customer APIs (Courts)
```
GET  /courts               - Lấy danh sách sân
GET  /courts/:field_id     - Chi tiết sân
GET  /courts/:fieldId/subfields - Lấy danh sách sân con
GET  /courts/:fieldId/services  - Lấy dịch vụ sân
GET  /courts/:fieldId/time-slots - Lấy khung giờ
POST /courts/bookings      - Tạo booking
POST /courts/orders/pending - Tạo đơn chờ thanh toán
GET  /courts/orders/status/:booking_code - Trạng thái đơn
POST /courts/orders/update-status/:booking_code - Cập nhật trạng thái
DELETE /courts/orders/delete-pending/:booking_code - Hủy đơn chờ
GET  /courts/fields/:fieldId/occupied-slots - Slot đã đặt
```

### 🏢 Owner APIs (Fields)
```
POST /api/fields/register  - Đăng ký sân mới
GET  /api/fields/owner     - Danh sách sân của owner
GET  /api/fields/owner/bookings - Lịch booking owner
POST /api/fields/owner/bookings/:booking_code/status - Cập nhật trạng thái booking
GET  /api/fields/:id       - Chi tiết sân
PUT  /api/fields/:id       - Cập nhật thông tin sân
POST /api/fields/:id/images - Upload ảnh sân
PUT  /api/fields/:id/images/:imageId/main - Đặt ảnh chính
DELETE /api/fields/:id/images/:imageId - Xóa ảnh
POST /api/fields/:fieldId/subfields - Thêm sân con
PUT  /api/fields/:fieldId/subfields/:subFieldId - Cập nhật sân con
DELETE /api/fields/:fieldId/subfields/:subFieldId - Xóa sân con
POST /api/fields/:fieldId/services - Thêm dịch vụ
PUT  /api/fields/:fieldId/services/:serviceId - Cập nhật dịch vụ
DELETE /api/fields/:fieldId/services/:serviceId - Xóa dịch vụ
```

### 👤 Owner Profile & Subscription APIs
```
GET  /api/owner/profile    - Thông tin hồ sơ owner
PUT  /api/owner/profile    - Cập nhật hồ sơ owner
POST /api/owner/avatar     - Upload avatar
GET  /api/owner/subscription - Gói đăng ký hiện tại
POST /api/owner/subscription - Mua gói đăng ký
GET  /api/subscriptions/plans - Danh sách gói
GET  /api/subscriptions/history - Lịch sử đăng ký
POST /api/subscription-orders/pending - Tạo đơn đăng ký chờ
GET  /api/subscription-orders/status/:order_id - Trạng thái đơn đăng ký
POST /api/subscription-orders/update-status/:order_id - Cập nhật trạng thái
DELETE /api/subscription-orders/delete-pending/:subscription_code - Hủy đơn chờ
```

### ⚙️ Admin APIs
```
GET  /api/users            - Danh sách tất cả users
PUT  /api/users/:userId/status - Cập nhật trạng thái user
GET  /api/subscriptions/all - Tất cả gói đăng ký (doanh thu)
GET  /api/reviews          - Tất cả đánh giá
DELETE /api/reviews/:reviewId - Xóa đánh giá
POST /api/notifications/send - Gửi thông báo hàng loạt
PUT  /api/notifications/notifications/:notification_id/read - Đánh dấu đã đọc
PUT  /courts/:fieldId/status - Cập nhật trạng thái sân
```

### 📅 Calendar & Reviews APIs
```
GET  /api/calendar         - Lịch booking (owner)
GET  /api/calendar/bookings - Dữ liệu lịch admin
GET  /api/calendar/user-bookings/:field_id - Lịch user theo sân
GET  /api/reviews/fields/:field_id - Đánh giá theo sân
POST /api/reviews/fields/:field_id - Thêm đánh giá
```

---

## 🏗️ Cấu trúc Database

### 📊 Các bảng chính
- **users**: Thông tin người dùng (customer, owner, admin)
- **owners**: Thông tin bổ sung cho chủ sân
- **fields**: Danh sách sân thể thao
- **subfields**: Sân con (sân 1, sân 2...)
- **services**: Dịch vụ đi kèm
- **time_slots**: Khung giờ và giá theo slot
- **bookings**: Đặt sân
- **booking_services**: Dịch vụ trong booking
- **reviews**: Đánh giá sân
- **notifications**: Thông báo
- **subscription_plans**: Các gói đăng ký
- **owner_subscriptions**: Lịch sử đăng ký gói
- **subscription_pending_orders**: Đơn đăng ký chờ thanh toán
- **pending_orders**: Đơn đặt sân chờ thanh toán

### 🔑 Quan hệ chính
- User (1:1) Owner - Một user có thể là một owner
- Owner (1:n) Fields - Một owner có nhiều sân
- Field (1:n) SubFields - Một sân có nhiều sân con
- Field (1:n) Services - Một sân có nhiều dịch vụ
- Field (1:n) TimeSlots - Một sân có nhiều khung giờ
- Field (1:n) Bookings - Một sân có nhiều booking
- Booking (1:n) BookingServices - Một booking có nhiều dịch vụ
- Field (1:n) Reviews - Một sân có nhiều đánh giá

---

## 🔧 Cấu hình môi trường

### 🌐 Backend Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fibo

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration (Gmail SMTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# File Upload Paths
FIELD_IMAGE_PATH=F:/img/field
AVATAR_IMAGE_PATH=F:/img/avatar

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 📱 Frontend Configuration
```javascript
// constants/apiConfig.ts
export const API_URL = "http://192...";
export const FIELD_IMAGE_BASE_URL = `${API_URL}/fields`;
export const AVATAR_BASE_URL = `${API_URL}/avatars`;
```

---

## 🚀 Hướng dẫn Setup và Chạy ứng dụng

### 📋 Yêu cầu hệ thống
- **Node.js**: v16.0.0 trở lên
- **MySQL**: v8.0 trở lên
- **React Native CLI** hoặc **Expo CLI**
- **Android Studio** (cho Android) hoặc **Xcode** (cho iOS)

### 🖥️ Setup Backend
```bash
# 1. Clone repository
git clone https://github.com/your-repo/fibo.git
cd fibo/backend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env theo mẫu trên
cp .env.example .env

# 4. Tạo database MySQL
mysql -u root -p
CREATE DATABASE fibo;

# 5. Import database structure
mysql -u root -p fibo < database/fibo_structure.sql

# 6. Chạy server
npm run dev
```

### 📱 Setup Frontend
```bash
# 1. Di chuyển đến thư mục frontend
cd ../frontend

# 2. Cài đặt dependencies
npm install

# 3. Cập nhật API_URL trong constants/apiConfig.ts
# Thay đổi IP address theo địa chỉ máy chủ backend

# 4. Chạy ứng dụng
# Với Expo:
npx expo start

# Với React Native CLI:
npx react-native run-android
# hoặc
npx react-native run-ios
```

### 🔧 Scripts hữu ích
```bash
# Backend
npm run dev          # Chạy server development với nodemon
npm run build        # Build production
npm run start        # Chạy production server

# Frontend
npm start            # Khởi động Expo development server
npm run android      # Chạy trên Android
npm run ios          # Chạy trên iOS
npm run web          # Chạy trên web browser
```



---

**Phiên bản**: 2.0.0  
**Tương thích**: iOS 12+, Android 8+  
**Backend**: Node.js v16+, MySQL v8+  
**Frontend**: React Native with Expo SDK 49+
