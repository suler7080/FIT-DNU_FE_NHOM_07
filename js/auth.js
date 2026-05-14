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
        window.location.href = 'login.html';
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
            alert("Bạn cần đăng nhập để truy cập trang này!");
            window.location.href = 'login.html';
            return false;
        }
        
        if (requiredRole && user.role !== requiredRole) {
            alert("Bạn không có quyền truy cập trang này!");
            window.location.href = 'index.html';
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
        
        // Remove existing auth links if any
        const existingAuthItems = ul.querySelectorAll('.auth-item');
        existingAuthItems.forEach(item => item.remove());

        if (user) {
            // User is logged in
            const userLi = document.createElement('li');
            userLi.className = 'nav-item dropdown auth-item';
            const dashboardUrl = this.getDashboardUrl(user.role);
            userLi.innerHTML = `
                <a class="nav-link dropdown-toggle fw-semibold" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle me-1"></i> ${user.name}
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                </ul>
            `;
            ul.appendChild(userLi);

            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            // User is not logged in
            const loginLi = document.createElement('li');
            loginLi.className = 'nav-item auth-item';
            loginLi.innerHTML = `<a class="nav-link fw-semibold" href="login.html"><i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập</a>`;
            
            const registerLi = document.createElement('li');
            registerLi.className = 'nav-item auth-item ms-lg-2';
            registerLi.innerHTML = `<a class="btn btn-outline-light btn-sm mt-1 fw-semibold" href="register.html">Đăng ký</a>`;
            
            ul.appendChild(loginLi);
            ul.appendChild(registerLi);
        }
    }
};

// Gọi updateNavbar khi DOM được load
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavbar();
});
