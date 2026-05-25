# ⚡ GigGo - Nền tảng kết nối Freelancer & Doanh nghiệp

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap 5">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/MockAPI-00C9A7?style=for-the-badge&logo=mockapi&logoColor=white" alt="MockAPI">
</p>

---

## 📌 Giới thiệu dự án

**GigGo** là một ứng dụng Web Marketplace hiện đại được xây dựng để kết nối các doanh nghiệp/nhà tuyển dụng (**Clients**) với mạng lưới các chuyên gia tự do (**Freelancers**).

Dự án được xây dựng hoàn toàn bằng công nghệ **Vanilla HTML/CSS/JS** thuần, kết hợp với framework giao diện **Bootstrap 5** và tích hợp **RESTful API** thông qua nền tảng **MockAPI** để xử lý toàn bộ dữ liệu hệ thống (CRUD) mà không phụ thuộc vào thư viện bên thứ ba như jQuery hay React.

---

## 🌟 Tính năng cốt lõi (Key Features)

### 🧑‍💼 Cổng thông tin Khách hàng (Client Portal)

- **Đăng tuyển dự án (Post Projects)**: Tạo và đăng các dự án tuyển dụng kèm theo ngân sách, thời hạn và mô tả chi tiết.
- **Quản lý báo giá (Bids Management)**: Xem danh sách các freelancer đã ứng tuyển/báo giá và lựa chọn đối tác phù hợp.
- **Hệ thống ví & ký quỹ (Escrow System)**: Nạp tiền vào ví, tiến hành ký quỹ dự án khi chọn freelancer và tự động thanh toán/hoàn trả tiền an toàn.
- **Đánh giá & Phản hồi (Reviews)**: Để lại nhận xét và số sao đánh giá cho freelancer sau khi hoàn thành đơn hàng.
- **Lưu dịch vụ yêu thích (Wishlist)**: Lưu lại các dịch vụ nổi bật vào thanh Sidebar để liên hệ sau.

### 🧑‍💻 Cổng thông tin Freelancer (Freelancer Portal)

- **Tìm kiếm công việc (Job Browser)**: Duyệt danh sách công việc đang tuyển dụng, lọc theo danh mục hoặc từ khóa.
- **Gửi báo giá (Submit Bids)**: Đề xuất mức chi phí và thời gian thực hiện cho các dự án của khách hàng.
- **Quản lý đơn hàng (Order Tracking)**: Theo dõi tiến độ các công việc đang làm và đã hoàn thành.
- **Hệ thống Cấp độ (Level System)**: Tự động phân cấp bậc Freelancer (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương) và theo dõi tiến độ lên cấp dựa trên số dự án hoàn thành.
- **Hồ sơ năng lực (Portfolio)**: Cập nhật thông tin cá nhân, kỹ năng chuyên môn, kinh nghiệm làm việc và các sản phẩm tiêu biểu.

### 🛡️ Cổng quản trị viên (Admin Portal)

- **Bảng điều khiển trực quan (Dashboard Metrics)**: Thống kê số lượng người dùng, tổng doanh thu phí giao dịch nền tảng (7%), tổng số dự án và tỷ lệ hoàn thành.
- **Quản lý tài khoản (User Moderation)**: Kích hoạt, khóa tài khoản người dùng hoặc chặn địa chỉ IP truy cập đối với các trường hợp vi phạm chính sách.
- **Giải quyết hỗ trợ (Ticket Support)**: Tiếp nhận và xử lý các yêu cầu, khiếu nại gửi về từ trang Liên hệ/Hỗ trợ.
- **Quản lý Danh mục & Dịch vụ**: Cập nhật, chỉnh sửa danh mục ngành nghề và quản lý nội dung đăng tải trên hệ thống.

---

## 🛠️ Tính năng Kỹ thuật Đặc biệt (Premium Technical Highlights)

Hệ thống được phát triển với độ hoàn thiện cao, tích hợp nhiều cơ chế xử lý logic phía Client tinh tế:

1. **IP Banning & Security Overlay**: Tự động nhận diện IP của người truy cập (thông qua API `ipify` hoặc giả lập ngẫu nhiên). Nếu IP hoặc tài khoản bị khóa trong Admin, hệ thống sẽ ngay lập tức kích hoạt màn hình chặn truy cập toàn trang (Locked Overlay) với hiệu ứng Blur kính mờ.
2. **Onboarding Welcome Screen**: Hiệu ứng mở màn cực đẹp với Canvas hạt bay động (Particle Canvas), Ambient Glow màu sắc trôi tự do, giới thiệu tính năng dạng slideshow 3 slide và cho phép chọn nhanh vai trò người dùng.
3. **Escrow & Commission Control**: Hệ thống tự động khấu trừ **7% phí giao dịch** trên mỗi đơn hàng hoàn thành thành công và chuyển vào Quỹ nền tảng, đảm bảo tính thực tế của ứng dụng thương mại.
4. **Custom Dialogs**: Thay thế hoàn toàn các hàm hệ thống mặc định (`alert()`, `confirm()`) bằng các modal hộp thoại xác nhận/cảnh báo được thiết kế riêng theo chuẩn Bootstrap 5, mang lại trải nghiệm mượt mà và đồng bộ.
5. **Theme Switcher**: Hỗ trợ chuyển đổi giao diện Sáng/Tối (Light/Dark Mode) mượt mà bằng cách can thiệp động CSS Variables, lưu trữ trạng thái lựa chọn vào `localStorage`.
6. **Data Export**: Hỗ trợ xuất dữ liệu thống kê ra file CSV và in trực tiếp ra file PDF chuyên nghiệp.

---

## 📂 Cấu trúc thư mục dự án

```text
FIT-DNU-FE_NHOM_07/
├── index.html                  # Trang chủ hệ thống & Màn hình Onboarding
├── login.html                  # Trang đăng nhập phân quyền
├── register.html               # Trang đăng ký thành viên mới
├── portfolio.html              # Trang hồ sơ năng lực của Freelancer
├── client-profile.html         # Trang thiết lập thông tin của Khách hàng
├── client-dashboard.html       # Bảng điều khiển của Khách hàng
├── freelancer-dashboard.html   # Bảng điều khiển của Freelancer
├── admin.html                  # Trang quản trị hệ thống của Admin
├── support.html                # Trang gửi ticket hỗ trợ & liên hệ
├── news.html                   # Trang tin tức công nghệ & việc làm
├── rankings.html               # Trang bảng xếp hạng Freelancer tiêu biểu
├── source.txt                  # Lưu trữ thông tin MockAPI endpoints
├── css/
│   └── style.css               # Tệp định nghĩa kiểu giao diện tùy chỉnh
├── img/                        # Chứa các tài nguyên hình ảnh, biểu tượng
└── js/
    ├── api.js                  # Lớp CRUD API dùng chung (Promise + Fetch với Timeout 10s)
    ├── auth.js                 # Xử lý phân quyền, Route Guard và Render Navbar động
    ├── utils.js                # Tiện ích chung (Định dạng tiền, Countdown, Toast, Wishlist, Wallet, Levels, Custom Dialogs)
    ├── main.js                 # Logic điều phối chính cho Trang chủ & Onboarding
    ├── client.js               # Nghiệp vụ Dashboard Khách hàng
    ├── freelancer.js           # Nghiệp vụ Dashboard Freelancer
    ├── admin.js                # Nghiệp vụ Dashboard Quản trị viên
    ├── support.js              # Xử lý gửi Ticket & Hỗ trợ
    ├── news.js                 # Xử lý hiển thị tin tức
    └── rankings.js             # Xử lý bảng xếp hạng
```

---

## ⚙️ MockAPI Endpoints

Dữ liệu của hệ thống được lưu trữ và đồng bộ hóa qua 10 API endpoints:

| Thực thể       | Endpoint URL          | Chức năng                                                   |
| :------------- | :-------------------- | :---------------------------------------------------------- |
| **Users**      | `.../api/v1/users`    | Quản lý thông tin tài khoản, mật khẩu, IP, trạng thái khóa. |
| **Services**   | `.../Services`        | Danh sách các dịch vụ mà Freelancer cung cấp.               |
| **Requests**   | `.../Requests`        | Yêu cầu thuê việc làm do Khách hàng tạo ra.                 |
| **Projects**   | `.../api/v1/projects` | Các dự án công việc đang trong quá trình thực hiện.         |
| **Bids**       | `.../api/v1/Bids`     | Các báo giá ứng tuyển của Freelancer.                       |
| **Tickets**    | `.../api/v1/tickets`  | Phiếu yêu cầu trợ giúp/gửi liên hệ của khách hàng.          |
| **Jobs**       | `.../api/v1/job`      | Danh sách loại công việc/ngành nghề.                        |
| **Orders**     | `.../api/v1/orders`   | Đơn hàng chi tiết giữa Client và Freelancer.                |
| **Reviews**    | `.../reviews`         | Đánh giá sao và nhận xét năng lực làm việc.                 |
| **Categories** | `.../categories`      | Các danh mục ngành nghề của hệ thống.                       |

---

## 🚀 Hướng dẫn Cài đặt & Sử dụng

### 1. Yêu cầu chuẩn bị

- Máy tính đã cài đặt trình duyệt web hiện đại (Google Chrome, Microsoft Edge, Firefox, Safari).
- Đã cài đặt tiện ích mở rộng **Live Server** trên VS Code (khuyên dùng để tránh lỗi bảo mật CORs/local storage trên một số trình duyệt khi chạy file tĩnh).

### 2. Các bước khởi chạy

1. Tải hoặc nhân bản (clone) thư mục dự án về máy tính của bạn.
2. Mở thư mục bằng phần mềm **Visual Studio Code**.
3. Click chuột phải vào tệp `index.html` và chọn **Open with Live Server**.
4. Trình duyệt sẽ tự động mở trang web tại địa chỉ `http://127.0.0.1:5500/index.html`.

### 🔑 Tài khoản kiểm thử có sẵn (Test Accounts)

Hệ thống sử dụng các thông tin đăng nhập mẫu sau:

- **Tài khoản Khách hàng (Client)**:
  - Email: `client@gmail.com`
  - Mật khẩu: `client123`
- **Tài khoản Freelancer**:
  - Email: `freelancer@gmail.com`
  - Mật khẩu: `free123`

---

## 👥 Thông tin Nhóm thực hiện

Dự án được nghiên cứu và phát triển bởi các thành viên **Nhóm 7** thuộc lớp **KHMT 19-01** - **Khoa Công nghệ Thông tin (FIT - DNU)**:

| STT | Họ và Tên             |  Mã sinh viên   | Vai trò trong nhóm               |
| :-: | :-------------------- | :-------------: | :------------------------------- |
|  1  | **BÙI DUY QUANG**     | _Đang cập nhật_ | Trưởng nhóm, Front-End Developer |
|  2  | **PHẠM ĐỨC ANH**      | _Đang cập nhật_ | Member, Front-End Developer      |
|  3  | **LÊ VĂN DUY PHƯƠNG** | _Đang cập nhật_ | Member, UI/UX Designer & QA      |

---

<p align="center">
  <i>FIT DNU © 2026 - Học phần Thiết kế, lập trình Front-End - Nhóm 07.</i>
</p>
