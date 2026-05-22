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
