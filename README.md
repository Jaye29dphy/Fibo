# FIBO
FIBO (Field Booking) là một ứng dụng cho phép người dùng dễ dàng tìm kiếm, đặt và quản lý việc đặt sân tập thể thao. Ứng dụng hỗ trợ các loại sân khác nhau, cung cấp thông tin chi tiết về giá đặt sân, tình trạng sân và đánh giá của khách hàng đã sử dụng sân. Với giao diện thân thiện và dễ sử dụng, FIBO tự tin sẽ tối ưu hoá trải nghiệm đặt sân của mọi người.

## Vai trò
FIBO đóng vai trò là trung gian giữa người dùng đặt sân (User) và chủ sân (Owner)
- Đối với người dùng: Giúp dễ dàng tìm kiếm sân theo các tiêu chí như vị trí lân cận, giá cả, dịch vụ, loại sân 1 cách nhanh chóng. Đảm bảo quyền lợi của người dùng
- Đối với chủ sân: Giúp các sân tập thể thao của các chủ sân có thể dễ dàng tiếp cận với các đối tượng (người dùng đặt sân), hỗ trợ quảng cáo cho sân tập.
- Lợi nhuận (might delete later):
  - Ăn % hoa hồng của việc làm trung gian
  - Đặt quảng cáo trong ứng dụng
  - Tiền quảng cáo cho sân tập
  - Các gói subscription tháng/quý/năm của các chủ sân

## Yêu cầu phi chức năng
- Cập nhật real-time
- Hướng dẫn đối với người dùng lần đầu sử dụng ứng dụng (maybe)
- Hiệu năng ổn định
- Dễ bảo trì, nâng cấp
- Bảo mật:
  - Hash password, lựa chọn Remember me
  - Xác thực OTP
- Trải nghiệm người dùng:
  - Giao diện thân thiện
  - Thao tác đơn giản, dễ sử dụng
  - Trải nghiệm mượt mà
- Công nghệ sử dụng: Node.js, Express, React Native, MySQL.
- Tương thích: Hệ điều hành Android

## Quy trình đặt sân:
1. Người dùng tìm kiếm sân tập thể thao trên FIBO theo tên hoặc lọc theo các tiêu chí nhất định
2. Sau khi đã kiểm tra thông tin và ưng ý với sân tập, đồng thời sân tập đủ điều kiện để đặt, người dùng có thể lựa chọn thêm các dịch vụ, gửi yêu cầu đặt sân và sau đó thanh toán qua ứng dụng FIBO. Có thể lựa chọn thanh toán trước để được discount hoặc cọc 50% và thanh toán nốt khi check-in tại sân
3. Hệ thống cập nhật lại tình trạng sân thành đã được đặt, sau đó gửi thông báo về việc đặt sân cho chủ sân
4. Hệ thống cập nhật lịch đặt sân đối với tài khoản của người dùng và chủ sân, giúp họ dễ theo dõi
5. Sau khi sử dụng, hệ thống gửi thông báo nhắc nhở người dùng đánh giá sân tập và chủ sân

### Các tình trạng sân:
- Available
- Inavailable
- In use
- ...

## Các trường hợp xảy ra trong quá trình đặt và sử dụng sân
1. Người dùng không thanh toán trong thời gian quy định
2. Phương thức thanh toán có vấn đề 
3. Người dùng muốn thay đổi thông tin của đơn đặt (thêm dịch vụ, sửa loại sân, .v.v...)
4. Người dùng muốn huỷ đặt vào phút chót (mất tiền đã thanh toán)
5. Người dùng cố tình để lại đánh giá tiêu cực cho sân và chủ sân
6. Tình hình thời tiết hoặc thiên tai khiến người dùng không thể sử dụng sân như dự kiện
7. Người dùng làm hỏng hóc cơ sở vật chất của sân 
8. Gói subscription của chủ sân hết và chưa gia hạn trước khi xử lý các vấn đề trên
