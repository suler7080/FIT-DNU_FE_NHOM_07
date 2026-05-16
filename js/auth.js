/**
 * AUTH.JS - Xử lý xác thực người dùng (Đăng ký, Đăng nhập, Quản lý phiên)
 * Sử dụng Vanilla JS, localStorage và MockAPI.io
 */

const Auth = {
    // Lưu thông tin user vào localStorage
    setCurrentUser: function(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    // Lấy thông tin user hiện tại
    getCurrentUser: function() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Đăng xuất
    logout: function() {
        localStorage.removeItem('currentUser');
        window.location.replace('login.html');
    },

    // Kiểm tra đăng nhập
    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },

    // Kiểm tra quyền Admin
    isAdmin: function() {
        const user = this.getCurrentUser();
        return user !== null && user.role === 'admin';
    },

    // Bảo vệ route: Yêu cầu quyền cụ thể (hoặc bất kỳ ai đã login nếu requiredRole trống)
    checkAuth: function(requiredRole = null) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.replace('login.html');
            return false;
        }
        
        if (requiredRole && user.role !== requiredRole) {
            window.location.replace('index.html');
            return false;
        }
        return true;
    },

    // Lấy URL dashboard tương ứng với role
    getDashboardUrl: function(role) {
        if (role === 'admin') return 'admin.html';
        if (role === 'client') return 'client-dashboard.html';
        if (role === 'freelancer') return 'freelancer-dashboard.html';
        return 'index.html';
    },

    // Cập nhật giao diện Navbar dựa trên trạng thái đăng nhập
    updateNavbar: function() {
        const user = this.getCurrentUser();
        const navbarNav = document.getElementById('navbarNav');
        
        if (!navbarNav) return;

        const ul = navbarNav.querySelector('ul.navbar-nav');
        if (!ul) return;
        
        // Remove existing auth links if any
        const existingAuthItems = ul.querySelectorAll('.auth-item');
        existingAuthItems.forEach(item => item.remove());

        // Nếu là Admin, chèn thêm link Quản Trị Viên
        if (user && user.role === 'admin') {
            const adminLi = document.createElement('li');
            adminLi.className = 'nav-item auth-item align-self-center';
            adminLi.innerHTML = `<a class="nav-link fw-semibold text-warning" href="admin.html"><i class="bi bi-shield-lock me-1"></i>Quản Trị Viên</a>`;
            ul.insertBefore(adminLi, ul.firstChild);
        }

        if (user) {
            // User is logged in
            const userLi = document.createElement('li');
            userLi.className = 'nav-item dropdown auth-item ms-lg-3';
            const dashboardUrl = this.getDashboardUrl(user.role);
            userLi.innerHTML = `
                <a class="nav-link dropdown-toggle d-flex align-items-center fw-semibold text-dark bg-white rounded-pill px-3 py-2 shadow-sm" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" class="rounded-circle me-2" width="32" height="32" alt="${user.name}">
                    <span>${user.name}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item py-2" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</a></li>
                    ${user.role === 'freelancer' ? '<li><a class="dropdown-item py-2" href="portfolio.html"><i class="bi bi-person-badge me-2 text-primary"></i>Hồ Sơ Năng Lực</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-danger btn-logout-navbar" href="#"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                </ul>
            `;
            ul.appendChild(userLi);

            // Khởi tạo Bootstrap Dropdown thủ công để đảm bảo luôn hoạt động (fix lỗi dropdown không hiện)
            const dropdownToggle = userLi.querySelector('.dropdown-toggle');
            if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                new bootstrap.Dropdown(dropdownToggle);
            }

            // Sử dụng querySelector trong userLi để tránh trùng lặp ID nếu có nhiều logout buttons
            const btnLogout = userLi.querySelector('.btn-logout-navbar');
            if (btnLogout) {
                btnLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout(); // Dùng Auth.logout() trực tiếp để tránh lỗi con trỏ 'this'
                });
            }
        } else {
            // User is not logged in
            const loginLi = document.createElement('li');
            loginLi.className = 'nav-item auth-item ms-lg-3';
            loginLi.innerHTML = `<a class="btn btn-light shadow-sm text-primary fw-bold px-4 py-2 mt-1 mt-lg-0" href="login.html"><i class="bi bi-box-arrow-in-right me-2"></i> Đăng nhập</a>`;
            
            const registerLi = document.createElement('li');
            registerLi.className = 'nav-item auth-item ms-lg-2';
            registerLi.innerHTML = `<a class="btn btn-primary shadow-sm fw-bold px-4 py-2 mt-2 mt-lg-0" href="register.html">Đăng ký</a>`;
            
            ul.appendChild(loginLi);
            ul.appendChild(registerLi);
        }
    }
};

// Gọi updateNavbar khi DOM được load
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavbar();
});
