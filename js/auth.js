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
                .navbar-nav .nav-link,
                .navbar-nav .btn-switch-role,
                .navbar-nav .badge {
                    white-space: nowrap !important;
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

            /* Pulse animation for shield icon */
            @keyframes pulse-glow {
                0% {
                    transform: scale(1);
                    filter: drop-shadow(0 0 10px rgba(220, 53, 69, 0.5));
                }
                50% {
                    transform: scale(1.05);
                    filter: drop-shadow(0 0 25px rgba(220, 53, 69, 0.8));
                }
                100% {
                    transform: scale(1);
                    filter: drop-shadow(0 0 10px rgba(220, 53, 69, 0.5));
                }
            }
            .pulse-shield {
                animation: pulse-glow 3s infinite ease-in-out;
            }

            /* Custom design for banned overlay */
            #banned-ip-overlay {
                background: radial-gradient(circle at center, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 17, 0.99) 100%) !important;
            }
            .banned-card {
                background: rgba(30, 41, 59, 0.75) !important;
                border: 1px solid rgba(239, 68, 68, 0.3) !important;
                border-radius: 24px !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(239, 68, 68, 0.05) !important;
                max-width: 580px !important;
                overflow: hidden;
            }
            .banned-info-box {
                background: rgba(15, 23, 42, 0.6) !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                border-radius: 12px !important;
            }
            .banned-btn-copy {
                background: transparent;
                border: none;
                color: #64748b;
                transition: all 0.2s;
            }
            .banned-btn-copy:hover {
                color: #cbd5e1;
                transform: scale(1.1);
            }

            /* Appeal form styling */
            .appeal-form-container {
                background: rgba(15, 23, 42, 0.4) !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                border-radius: 16px !important;
                padding: 20px;
                margin-top: 20px;
                text-align: left;
            }
            .appeal-form-title {
                font-size: 0.95rem;
                font-weight: 700;
                color: #cbd5e1;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .appeal-input {
                background: rgba(15, 23, 42, 0.8) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #ffffff !important;
                border-radius: 8px !important;
                padding: 10px 14px !important;
                font-size: 0.9rem !important;
            }
            .appeal-input:focus {
                border-color: rgba(239, 68, 68, 0.5) !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
                outline: none !important;
            }

            /* Shared IP Banner styling */
            .shared-ip-widget {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                max-width: 400px;
                background: rgba(30, 41, 59, 0.85) !important;
                border: 1px solid rgba(245, 158, 11, 0.3) !important;
                border-radius: 16px !important;
                backdrop-filter: blur(16px) !important;
                -webkit-backdrop-filter: blur(16px) !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
                color: #cbd5e1 !important;
                display: none;
            }
            .shared-ip-widget-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                padding: 12px 16px;
            }
            .shared-ip-widget-title {
                font-size: 0.9rem;
                font-weight: 700;
                color: #f59e0b;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .shared-ip-widget-body {
                padding: 16px;
                font-size: 0.85rem;
                line-height: 1.5;
            }
            .shared-ip-widget-footer {
                padding: 12px 16px;
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
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

// Tự động phát hiện IP thiết bị
(function initVisitorIp() {
    // 1. Kiểm tra tham số URL giả lập để phục vụ kiểm thử
    const urlParams = new URLSearchParams(window.location.search);
    const simIp = urlParams.get('simIp');
    if (simIp) {
        localStorage.setItem('visitorIp', simIp);
        console.log('Đã giả lập IP thiết bị qua URL:', simIp);
        return;
    }

    // 2. Nếu đã có trong localStorage, sử dụng làm IP hiện tại
    let currentIp = localStorage.getItem('visitorIp');
    if (!currentIp) {
        // Khởi tạo IP giả lập ngẫu nhiên bền vững
        const randOctet = Math.floor(Math.random() * 253) + 1;
        currentIp = `113.161.42.${randOctet}`;
        localStorage.setItem('visitorIp', currentIp);
    }

    // 3. Cập nhật IP thật từ API nếu khả dụng (chạy bất đồng bộ)
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            if (data && data.ip) {
                // Chỉ cập nhật nếu không phải đang giả lập simIp từ URL
                if (!window.location.search.includes('simIp')) {
                    localStorage.setItem('visitorIp', data.ip);
                    console.log('Đã cập nhật IP thật thiết bị:', data.ip);
                }
            }
        })
        .catch(err => {
            console.warn('Không thể kết nối api.ipify.org để lấy IP thật, đang dùng IP:', currentIp);
        });
})();

const Auth = {
    // Sinh/Lấy Device ID duy nhất (độ bền vững cao, lưu cả localStorage và cookie)
    getOrCreateDeviceId: function() {
        let devId = localStorage.getItem('giggo_device_id');
        if (!devId) {
            const match = document.cookie.match(new RegExp('(^| )giggo_device_id=([^;]+)'));
            if (match) {
                devId = match[2];
                localStorage.setItem('giggo_device_id', devId);
            }
        }
        if (!devId) {
            devId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
            localStorage.setItem('giggo_device_id', devId);
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 10);
            document.cookie = `giggo_device_id=${devId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        } else {
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 10);
            document.cookie = `giggo_device_id=${devId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        }
        return devId;
    },

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
        const user = this.getCurrentUser();
        if (user && typeof Utils !== 'undefined' && Utils.logAudit) {
            Utils.logAudit('Đăng xuất', `Người dùng ${user.name} (${user.role}) đã đăng xuất.`);
        }
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
            const dashboardUrl = this.getDashboardUrl(user.role);

            // Chèn ví điện tử nếu là Client hoặc Freelancer
            if (user.role === 'client' || user.role === 'freelancer') {
                const walletLi = document.createElement('li');
                walletLi.className = 'nav-item auth-item align-self-center ms-lg-2';
                const themeClass = user.role === 'client' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-info-subtle text-info border border-info-subtle';
                walletLi.innerHTML = `
                    <a class="nav-link px-2 py-1 text-decoration-none" href="${dashboardUrl}" title="Số dư ví của bạn (nhấn để vào Dashboard)">
                        <span class="badge ${themeClass} px-3 py-2 rounded-pill d-flex align-items-center gap-1 fw-bold shadow-sm">
                            <i class="bi bi-wallet2"></i>
                            <span id="navbarWalletBalance">0 ₫</span>
                        </span>
                    </a>
                `;
                ul.appendChild(walletLi);

                // Cập nhật số dư bất đồng bộ
                if (typeof Wallet !== 'undefined') {
                    try {
                        Wallet.getBalance(user.id, user.role)
                            .then(bal => {
                                const valSpan = walletLi.querySelector('#navbarWalletBalance');
                                if (valSpan && typeof Utils !== 'undefined') {
                                    valSpan.textContent = Utils.formatCurrency(bal);
                                }
                            })
                            .catch(err => console.warn('Lỗi tải số dư ví lên navbar:', err));
                    } catch (e) {
                        console.error('Lỗi khi gọi Wallet.getBalance:', e);
                    }
                }
            }

            // Role switcher button (for client / freelancer)
            if (user.role === 'client' || user.role === 'freelancer') {
                const switchRoleLi = document.createElement('li');
                switchRoleLi.className = 'nav-item auth-item ms-lg-2 align-self-center';
                const isClient = user.role === 'client';
                const switchText = isClient ? 'Chuyển sang Freelancer' : 'Chuyển sang Khách Hàng';
                const switchIcon = isClient ? 'bi-person-workspace' : 'bi-briefcase';
                const btnBorderColor = isClient ? '#006b5d' : '#4f46e5';
                const btnTextColor = isClient ? '#006b5d' : '#4f46e5';
                const btnHoverBg = isClient ? '#006b5d' : '#4f46e5';
                
                switchRoleLi.innerHTML = `
                    <button class="btn btn-sm fw-bold rounded-pill px-3 py-1.5 shadow-sm d-flex align-items-center gap-1 btn-switch-role" 
                            style="font-size: 12px; border: 1.5px solid ${btnBorderColor}; color: ${btnTextColor}; background: transparent; transition: all 0.2s; white-space: nowrap;"
                            onmouseover="this.style.background='${btnHoverBg}'; this.style.color='#ffffff';"
                            onmouseout="this.style.background='transparent'; this.style.color='${btnTextColor}';">
                        <i class="bi ${switchIcon}"></i> ${switchText}
                    </button>
                `;
                ul.appendChild(switchRoleLi);

                // Bind click event
                const switchBtn = switchRoleLi.querySelector('.btn-switch-role');
                switchBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const nextRole = user.role === 'client' ? 'freelancer' : 'client';
                    
                    switchBtn.disabled = true;
                    switchBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Đang chuyển...`;

                    try {
                        if (typeof api !== 'undefined') {
                            await api.put(`/users/${user.id}`, { role: nextRole });
                        }
                    } catch (err) {
                        console.warn("MockAPI update error, using fallback update:", err);
                    }

                    // Update local storage
                    user.role = nextRole;
                    Auth.setCurrentUser(user);

                    // Toast message
                    if (typeof Utils !== 'undefined') {
                        Utils.showToast(`Đã chuyển vai trò sang ${nextRole === 'client' ? 'Khách Hàng' : 'Freelancer'}!`, 'success');
                    }

                    // Redirect to home page
                    setTimeout(() => {
                        window.location.replace('index.html');
                    }, 800);
                });
            }

            // User Profile Capsule as a unified Dropdown Menu (Task: Redesign Header)
            const userProfileLi = document.createElement('li');
            userProfileLi.className = 'nav-item dropdown auth-item ms-lg-3 align-self-center';
            userProfileLi.innerHTML = `
                <a class="nav-link dropdown-toggle d-flex align-items-center fw-semibold text-dark bg-white rounded-pill px-3 py-1.5 shadow-sm border" 
                   href="#" id="userProfileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 13px; gap: 4px; white-space: nowrap;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" class="rounded-circle me-1" width="24" height="24" alt="${user.name}">
                    <span>${user.name}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg rounded-4 border-0 p-2 mt-2" aria-labelledby="userProfileDropdown" style="width: 220px;">
                    <li class="dropdown-header text-dark border-bottom pb-2 mb-2">
                        <div class="fw-bold text-truncate">${user.name}</div>
                        <small class="text-muted text-uppercase fw-semibold" style="font-size: 10px; letter-spacing: 0.05em;">
                            Vai trò: ${user.role === 'client' ? 'Khách Hàng' : user.role === 'freelancer' ? 'Freelancer' : 'Admin'}
                        </small>
                    </li>
                    <li>
                        <a class="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 small fw-medium" href="${dashboardUrl}">
                            <i class="bi bi-speedometer2 text-primary fs-6"></i> Dashboard
                        </a>
                    </li>
                    ${user.role === 'freelancer' ? `
                    <li>
                        <a class="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 small fw-medium" href="portfolio.html">
                            <i class="bi bi-person-badge text-primary fs-6"></i> Hồ Sơ Năng Lực
                        </a>
                    </li>
                    ` : user.role === 'client' ? `
                    <li>
                        <a class="dropdown-item rounded-3 py-2 d-flex align-items-center gap-2 small fw-medium" href="client-profile.html">
                            <i class="bi bi-person-badge text-primary fs-6"></i> Thiết lập hồ sơ
                        </a>
                    </li>
                    ` : ''}
                    <li><hr class="dropdown-divider my-2"></li>
                    <li>
                        <a class="dropdown-item text-danger rounded-3 py-2 d-flex align-items-center gap-2 small fw-bold btn-logout-navbar" href="#">
                            <i class="bi bi-box-arrow-right fs-6"></i> Đăng xuất
                        </a>
                    </li>
                </ul>
            `;
            ul.appendChild(userProfileLi);

            // Bind click event to all logout links inside the navbar
            ul.querySelectorAll('.btn-logout-navbar').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Auth.logout();
                });
            });
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

// Hiển thị màn hình khóa chặn IP toàn hệ thống (Giao diện mới cao cấp + Form khiếu nại)
function showBlockedOverlay(bannedIp, bannedDeviceId) {
    let overlay = document.getElementById('banned-ip-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'banned-ip-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.color = '#f1f5f9';
        overlay.style.backdropFilter = 'blur(15px)';
        overlay.style.webkitBackdropFilter = 'blur(15px)';
        
        overlay.innerHTML = `
            <div class="card banned-card border border-danger-subtle bg-dark text-white p-4 shadow-lg text-center mx-3">
                <div class="card-body py-4">
                    <div class="mb-4">
                        <i class="bi bi-shield-slash-fill text-danger pulse-shield" style="font-size: 64px; display: inline-block;"></i>
                    </div>
                    <h3 class="fw-bold text-danger mb-2" style="letter-spacing: 0.5px;">TRUY CẬP BỊ CHẶN</h3>
                    <p class="text-secondary-emphasis mb-4" style="color: #cbd5e1 !important; font-size: 0.95rem; line-height: 1.6;">
                        Thiết bị của bạn đã bị quản trị viên chặn truy cập vào hệ thống do phát hiện hoạt động vi phạm điều khoản chính sách của GigGo.
                    </p>
                    
                    <!-- Monospace Credentials Box -->
                    <div class="p-3 banned-info-box text-start mb-4">
                        <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                            <div>
                                <span class="d-block small text-muted text-uppercase" style="font-size: 9px; letter-spacing: 0.5px;">Địa chỉ IP thiết bị</span>
                                <strong class="text-warning text-monospace" style="font-size: 15px;">${bannedIp}</strong>
                            </div>
                            <button type="button" class="banned-btn-copy" id="btn-copy-ip" onclick="window.copyBannedDetail('${bannedIp}', 'btn-copy-ip')" title="Sao chép IP">
                                <i class="bi bi-copy"></i>
                            </button>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="d-block small text-muted text-uppercase" style="font-size: 9px; letter-spacing: 0.5px;">Mã nhận diện thiết bị (Device ID)</span>
                                <strong class="text-info text-monospace" style="font-size: 12px;">${bannedDeviceId}</strong>
                            </div>
                            <button type="button" class="banned-btn-copy" id="btn-copy-device" onclick="window.copyBannedDetail('${bannedDeviceId}', 'btn-copy-device')" title="Sao chép Device ID">
                                <i class="bi bi-copy"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Appeals & Tickets Integration -->
                    <div class="appeal-form-container">
                        <div class="appeal-form-title">
                            <i class="bi bi-envelope-paper-fill text-danger"></i> Gửi yêu cầu mở chặn (Appeal)
                        </div>
                        
                        <div id="banned-appeal-success" class="d-none text-center py-3">
                            <i class="bi bi-check-circle-fill text-success" style="font-size: 40px;"></i>
                            <h6 class="fw-bold text-success mt-2">Đã gửi khiếu nại thành công!</h6>
                            <p class="small text-muted mb-0">Mã yêu cầu của bạn là <strong class="text-white">#<span id="banned-ticket-id">0</span></strong>. Quản trị viên sẽ xem xét và phản hồi qua Email trong vòng 24h.</p>
                        </div>
                        
                        <div id="banned-appeal-form-wrapper">
                            <form id="banned-appeal-form">
                                <div class="row g-2 mb-2">
                                    <div class="col-sm-6">
                                        <input type="text" class="form-control appeal-input" id="appeal-name" placeholder="Họ và Tên" required>
                                    </div>
                                    <div class="col-sm-6">
                                        <input type="email" class="form-control appeal-input" id="appeal-email" placeholder="Email liên hệ" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <textarea class="form-control appeal-input" id="appeal-message" rows="2" placeholder="Lý do khiếu nại (ví dụ: Tôi sử dụng chung mạng WiFi với thiết bị vi phạm...)" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-danger w-100 fw-bold py-2 rounded-3" id="btn-submit-appeal" style="font-size: 0.9rem; transition: background-color 0.2s;">
                                    <i class="bi bi-send me-1"></i> Gửi yêu cầu khiếu nại
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Setup copy helper function
        window.copyBannedDetail = function(text, btnId) {
            navigator.clipboard.writeText(text).then(() => {
                const $btn = $('#' + btnId);
                const origHtml = $btn.html();
                $btn.html('<i class="bi bi-check-lg text-success"></i>');
                setTimeout(() => {
                    $btn.html(origHtml);
                }, 1500);
            });
        };

        // Form Submit Handler
        $(document).on('submit', '#banned-appeal-form', function(e) {
            e.preventDefault();
            const name = $('#appeal-name').val().trim();
            const email = $('#appeal-email').val().trim();
            const message = $('#appeal-message').val().trim();
            const $btn = $('#btn-submit-appeal');
            
            if (!name || !email || !message) {
                alert('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang gửi...');
            
            const newTicket = {
                userName: name,
                userEmail: email,
                subject: 'Khiếu nại chặn truy cập (IP: ' + bannedIp + ')',
                description: 'Thông tin khiếu nại từ giao diện khóa.\nIP: ' + bannedIp + '\nDevice ID: ' + bannedDeviceId + '\nLý do: ' + message,
                status: 'open',
                createdAt: new Date().toISOString()
            };
            
            if (typeof api !== 'undefined') {
                api.post('/tickets', newTicket)
                    .then(res => {
                        $('#banned-appeal-form-wrapper').slideUp(400, function() {
                            $('#banned-appeal-success').removeClass('d-none').hide().fadeIn(400);
                            $('#banned-ticket-id').text(res.id);
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Không thể gửi khiếu nại lúc này. Vui lòng thử lại sau.');
                        $btn.prop('disabled', false).html('<i class="bi bi-send me-1"></i> Gửi yêu cầu khiếu nại');
                    });
            } else {
                setTimeout(() => {
                    $('#banned-appeal-form-wrapper').slideUp(400, function() {
                        $('#banned-appeal-success').removeClass('d-none').hide().fadeIn(400);
                        $('#banned-ticket-id').text(Math.floor(Math.random() * 900) + 100);
                    });
                }, 1000);
            }
        });
    }
}

// Hiển thị Banner cảnh báo mạng trùng IP tinh tế ở góc dưới phải
function showSharedIpBanner(ipAddress) {
    if (document.getElementById('shared-ip-banner-widget')) return;
    const widget = document.createElement('div');
    widget.id = 'shared-ip-banner-widget';
    widget.className = 'shared-ip-widget';
    widget.innerHTML = `
        <div class="shared-ip-widget-header">
            <span class="shared-ip-widget-title">
                <i class="bi bi-exclamation-triangle-fill text-warning"></i> Phát hiện trùng IP mạng
            </span>
            <button type="button" class="btn-close btn-close-white btn-sm" id="btn-close-shared-ip" style="font-size:10px;"></button>
        </div>
        <div class="shared-ip-widget-body">
            Hệ thống phát hiện IP mạng của bạn (<strong>${ipAddress}</strong>) đang trùng với một thiết bị bị chặn truy cập.
            <br><br>
            Tuy nhiên, do bạn đang truy cập bằng một thiết bị khác, GigGo <strong>cho phép bạn hoạt động bình thường</strong>. Vui lòng Đăng nhập để sử dụng đầy đủ các chức năng.
        </div>
        <div class="shared-ip-widget-footer">
            <button class="btn btn-sm btn-outline-light text-nowrap" id="btn-dismiss-shared-ip" style="font-size: 11px;">Đóng</button>
            <a href="login.html" class="btn btn-sm btn-warning text-nowrap fw-bold" style="font-size: 11px; color:#0f172a;"><i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập</a>
        </div>
    `;
    document.body.appendChild(widget);
    
    // Slide in using jQuery after a minor delay
    setTimeout(() => {
        $(widget).hide().slideDown(400);
    }, 1500);
    
    // Close events
    $(document).on('click', '#btn-close-shared-ip, #btn-dismiss-shared-ip', function(e) {
        e.preventDefault();
        $(widget).slideUp(400, function() {
            $(this).remove();
        });
    });
}

// Gọi updateNavbar và kiểm tra trạng thái khóa/chặn IP của tài khoản khi DOM được load
function initAuth() {
    Auth.updateNavbar();
    
    const currentDeviceId = Auth.getOrCreateDeviceId();
    const currentIp = localStorage.getItem('visitorIp') || '113.161.42.100';
    const isLoginPage = window.location.pathname.includes('login.html');
    const currentUser = Auth.getCurrentUser();
    
    // Nếu là admin đang đăng nhập, bỏ qua kiểm tra chặn IP để tránh tự khóa admin
    if (currentUser && currentUser.role === 'admin') {
        return;
    }

    if (typeof api !== 'undefined') {
        api.get('/users')
            .then(users => {
                if (Array.isArray(users)) {
                    // 1. Kiểm tra xem IP hiện tại có bị ban hay không
                    const isIpBanned = users.some(u => u.ipBanned === true && u.ipAddress === currentIp && u.role !== 'admin');
                    
                    // 2. Kiểm tra xem thiết bị này có bị ban hay không
                    const isDeviceBanned = users.some(u => u.ipBanned === true && u.ipAddress === currentIp && u.deviceId === currentDeviceId && u.role !== 'admin');
                    
                    if (isDeviceBanned) {
                        // Đăng xuất ngay nếu đang đăng nhập
                        if (currentUser) {
                            localStorage.removeItem('currentUser');
                        }
                        
                        // Không chặn hiển thị form trên trang đăng nhập để admin có thể đăng nhập từ chính thiết bị này nếu cần gỡ chặn
                        if (!isLoginPage) {
                            showBlockedOverlay(currentIp, currentDeviceId);
                            return;
                        }
                    } else if (isIpBanned) {
                        // Trường hợp trùng IP nhưng thiết bị khác (Shared IP Network)
                        // Chỉ hiển thị banner nếu chưa đăng nhập
                        if (!currentUser && !isLoginPage) {
                            showSharedIpBanner(currentIp);
                        }
                    }
                }
                
                // Nếu IP không bị chặn cứng, kiểm tra tiếp trạng thái tài khoản đang đăng nhập
                if (currentUser) {
                    const loggedInUser = users.find(u => String(u.id) === String(currentUser.id));
                    if (loggedInUser) {
                        if (loggedInUser.status === 'banned' || loggedInUser.ipBanned) {
                            setTimeout(() => {
                                alert(loggedInUser.ipBanned 
                                    ? 'Thiết bị của bạn đã bị quản trị viên chặn IP truy cập do vi phạm chính sách của hệ thống.'
                                    : 'Tài khoản của bạn đã bị khóa bởi quản trị viên.');
                                Auth.logout();
                            }, 500);
                        }
                    }
                }
            })
            .catch(err => {
                console.warn('Lỗi kiểm tra trạng thái IP/tài khoản từ API:', err);
                // Fallback cục bộ nếu MockAPI không khả dụng
                if (currentUser && (currentUser.status === 'banned' || currentUser.ipBanned)) {
                    if (!isLoginPage) {
                        showBlockedOverlay(currentIp, currentDeviceId);
                        localStorage.removeItem('currentUser');
                    }
                }
            });
    }
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
