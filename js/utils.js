/**
 * UTILS.JS - Pure JavaScript Utility Functions
 * Các hàm hỗ trợ dùng chung cho dự án (Pure JS)
 */

const Utils = {
    /**
     * Định dạng số tiền tệ VNĐ
     * @param {number|string} amount 
     * @returns {string} Chuỗi tiền tệ đã định dạng
     */
    formatCurrency: function(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return "0 ₫";
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(num);
    },

    /**
     * Bật tắt hiển thị của một thẻ DOM dựa trên ID
     * @param {string} elementId 
     * @param {boolean} isVisible 
     */
    toggleVisibility: function(elementId, isVisible) {
        const el = document.getElementById(elementId);
        if (el) {
            el.style.display = isVisible ? 'block' : 'none';
        }
    },

    /**
     * Rút gọn đoạn văn bản dài
     * @param {string} text 
     * @param {number} maxLength 
     * @returns {string} 
     */
    truncateText: function(text, maxLength = 100) {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Thuật toán phân trang mảng dữ liệu (Pagination Logic)
     * @param {Array} array Mảng dữ liệu đầu vào
     * @param {number} currentPage Trang hiện tại (1-indexed)
     * @param {number} itemsPerPage Số phần tử trên mỗi trang
     * @returns {Object} Chứa mảng đã cắt và tổng số trang
     */
    paginateArray: function(array, currentPage, itemsPerPage) {
        const totalItems = array.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        // Đảm bảo currentPage nằm trong giới hạn hợp lệ
        let page = currentPage;
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        return {
            paginatedItems: array.slice(startIndex, endIndex),
            totalPages: totalPages,
            currentPage: page
        };
    },

    /**
     * Render UI bộ điều hướng phân trang bằng Bootstrap
     * @param {string} containerId ID của thẻ chứa Pagination
     * @param {number} currentPage Trang hiện tại
     * @param {number} totalPages Tổng số trang
     * @param {Function} onPageChange Hàm callback khi chuyển trang
     */
    renderPagination: function(containerId, currentPage, totalPages, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '<nav><ul class="pagination justify-content-center">';

        // Nút Prev
        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        html += `<li class="page-item ${prevDisabled}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" tabindex="-1">Previous</a>
                 </li>`;

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = currentPage === i ? 'active' : '';
            html += `<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        // Nút Next
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';
        html += `<li class="page-item ${nextDisabled}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
                 </li>`;

        html += '</ul></nav>';
        container.innerHTML = html;

        // Gắn sự kiện click
        container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = e.target.closest('.page-item');
                if (parent && parent.classList.contains('disabled')) return;
                
                const page = parseInt(e.target.getAttribute('data-page'));
                if (onPageChange && typeof onPageChange === 'function') {
                    onPageChange(page);
                }
            });
        });
    },

    /**
     * Escape HTML string to prevent XSS attacks
     * @param {string} str
     * @returns {string} Safe escaped string
     */
    escapeHtml: function(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Hiển thị Toast Notification thay thế alert()
     * @param {string} message - Nội dung thông báo
     * @param {string} type - success | error | warning | info
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    showToast: function(message, type = 'success', duration = 4000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const config = {
            success: { bg: 'bg-success', icon: 'bi-check-circle-fill' },
            error: { bg: 'bg-danger', icon: 'bi-x-circle-fill' },
            warning: { bg: 'bg-warning text-dark', icon: 'bi-exclamation-triangle-fill' },
            info: { bg: 'bg-info text-dark', icon: 'bi-info-circle-fill' }
        };

        const { bg, icon } = config[type] || config.info;

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white ${bg} border-0 mb-2`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body fw-medium d-flex align-items-center gap-2">
                    <i class="bi ${icon} fs-5"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        toastContainer.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: duration });
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    },

    // ================================================================
    // A3: NOTIFICATION CENTER
    // ================================================================
    notifications: {
        getAll: function(userId) {
            const key = `notifications_${userId}`;
            return JSON.parse(localStorage.getItem(key) || '[]');
        },
        add: function(userId, message, type = 'info', link = '') {
            const key = `notifications_${userId}`;
            const notifs = JSON.parse(localStorage.getItem(key) || '[]');
            notifs.unshift({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                message: message,
                type: type,
                link: link,
                read: false,
                createdAt: new Date().toISOString()
            });
            if (notifs.length > 50) notifs.length = 50;
            localStorage.setItem(key, JSON.stringify(notifs));
            window.dispatchEvent(new CustomEvent('notificationUpdate', { detail: { userId: userId } }));
        },
        markRead: function(userId, id) {
            const key = `notifications_${userId}`;
            const notifs = JSON.parse(localStorage.getItem(key) || '[]');
            const n = notifs.find(n => n.id === id);
            if (n) n.read = true;
            localStorage.setItem(key, JSON.stringify(notifs));
        },
        markAllRead: function(userId) {
            const key = `notifications_${userId}`;
            const notifs = JSON.parse(localStorage.getItem(key) || '[]');
            notifs.forEach(n => n.read = true);
            localStorage.setItem(key, JSON.stringify(notifs));
        },
        getUnreadCount: function(userId) {
            return this.getAll(userId).filter(n => !n.read).length;
        },
        renderDropdown: function(userId, containerId = 'notificationDropdown') {
            const container = document.getElementById(containerId);
            if (!container) return;
            const self = this;
            const notifs = self.getAll(userId);
            const unread = notifs.filter(n => !n.read);
            const totalUnread = unread.length;

            container.innerHTML = `
                <div class="dropdown-header d-flex justify-content-between align-items-center px-3 py-2">
                    <strong class="small">Thông báo</strong>
                    ${totalUnread > 0 ? `<span class="badge bg-danger rounded-pill">${totalUnread}</span>` : ''}
                </div>
                ${notifs.length === 0 ? '<div class="dropdown-item text-muted text-center small py-3">hiện chưa thông báo gì ...</div>' : ''}
                ${notifs.slice(0, 10).map(n => `
                    <a class="dropdown-item ${n.read ? '' : 'fw-semibold bg-light'} px-3 py-2 small border-bottom" href="${n.link || '#'}" data-notif-id="${n.id}">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi ${n.type === 'success' ? 'bi-check-circle-fill text-success' : n.type === 'error' ? 'bi-x-circle-fill text-danger' : n.type === 'warning' ? 'bi-exclamation-triangle-fill text-warning' : 'bi-info-circle-fill text-primary'}"></i>
                            <span class="flex-grow-1">${self.escapeHtml(n.message)}</span>
                            ${n.read ? '' : '<span class="badge bg-primary rounded-pill" style="width:8px;height:8px;padding:0;"></span>'}
                        </div>
                        <div class="text-muted fw-normal small mt-1" style="font-size:10px;">${new Date(n.createdAt).toLocaleDateString('vi-VN')}</div>
                    </a>
                `).join('')}
                ${notifs.length > 0 ? '<div class="dropdown-divider m-0"></div><button class="dropdown-item text-center small py-2 text-primary fw-semibold" id="markAllReadBtn">Đánh dấu đã đọc tất cả</button>' : ''}
            `;

            container.querySelectorAll('[data-notif-id]').forEach(el => {
                el.addEventListener('click', (e) => {
                    self.markRead(userId, el.dataset.notifId);
                });
            });

            const markAllBtn = container.querySelector('#markAllReadBtn');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    self.markAllRead(userId);
                    self.renderDropdown(userId, containerId);
                    self.updateBadge(userId);
                });
            }
        },
        updateBadge: function(userId) {
            const count = this.getUnreadCount(userId);
            document.querySelectorAll('.notification-badge-count').forEach(el => {
                el.textContent = count;
                el.style.display = count > 0 ? 'inline' : 'none';
            });
        }
    },

    // ================================================================
    // B2: FREELANCER BADGE & LEVEL SYSTEM
    // ================================================================
    getFreelancerLevel: function(completedJobs) {
        if (completedJobs >= 100) return { level: 'Diamond', label: 'Kim Cương', min: 100, className: 'badge-diamond' };
        if (completedJobs >= 50) return { level: 'Platinum', label: 'Bạch Kim', min: 50, className: 'badge-platinum' };
        if (completedJobs >= 20) return { level: 'Gold', label: 'Vàng', min: 20, className: 'badge-gold' };
        if (completedJobs >= 5) return { level: 'Silver', label: 'Bạc', min: 5, className: 'badge-silver' };
        return { level: 'Bronze', label: 'Đồng', min: 0, className: 'badge-bronze' };
    },

    getLevelProgress: function(completedJobs) {
        const levels = [
            { min: 0, max: 5, label: 'Đồng' },
            { min: 5, max: 20, label: 'Bạc' },
            { min: 20, max: 50, label: 'Vàng' },
            { min: 50, max: 100, label: 'Bạch Kim' },
            { min: 100, max: Infinity, label: 'Kim Cương' }
        ];
        let current = levels.find(l => completedJobs < l.max) || levels[levels.length - 1];
        let prevMin = levels[Math.max(0, levels.indexOf(current) - 1)]?.min || 0;
        let progress = Math.min(100, ((completedJobs - prevMin) / (current.max - prevMin)) * 100);
        return { progress: Math.max(0, progress), currentLabel: current.label, nextLabel: current.max === Infinity ? 'MAX' : current.label, completed: completedJobs };
    },

    renderFreelancerBadge: function(completedJobs) {
        const level = this.getFreelancerLevel(completedJobs);
        const prog = this.getLevelProgress(completedJobs);
        return `
            <div class="d-flex align-items-center gap-2 mb-2">
                <span class="freelancer-badge ${level.className}"><i class="bi bi-star-fill me-1"></i>${level.label}</span>
                <small class="text-muted">${completedJobs} dự án</small>
            </div>
            <div class="freelancer-level-bar">
                <div class="level-progress" style="width:${prog.progress}%"></div>
            </div>
            <small class="text-muted">Cấp tiếp theo: ${prog.nextLabel}</small>
        `;
    },

    // ================================================================
    // B5: DEADLINE COUNTDOWN
    // ================================================================
    startCountdown: function(elementId, deadlineISO, onComplete) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const deadline = new Date(deadlineISO).getTime();

        function tick() {
            const now = Date.now();
            const diff = deadline - now;
            if (diff <= 0) {
                el.innerHTML = '<span class="text-danger fw-bold"><i class="bi bi-clock-fill me-1"></i>Quá hạn</span>';
                if (onComplete) onComplete();
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            let cls = 'countdown-normal';
            if (diff < 86400000) cls = 'countdown-urgent';
            else if (diff < 604800000) cls = 'countdown-warning';
            el.innerHTML = `<span class="countdown-timer ${cls}"><i class="bi bi-clock me-1"></i>${days > 0 ? days + 'ng ' : ''}${hours}h ${mins}p</span>`;
        }

        tick();
        setInterval(tick, 60000);
    },

    // ================================================================
    // B7: EXPORT CSV/PDF
    // ================================================================
    exportCSV: function(filename, headers, rows) {
        const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => {
            const s = String(cell);
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    exportPDF: function(title, elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>${title}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>body{padding:40px;font-family:Inter,sans-serif}table{width:100%}@media print{@page{margin:20mm}}</style>
            </head><body><h2 class="mb-4">${title}</h2>${el.outerHTML}</body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 500);
    }
};

/**
 * WISHLIST.JS - Quản lý Chức năng Yêu thích (Wishlist) lưu trữ qua LocalStorage
 */
const Wishlist = {
    // Lấy danh sách dịch vụ yêu thích từ localStorage dựa trên tài khoản đang đăng nhập
    getWishlist: function() {
        const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
        const key = 'giggo_wishlist_' + (currentUser ? currentUser.id : 'guest');
        const list = localStorage.getItem(key);
        return list ? JSON.parse(list) : [];
    },

    // Lưu danh sách dịch vụ yêu thích vào localStorage
    saveWishlist: function(list) {
        const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
        const key = 'giggo_wishlist_' + (currentUser ? currentUser.id : 'guest');
        localStorage.setItem(key, JSON.stringify(list));
        this.updateBadge();
    },

    // Kiểm tra xem dịch vụ đã có trong danh sách yêu thích chưa
    has: function(serviceId) {
        const list = this.getWishlist();
        return list.some(item => String(item.id) === String(serviceId));
    },

    // Thêm hoặc xóa một dịch vụ khỏi danh sách yêu thích
    toggle: function(service) {
        let list = this.getWishlist();
        const index = list.findIndex(item => String(item.id) === String(service.id));
        let added = false;
        if (index > -1) {
            list.splice(index, 1);
        } else {
            list.push(service);
            added = true;
        }
        this.saveWishlist(list);
        return added;
    },

    // Cập nhật số lượng trên badge ở Navbar
    updateBadge: function() {
        const badge = document.querySelector('.wishlist-badge');
        if (badge) {
            const list = this.getWishlist();
            if (list.length > 0) {
                badge.textContent = list.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    },

    // Hiển thị danh sách dịch vụ yêu thích bên trong Offcanvas Sidebar
    renderWishlist: function() {
        const listContainer = document.getElementById('wishlistItemsList');
        const emptyState = document.getElementById('wishlistEmptyState');
        if (!listContainer || !emptyState) return;

        const list = this.getWishlist();
        if (list.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        listContainer.innerHTML = '';

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card border-0 shadow-sm rounded-3 overflow-hidden p-2 d-flex flex-row gap-3 align-items-center mb-2';
            card.style.backgroundColor = '#ffffff';
            card.style.transition = 'transform 0.2s';
            
            card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-2px)');
            card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');

            const image = item.image || 'https://via.placeholder.com/400x200?text=No+Image';
            
            card.innerHTML = `
                <img src="${image}" class="rounded object-fit-cover shadow-sm" style="width: 70px; height: 70px; min-width: 70px;" alt="${Utils.escapeHtml(item.title)}">
                <div class="flex-grow-1 min-width-0">
                    <h6 class="fw-bold text-dark mb-1 text-truncate" style="font-size: 14px; line-height: 1.3;">${Utils.escapeHtml(item.title)}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-primary fw-bold" style="font-size: 13px;">${Utils.formatCurrency(item.price)}</span>
                        <div class="text-warning small" style="font-size: 11px;">
                            <i class="bi bi-star-fill"></i> ${parseFloat(item.freelancerRating || 0).toFixed(1)}
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column gap-2 ms-2">
                    <button class="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center btn-wishlist-remove" 
                            data-id="${item.id}"
                            title="Xóa khỏi yêu thích"
                            style="width: 28px; height: 28px; border-radius: 50%; padding: 0;">
                        <i class="bi bi-trash3" style="font-size: 12px;"></i>
                    </button>
                    <button class="btn btn-sm btn-primary d-flex align-items-center justify-content-center btn-wishlist-hire"
                            data-id="${item.id}"
                            title="Liên hệ ngay"
                            style="width: 28px; height: 28px; border-radius: 50%; padding: 0;">
                        <i class="bi bi-send" style="font-size: 12px;"></i>
                    </button>
                </div>
            `;

            // Xử lý sự kiện xóa khỏi danh sách
            card.querySelector('.btn-wishlist-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle(item);
                
                // Cập nhật lại icon trái tim nếu đang ở trang chủ
                const homepageCardBtn = document.querySelector(`.btn-wishlist-toggle[data-id="${item.id}"]`);
                if (homepageCardBtn) {
                    const icon = homepageCardBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'bi bi-heart text-muted';
                    }
                }

                // Render lại danh sách
                this.renderWishlist();
            });

            // Xử lý sự kiện thuê/liên hệ
            card.querySelector('.btn-wishlist-hire').addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Đóng Offcanvas
                const offcanvasEl = document.getElementById('wishlistOffcanvas');
                if (offcanvasEl && typeof bootstrap !== 'undefined') {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                    if (bsOffcanvas) bsOffcanvas.hide();
                }
                
                // Mở Request Modal ở trang chủ
                if (typeof openRequestModal === 'function') {
                    openRequestModal(item.id);
                } else {
                    // Chuyển hướng về trang chủ và truyền query param nếu đang ở trang khác
                    window.location.href = `index.html?action=hire&serviceId=${item.id}`;
                }
            });

            listContainer.appendChild(card);
        });
    }
};

/**
 * TỶ LỆ HOA HỒNG NỀN TẢNG GIGGO
 * Platform deducts 7% on every successful escrow release.
 */
const COMMISSION_RATE = 0.07;

/**
 * WALLET.JS - Quản lý Ví điện tử mô phỏng & Ký quỹ (Escrow)
 */
const Wallet = {
    getBalance: function(userId, role = 'client') {
        const key = 'wallet_balance_' + userId;
        let bal = localStorage.getItem(key);
        if (bal === null) {
            let initialBalance = (role === 'client') ? 20000000 : 0;
            localStorage.setItem(key, initialBalance);
            return initialBalance;
        }
        return parseFloat(bal);
    },
    setBalance: function(userId, amount) {
        const key = 'wallet_balance_' + userId;
        localStorage.setItem(key, amount);
        window.dispatchEvent(new CustomEvent('walletUpdate', { detail: { userId: userId, balance: amount } }));
    },
    deposit: function(userId, amount) {
        const current = this.getBalance(userId);
        const next = current + amount;
        this.setBalance(userId, next);
        return next;
    },
    withdraw: function(userId, amount) {
        const current = this.getBalance(userId);
        if (current < amount) return false;
        const next = current - amount;
        this.setBalance(userId, next);
        return next;
    },
    getEscrow: function(projectId) {
        const key = 'escrow_project_' + projectId;
        const val = localStorage.getItem(key);
        return val ? parseFloat(val) : 0;
    },
    setEscrow: function(projectId, amount) {
        const key = 'escrow_project_' + projectId;
        localStorage.setItem(key, amount);
        window.dispatchEvent(new CustomEvent('escrowUpdate', { detail: { projectId: projectId, amount: amount } }));
    },
    releaseEscrow: function(projectId, freelancerId) {
        const escrowed = this.getEscrow(projectId);
        if (escrowed > 0) {
            // Tính hoa hồng 7% cho nền tảng GigGo
            const commission = Math.round(escrowed * COMMISSION_RATE);
            const freelancerReceives = escrowed - commission;

            // Chuyển phần sau hoa hồng vào ví Freelancer
            this.deposit(freelancerId, freelancerReceives);

            // Tích luỹ hoa hồng vào quỹ nền tảng
            const poolKey = 'wallet_commission_pool';
            const currentPool = parseFloat(localStorage.getItem(poolKey) || '0');
            localStorage.setItem(poolKey, currentPool + commission);

            // Xoá escrow
            this.setEscrow(projectId, 0);

            // Trả về object chi tiết để hiển thị trên UI
            return { total: escrowed, commission: commission, freelancerReceives: freelancerReceives };
        }
        return { total: 0, commission: 0, freelancerReceives: 0 };
    },
    refundEscrow: function(projectId, clientId) {
        const escrowed = this.getEscrow(projectId);
        if (escrowed > 0) {
            // Hoàn tiền toàn bộ cho Client (không trừ hoa hồng khi hoàn tiền)
            this.deposit(clientId, escrowed);
            this.setEscrow(projectId, 0);
            return escrowed;
        }
        return 0;
    },
    getCommissionPool: function() {
        return parseFloat(localStorage.getItem('wallet_commission_pool') || '0');
    },
    resetCommissionPool: function() {
        localStorage.setItem('wallet_commission_pool', '0');
    }
};
