# FIBO 

FIBO (Field Booking) là một ứng dụng cho phép người dùng dễ dàng tìm kiếm, đặt và quản lý việc đặt sân tập thể thao. Ứng dụng hỗ trợ các loại sân khác nhau, cung cấp thông tin chi tiết về giá đặt sân, tình trạng sân và đánh giá của khách hàng đã sử dụng sân. Với giao diện thân thiện và dễ sử dụng, FIBO tự tin sẽ tối ưu hoá trải nghiệm đặt sân của mọi người.

## Chức năng người dùng (Customer)

### Cập nhật hệ thống đặt sân
-  Tìm kiếm sân theo nhiều tiêu chí (vị trí, loại sân, giá cả)
-  Xem chi tiết thông tin sân với hình ảnh, giá, đánh giá
-  Đặt sân với các khung giờ linh hoạt
-  Chọn dịch vụ bổ sung khi đặt sân
-  Thanh toán qua VNPay với mã QR
-  Hệ thống đếm ngược thời gian thanh toán
-  Xóa đơn hàng tự động nếu không thanh toán trong thời hạn

### Quản lý lịch hẹn
-  Xem lịch sử đặt sân theo ba dạng khác nhau 
-  Theo dõi trạng thái đơn đặt (xác nhận, chờ duyệt, đã hủy, hoàn thành)
-  Nhận thông báo về trạng thái đơn đặt

### Hồ sơ người dùng
-  Thay đổi mật khẩu với xác thực OTP
-  Cập nhật thông tin cá nhân và ảnh đại diện
-  Quản lý thông báo

## Chức năng chủ sân (Owner)

### Đăng ký và quản lý sân
-  Đăng ký sân mới với nhiều thông tin chi tiết
-  Tải lên nhiều hình ảnh sân
-  Thiết lập giá theo từng khung giờ hoặc đồng bộ giá
-  Thêm dịch vụ bổ sung cho sân
-  Quản lý số lượng sân con trong một khu vực

### Quản lý lịch trình
-  Xem tổng quan tất cả sân đã đăng ký
-  Quản lý lịch đặt cho từng sân
-  Theo dõi trạng thái sân (trống/đã đặt)
-  Xử lý yêu cầu đặt sân

### Doanh thu và thông báo
-  Theo dõi doanh thu từ các sân đã đăng ký
-  Nhận thông báo khi có người đặt sân
-  Quản lý hồ sơ cá nhân

## Chức năng quản trị viên (Admin)

### Quản lý nền tảng
-  Quản lý đối tác (chủ sân) với khả năng chuyển trạng thái sân
-  Quản lý người dùng với các trạng thái khác nhau
-  Quản lý đơn đặt sân và thống kê
-  Quản lý phản hồi của người dùng
-  Gửi thông báo cho tất cả người dùng

### Thống kê và báo cáo
-  Xem thống kê sân theo loại (bóng đá, cầu lông, tennis, bóng rổ, pickleball)
-  Xem thống kê trạng thái sân (có sẵn/không có sẵn)
-  Theo dõi doanh thu toàn hệ thống
-  Quản lý sự kiện và thông báo hệ thống

## Công nghệ đã sử dụng

### Backend
- Node.js với Express
- MySQL database
- JWT authentication
- Multer cho xử lý file
- Email service

### Frontend
- React Native với Expo
- React Navigation
- AsyncStorage cho lưu trữ cục bộ
- Animations và UI components tùy chỉnh
- Tích hợp thanh toán QR

### Tính năng bảo mật
- Hash password
- Xác thực OTP
- JWT Token cho API authorization

## Thay đổi gần đây

1. Cải thiện UI/UX trong giao diện đặt sân
2. Thêm chức năng đồng bộ giá cho chủ sân
3. Tối ưu quá trình tải hình ảnh
4. Cải thiện hệ thống thanh toán
5. Thêm nhiều loại sân mới (pickleball)

---

## Các trường hợp xảy ra trong quá trình đặt và sử dụng sân
1. Người dùng không thanh toán trong thời gian quy định
2. Phương thức thanh toán có vấn đề
3. Người dùng muốn thay đổi thông tin của đơn đặt (thêm dịch vụ, sửa loại sân, .v.v...)
4. Người dùng muốn huỷ đặt vào phút chót (mất tiền đã thanh toán)
5. Người dùng cố tình để lại đánh giá tiêu cực cho sân và chủ sân
6. Tình hình thời tiết hoặc thiên tai khiến người dùng không thể sử dụng sân như dự kiện
7. Người dùng làm hỏng hóc cơ sở vật chất của sân
8. Gói subscription của chủ sân hết và chưa gia hạn trước khi xử lý các vấn đề trên
Cập nhật ngày: 05/05/2025
