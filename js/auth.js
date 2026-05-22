// Initialize theme as early as possible to prevent flashing and inject custom styles
(function() {
    const savedTheme = localStorage.getItem('giggo_theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    const injectCustomStyles = () => {
        if (document.getElementById('giggo-custom-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'giggo-custom-styles';
        styleEl.innerHTML = `
            /* Align navbar items vertically */
            @media (min-width: 992px) {
                .navbar-nav {
                    display: flex !important;
                    align-items: center !important;
                }
                .navbar-nav .nav-item {
                    align-self: center !important;
                }
            }
            
            /* Make brand logo and name larger and premium */
            .navbar-brand img {
                height: 55px !important;
                transition: transform 0.2s ease;
            }
            .navbar-brand:hover img {
                transform: scale(1.05);
            }
            .navbar-brand span {
                font-size: 1.6rem !important;
                font-weight: 800 !important;
                letter-spacing: -0.02em !important;
            }
            
            /* Dark Mode Variables and Overrides */
            [data-bs-theme="dark"] {
                --gray-50:  #0f172a;
                --gray-100: #1e293b;
                --gray-200: #334155;
                --gray-400: #64748b;
                --gray-600: #94a3b8;
                --gray-800: #f1f5f9;
                --gray-900: #ffffff;
                --bg-card:   #1e293b;
                --text-muted: #94a3b8;
            }
            [data-bs-theme="dark"] body,
            [data-bs-theme="dark"] .bg-light {
                background-color: #0f172a !important;
                color: #f1f5f9 !important;
            }
            [data-bs-theme="dark"] .bg-white,
            [data-bs-theme="dark"] .card,
            [data-bs-theme="dark"] .sidebar-admin-card {
                background-color: #1e293b !important;
                background: #1e293b !important;
                border-color: #334155 !important;
            }
            [data-bs-theme="dark"] .navbar {
                background-color: rgba(30, 41, 59, 0.8) !important;
                background: rgba(30, 41, 59, 0.8) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }
            [data-bs-theme="dark"] .text-dark,
            [data-bs-theme="dark"] h1,
            [data-bs-theme="dark"] h2,
            [data-bs-theme="dark"] h3,
            [data-bs-theme="dark"] h4,
            [data-bs-theme="dark"] h5,
            [data-bs-theme="dark"] h6,
            [data-bs-theme="dark"] .nav-link,
            [data-bs-theme="dark"] .admin-name,
            [data-bs-theme="dark"] th,
            [data-bs-theme="dark"] td {
                color: #f1f5f9 !important;
            }
            [data-bs-theme="dark"] .text-muted {
                color: #94a3b8 !important;
            }
            [data-bs-theme="dark"] input, 
            [data-bs-theme="dark"] select, 
            [data-bs-theme="dark"] textarea {
                background-color: #1e293b !important;
                border-color: #475569 !important;
                color: #ffffff !important;
            }
            [data-bs-theme="dark"] .hero-section {
                background: linear-gradient(135deg, #0f172a 0%, #020617 100%) !important;
            }
            [data-bs-theme="dark"] footer {
                background-color: #020617 !important;
            }
            [data-bs-theme="dark"] .offcanvas {
                background-color: #1e293b !important;
                color: #f1f5f9 !important;
                border-left: 1px solid #334155 !important;
            }
            [data-bs-theme="dark"] .offcanvas-header {
                border-bottom: 1px solid #334155 !important;
            }
            [data-bs-theme="dark"] .offcanvas-title {
                color: #ffffff !important;
            }
            [data-bs-theme="dark"] #wishlistContainer {
                background-color: #0f172a !important;
            }
            [data-bs-theme="dark"] #wishlistItemsList .card {
                background-color: #1e293b !important;
            }
            [data-bs-theme="dark"] #wishlistItemsList h6 {
                color: #ffffff !important;
            }
            [data-bs-theme="dark"] .btn-close {
                filter: invert(1) !important;
            }
            [data-bs-theme="dark"] .table {
                color: #f1f5f9 !important;
                background-color: #1e293b !important;
            }
            [data-bs-theme="dark"] .table th, 
            [data-bs-theme="dark"] .table td {
                border-color: #334155 !important;
                background-color: #1e293b !important;
                color: #f1f5f9 !important;
            }
            [data-bs-theme="dark"] .sidebar {
                background-color: #1e293b !important;
                border-right: 1px solid #334155 !important;
            }
            [data-bs-theme="dark"] .sidebar .nav-link {
                color: #cbd5e1 !important;
            }
            [data-bs-theme="dark"] .sidebar .nav-link.active {
                background-color: #334155 !important;
                color: #ffffff !important;
            }
            [data-bs-theme="dark"] .dropdown-menu {
                background-color: #1e293b !important;
                border: 1px solid #334155 !important;
            }
            [data-bs-theme="dark"] .dropdown-item {
                color: #cbd5e1 !important;
            }
            [data-bs-theme="dark"] .dropdown-item:hover {
                background-color: #334155 !important;
                color: #ffffff !important;
            }
        `;
        document.head.appendChild(styleEl);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCustomStyles);
    } else {
        injectCustomStyles();
    }
})();

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

        // Khởi tạo Offcanvas Sidebar của Wishlist nếu chưa tồn tại
        if (!document.getElementById('wishlistOffcanvas')) {
            const offcanvasDiv = document.createElement('div');
            offcanvasDiv.id = 'wishlistOffcanvas';
            offcanvasDiv.className = 'offcanvas offcanvas-end';
            offcanvasDiv.setAttribute('tabindex', '-1');
            offcanvasDiv.setAttribute('aria-labelledby', 'wishlistOffcanvasLabel');
            offcanvasDiv.style.borderRadius = '16px 0 0 16px';
            offcanvasDiv.style.width = '380px';
            offcanvasDiv.innerHTML = `
                <div class="offcanvas-header border-bottom py-3">
                    <h5 class="offcanvas-title fw-bold text-dark d-flex align-items-center gap-2" id="wishlistOffcanvasLabel">
                        <i class="bi bi-heart-fill text-danger"></i> Dịch vụ đã lưu
                    </h5>
                    <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div class="offcanvas-body" id="wishlistContainer" style="background-color:#f8f9fa;">
                    <div class="text-center text-muted py-5" id="wishlistEmptyState">
                        <i class="bi bi-heartbreak" style="font-size: 40px; opacity: 0.3; display: block; margin-bottom: 12px;"></i>
                        <p class="mb-0">Danh sách yêu thích trống.</p>
                    </div>
                    <div id="wishlistItemsList" class="d-flex flex-column gap-2"></div>
                </div>
            `;
            document.body.appendChild(offcanvasDiv);
        }

        // Nếu là Admin, chèn thêm link Quản Trị Viên
        if (user && user.role === 'admin') {
            const adminLi = document.createElement('li');
            adminLi.className = 'nav-item auth-item align-self-center';
            adminLi.innerHTML = `<a class="nav-link fw-semibold text-warning" href="admin.html"><i class="bi bi-shield-lock me-1"></i>Quản Trị Viên</a>`;
            ul.insertBefore(adminLi, ul.firstChild);
        }

        // Chèn nút Chuông thông báo (Notification Bell) nếu User đăng nhập
        if (user) {
            const notifLi = document.createElement('li');
            notifLi.className = 'nav-item dropdown auth-item align-self-center ms-lg-2';
            notifLi.innerHTML = `
                <a class="nav-link position-relative px-2 py-2 text-dark" href="#" id="notificationDropdownToggle" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="cursor:pointer;" title="Thông báo">
                    <i class="bi bi-bell fs-5"></i>
                    <span class="notification-badge-count position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size:9px;display:none;">0</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg rounded-4 border-0" style="width:360px;max-height:480px;overflow-y:auto;" id="notificationDropdown" aria-labelledby="notificationDropdownToggle">
                </ul>
            `;
            ul.appendChild(notifLi);

            // Khởi tạo bootstrap dropdown và render
            if (typeof Utils !== 'undefined' && Utils.notifications) {
                const notifToggle = notifLi.querySelector('#notificationDropdownToggle');
                if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                    new bootstrap.Dropdown(notifToggle);
                }
                Utils.notifications.renderDropdown(user.id);
                Utils.notifications.updateBadge(user.id);
            }
        }

        // Chèn nút Wishlist (Yêu thích) vào Navbar cho cả Guest và User
        const wishlistLi = document.createElement('li');
        wishlistLi.className = 'nav-item auth-item align-self-center ms-lg-2';
        wishlistLi.innerHTML = `
            <a class="nav-link fw-semibold position-relative px-2 py-2 text-dark btn-navbar-wishlist" href="#" style="cursor:pointer;" title="Dịch vụ đã lưu">
                <i class="bi bi-heart-fill text-danger fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger wishlist-badge" style="font-size:10px; display: none;">0</span>
            </a>
        `;
        ul.appendChild(wishlistLi);

        // Thiết lập sự kiện click mở Wishlist Offcanvas
        const wishlistBtn = wishlistLi.querySelector('.btn-navbar-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const offcanvasEl = document.getElementById('wishlistOffcanvas');
                if (offcanvasEl && typeof bootstrap !== 'undefined') {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
                    bsOffcanvas.show();
                    if (typeof Wishlist !== 'undefined') {
                        Wishlist.renderWishlist();
                    }
                }
            });
        }

        // Cập nhật badge số lượng ngay sau khi hiển thị
        if (typeof Wishlist !== 'undefined') {
            Wishlist.updateBadge();
        }

        // Chèn nút Đổi giao diện (Theme Switcher) vào Navbar cho cả Guest và User
        const themeLi = document.createElement('li');
        themeLi.className = 'nav-item auth-item align-self-center ms-lg-2';
        const currentTheme = localStorage.getItem('giggo_theme') || 'light';
        themeLi.innerHTML = `
            <a class="nav-link fw-semibold px-2 py-2 text-dark btn-navbar-theme" href="#" style="cursor:pointer;" title="Chuyển chế độ sáng/tối">
                <i class="bi ${currentTheme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-fill text-muted'} fs-5" id="navbarThemeIcon"></i>
            </a>
        `;
        ul.appendChild(themeLi);

        // Thiết lập sự kiện click đổi theme
        const themeBtn = themeLi.querySelector('.btn-navbar-theme');
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const htmlEl = document.documentElement;
                const newTheme = htmlEl.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
                
                // Cập nhật thuộc tính và lưu trữ
                htmlEl.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('giggo_theme', newTheme);
                
                // Cập nhật icon tương ứng
                const themeIcon = document.getElementById('navbarThemeIcon');
                if (themeIcon) {
                    if (newTheme === 'dark') {
                        themeIcon.className = 'bi bi-sun-fill text-warning fs-5';
                    } else {
                        themeIcon.className = 'bi bi-moon-fill text-muted fs-5';
                    }
                }
            });
        }

        if (user) {
            // User is logged in
            // Chèn ví điện tử nếu là Client hoặc Freelancer
            if (user.role === 'client' || user.role === 'freelancer') {
                const walletLi = document.createElement('li');
                walletLi.className = 'nav-item auth-item align-self-center ms-lg-2';
                const bal = (typeof Wallet !== 'undefined') ? Wallet.getBalance(user.id, user.role) : 0;
                const themeClass = user.role === 'client' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-info-subtle text-info border border-info-subtle';
                walletLi.innerHTML = `
                    <a class="nav-link px-2 py-1 text-decoration-none" href="${this.getDashboardUrl(user.role)}" title="Số dư ví của bạn (nhấn để vào Dashboard)">
                        <span class="badge ${themeClass} px-3 py-2 rounded-pill d-flex align-items-center gap-1 fw-bold shadow-sm">
                            <i class="bi bi-wallet2"></i>
                            <span id="navbarWalletBalance">${(typeof Utils !== 'undefined') ? Utils.formatCurrency(bal) : bal}</span>
                        </span>
                    </a>
                `;
                ul.appendChild(walletLi);
            }

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
function initAuth() {
    Auth.updateNavbar();
}

// Lắng nghe sự kiện cập nhật ví để đồng bộ hóa Navbar
window.addEventListener('walletUpdate', (e) => {
    const user = Auth.getCurrentUser();
    if (user && String(e.detail.userId) === String(user.id)) {
        const navbarWalletSpan = document.getElementById('navbarWalletBalance');
        if (navbarWalletSpan && typeof Utils !== 'undefined') {
            navbarWalletSpan.textContent = Utils.formatCurrency(e.detail.balance);
        }
    }
});

// Lắng nghe sự kiện cập nhật thông báo để đồng bộ hóa Navbar
window.addEventListener('notificationUpdate', (e) => {
    const user = Auth.getCurrentUser();
    if (user && String(e.detail.userId) === String(user.id)) {
        if (typeof Utils !== 'undefined' && Utils.notifications) {
            Utils.notifications.renderDropdown(user.id);
            Utils.notifications.updateBadge(user.id);
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
