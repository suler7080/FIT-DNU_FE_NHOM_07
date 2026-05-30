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

        // Ẩn thanh phân trang nếu chỉ có tối đa 1 trang
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        // Inject modern CSS once
        if (!document.getElementById('modern-pagination-css')) {
            const style = document.createElement('style');
            style.id = 'modern-pagination-css';
            style.innerHTML = `
                .pagination-modern { margin-bottom: 0; }
                .pagination-modern .page-link {
                    width: 38px; 
                    height: 38px; 
                    border-radius: 50% !important;
                    margin: 0 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid transparent;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    background-color: #ffffff;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .pagination-modern .page-link:hover {
                    background-color: #f8fafc !important;
                    color: #0f172a !important;
                    border-color: #e2e8f0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
                }
                .pagination-modern .page-item.active .page-link {
                    background-color: #2563eb !important;
                    color: #ffffff !important;
                    border-color: #2563eb;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
                    transform: translateY(-2px);
                }
                .pagination-modern .page-item.disabled .page-link {
                    color: #9ca3af !important;
                    background-color: #f3f4f6 !important;
                    box-shadow: none;
                    pointer-events: none;
                }
                [data-theme="dark"] .pagination-modern .page-link {
                    background-color: #1e293b;
                    border-color: #334155;
                    color: #e2e8f0;
                }
                [data-theme="dark"] .pagination-modern .page-link:hover {
                    background-color: #334155 !important;
                    color: #ffffff !important;
                }
                [data-theme="dark"] .pagination-modern .page-item.active .page-link {
                    background-color: #3b82f6 !important;
                    border-color: #3b82f6;
                    color: #ffffff !important;
                }
                [data-theme="dark"] .pagination-modern .page-item.disabled .page-link {
                    background-color: #0f172a !important;
                    color: #475569 !important;
                }
            `;
            document.head.appendChild(style);
        }

        let html = '<nav aria-label="Page navigation"><ul class="pagination pagination-modern justify-content-center align-items-center border-0">';

        // Nút Prev
        const prevDisabled = currentPage === 1 ? 'disabled' : '';
        html += `<li class="page-item ${prevDisabled}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" tabindex="-1" aria-label="Previous">
                        <i class="bi bi-chevron-left" style="font-size: 14px;"></i>
                    </a>
                 </li>`;

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = currentPage === i ? 'active' : '';
            html += `<li class="page-item ${activeClass}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        // Nút Next
        const nextDisabled = currentPage === totalPages ? 'disabled' : '';
        html += `<li class="page-item ${nextDisabled}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                        <i class="bi bi-chevron-right" style="font-size: 14px;"></i>
                    </a>
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
                            <span class="flex-grow-1">${Utils.escapeHtml(n.message)}</span>
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
            { min: 0, max: 5, label: 'Đồng', next: 'Bạc' },
            { min: 5, max: 20, label: 'Bạc', next: 'Vàng' },
            { min: 20, max: 50, label: 'Vàng', next: 'Bạch Kim' },
            { min: 50, max: 100, label: 'Bạch Kim', next: 'Kim Cương' },
            { min: 100, max: Infinity, label: 'Kim Cương', next: 'MAX' }
        ];
        let current = levels.find(l => completedJobs < l.max) || levels[levels.length - 1];
        let progress = 0;
        if (current.max === Infinity) {
            progress = 100;
        } else {
            progress = ((completedJobs - current.min) / (current.max - current.min)) * 100;
        }
        return { 
            progress: Math.max(0, Math.min(100, progress)), 
            currentLabel: current.label, 
            nextLabel: current.max === Infinity ? 'MAX' : current.next, 
            completed: completedJobs 
        };
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
    },

    /**
     * Render empty state inside tables (Task: Empty State CTA)
     */
    renderTableEmptyState: function(colspan, message, icon = 'bi-inbox', ctaText = '', ctaOnClick = '') {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center py-5 text-muted bg-white border-0">
                    <div class="empty-state-wrapper p-4">
                        <div class="mb-3 d-inline-flex align-items-center justify-content-center bg-light rounded-circle" style="width: 70px; height: 70px;">
                            <i class="bi ${icon} text-secondary fs-2"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-1">${message}</h6>
                        <p class="text-muted small mb-2">Hệ thống chưa tìm thấy dữ liệu phù hợp trong tài khoản của bạn.</p>
                        ${ctaText ? `<button type="button" class="btn btn-sm btn-primary mt-2 px-4 py-2 rounded-pill shadow-sm" onclick="${ctaOnClick}">${ctaText}</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    },

    /**
     * Custom Premium Confirmation Dialog (replacing window.confirm)
     */
    showConfirmDialog: function(title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy') {
        const dialogId = 'customConfirmDialog';
        let dialogEl = document.getElementById(dialogId);
        if (dialogEl) dialogEl.remove();

        dialogEl = document.createElement('div');
        dialogEl.id = dialogId;
        dialogEl.className = 'modal fade';
        dialogEl.setAttribute('tabindex', '-1');
        dialogEl.setAttribute('aria-hidden', 'true');
        dialogEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" style="max-width: 420px;">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-body p-4 text-center">
                        <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 60px; height: 60px; background-color: rgba(245, 158, 11, 0.12);">
                            <i class="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">${title}</h5>
                        <p class="text-muted small mb-4 px-2" style="line-height: 1.6;">${message}</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-light px-4 py-2 border w-50" id="confirmDialogCancelBtn" style="border-radius: 10px; font-weight: 500; font-size:13px;">${cancelText}</button>
                            <button type="button" class="btn btn-primary px-4 py-2 w-50" id="confirmDialogConfirmBtn" style="border-radius: 10px; font-weight: 600; font-size:13px;">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialogEl);
        const modal = new bootstrap.Modal(dialogEl, { backdrop: 'static', keyboard: false });
        modal.show();

        document.getElementById('confirmDialogCancelBtn').onclick = () => {
            modal.hide();
            if (onCancel) onCancel();
            setTimeout(() => dialogEl.remove(), 400);
        };

        document.getElementById('confirmDialogConfirmBtn').onclick = () => {
            modal.hide();
            if (onConfirm) onConfirm();
            setTimeout(() => dialogEl.remove(), 400);
        };
    },

    /**
     * Custom Premium Alert Dialog (replacing window.alert)
     */
    showAlertDialog: function(title, message, onClose, type = 'info') {
        const dialogId = 'customAlertDialog';
        let dialogEl = document.getElementById(dialogId);
        if (dialogEl) dialogEl.remove();

        const config = {
            success: { bg: 'rgba(25, 135, 84, 0.12)', textClass: 'text-success', icon: 'bi-check-circle-fill' },
            error: { bg: 'rgba(220, 53, 69, 0.12)', textClass: 'text-danger', icon: 'bi-x-circle-fill' },
            warning: { bg: 'rgba(245, 158, 11, 0.12)', textClass: 'text-warning', icon: 'bi-exclamation-triangle-fill' },
            info: { bg: 'rgba(13, 202, 240, 0.12)', textClass: 'text-info', icon: 'bi-info-circle-fill' }
        };

        const theme = config[type] || config.info;

        dialogEl = document.createElement('div');
        dialogEl.id = dialogId;
        dialogEl.className = 'modal fade';
        dialogEl.setAttribute('tabindex', '-1');
        dialogEl.setAttribute('aria-hidden', 'true');
        dialogEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-body p-4 text-center">
                        <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 60px; height: 60px; background-color: ${theme.bg};">
                            <i class="bi ${theme.icon} fs-3 ${theme.textClass}"></i>
                        </div>
                        <h5 class="fw-bold text-dark mb-2">${title}</h5>
                        <p class="text-muted small mb-4 px-2" style="line-height: 1.6;">${message}</p>
                        <button type="button" class="btn btn-primary w-100 py-2.5" id="alertDialogCloseBtn" style="border-radius: 10px; font-weight: 600; font-size:13px;">Đồng ý</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialogEl);
        const modal = new bootstrap.Modal(dialogEl);
        modal.show();

        document.getElementById('alertDialogCloseBtn').onclick = () => {
            modal.hide();
            if (onClose) onClose();
            setTimeout(() => dialogEl.remove(), 400);
        };
    },

    /**
     * Animate count from 0 to target value on element
     */
    animateCounter: function(el, target, duration = 2000) {
        const start = performance.now();
        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            el.textContent = target === 98 ? current + '%' : current.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    },

    /**
     * Setup intersection observer for animating counters
     */
    initCounterObserver: function(containerId, counterSelector = '.counter-number') {
        const container = document.getElementById(containerId);
        if (!container) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = container.querySelectorAll(counterSelector);
                    counters.forEach(counter => {
                        const target = parseInt(counter.getAttribute('data-target'));
                        this.animateCounter(counter, target);
                    });
                    observer.unobserve(container);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(container);
    },

    /**
     * Render skeleton loading placeholders
     * @param {string} containerId ID of container
     * @param {string} type 'card' | 'table' | 'list'
     * @param {number} count Number of items
     */
    renderSkeleton: function(containerId, type = 'card', count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        if (type === 'card') {
            html = `<div class="row w-100 m-0">`;
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="col-md-4 mb-4">
                        <div class="card border-0 bg-white p-3 shadow-sm rounded-4" style="min-height: 200px;">
                            <div class="skeleton skeleton-title mb-3"></div>
                            <div class="skeleton skeleton-text" style="width: 90%;"></div>
                            <div class="skeleton skeleton-text" style="width: 80%;"></div>
                            <div class="skeleton skeleton-text" style="width: 95%;"></div>
                            <div class="skeleton skeleton-text mt-3" style="width: 40%; height: 25px; border-radius: 20px;"></div>
                        </div>
                    </div>`;
            }
            html += `</div>`;
        } else if (type === 'table') {
            for (let i = 0; i < count; i++) {
                html += `
                    <tr>
                        <td colspan="100%"><div class="skeleton skeleton-table-row"></div></td>
                    </tr>`;
            }
        } else if (type === 'list') {
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="card mb-3 border-0 bg-white p-4 shadow-sm rounded-4">
                        <div class="skeleton skeleton-title mb-2" style="width: 45%;"></div>
                        <div class="skeleton skeleton-text" style="width: 90%;"></div>
                        <div class="skeleton skeleton-text" style="width: 75%;"></div>
                    </div>`;
            }
        }
        container.innerHTML = html;
    },

    /**
     * Khởi tạo Theme (Dark/Light Mode) và thiết lập giao diện
     */
    initTheme: function() {
        const theme = localStorage.getItem('giggo_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        // Chờ DOM load xong mới update Icon UI
        document.addEventListener('DOMContentLoaded', () => {
            this.updateThemeTogglerUI(theme);
        });
    },

    toggleTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('giggo_theme', newTheme);
        this.updateThemeTogglerUI(newTheme);
    },

    updateThemeTogglerUI: function(theme) {
        const icons = document.querySelectorAll('.theme-toggle-icon');
        icons.forEach(icon => {
            if (theme === 'dark') {
                icon.className = 'bi bi-sun-fill theme-toggle-icon';
            } else {
                icon.className = 'bi bi-moon-stars theme-toggle-icon';
            }
        });
        const navbarThemeIcon = document.getElementById('navbarThemeIcon');
        if (navbarThemeIcon) {
            if (theme === 'dark') {
                navbarThemeIcon.className = 'bi bi-sun-fill text-warning fs-5';
            } else {
                navbarThemeIcon.className = 'bi bi-moon-fill text-muted fs-5';
            }
        }
    }
};

// Khởi chạy Theme ngay lập tức để tránh chớp màn hình trắng
Utils.initTheme();

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
    },

    logAudit: function(action, details) {
        let logs = [];
        try {
            const rawLogs = localStorage.getItem('giggo_audit_logs');
            logs = rawLogs ? JSON.parse(rawLogs) : [];
            if (!Array.isArray(logs)) logs = [];
        } catch (e) {
            logs = [];
        }
        const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
        const actorName = (currentUser && currentUser.name) ? String(currentUser.name) : 'Guest';
        logs.unshift({
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            actor: actorName,
            action: action ? String(action) : 'N/A',
            details: details ? String(details) : 'N/A'
        });
        if (logs.length > 200) logs.length = 200;
        localStorage.setItem('giggo_audit_logs', JSON.stringify(logs));
    },

    logTransaction: function(userId, userName, type, amount, commission = 0) {
        let ledger = [];
        try {
            const rawLedger = localStorage.getItem('giggo_transactions_ledger');
            ledger = rawLedger ? JSON.parse(rawLedger) : [];
            if (!Array.isArray(ledger)) ledger = [];
        } catch (e) {
            ledger = [];
        }
        const safeUserName = userName ? String(userName) : ('Người dùng #' + (userId || 'N/A'));
        ledger.unshift({
            id: 'TX' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100),
            timestamp: new Date().toISOString(),
            userId: userId ? String(userId) : 'system',
            userName: safeUserName,
            type: type ? String(type) : 'other', // 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'escrow_refund'
            amount: parseFloat(amount) || 0,
            commission: parseFloat(commission) || 0
        });
        localStorage.setItem('giggo_transactions_ledger', JSON.stringify(ledger));
    }
};

/**
 * TỶ LỆ HOA HỒNG NỀN TẢNG GIGGO
 * Platform deducts 7% on every successful escrow release.
 */
const COMMISSION_RATE = 0.07;

/**
 * WALLET.JS - Quản lý Ví điện tử & Ký quỹ (Escrow) trực tiếp qua MockAPI
 */
const Wallet = {
    // Lấy bản ghi ví từ API, nếu chưa có thì tạo mới
    _getWalletRecord: function(userId, role = 'client') {
        const url = '/wallets?userId=' + encodeURIComponent(userId);
        return api.get(url)
            .then(records => {
                let rec = Array.isArray(records) ? records.find(r => String(r.userId) === String(userId)) : null;
                if (rec) return rec;
                
                // Nếu chưa có ví, tạo mới
                return api.post('/wallets', {
                    userId: String(userId),
                    balance: 0,
                    role: role,
                    updatedAt: new Date().toISOString()
                });
            })
            .catch(err => {
                console.warn('Lỗi _getWalletRecord, thử tạo ví mới:', err);
                return api.post('/wallets', {
                    userId: String(userId),
                    balance: 0,
                    role: role,
                    updatedAt: new Date().toISOString()
                });
            });
    },

    getBalance: function(userId, role = 'client') {
        return this._getWalletRecord(userId, role)
            .then(record => record.balance);
    },

    setBalance: function(userId, amount, role = 'client') {
        return this._getWalletRecord(userId, role)
            .then(record => {
                return api.put('/wallets/' + record.id, {
                    balance: parseFloat(amount),
                    updatedAt: new Date().toISOString()
                });
            })
            .then(updatedRecord => {
                window.dispatchEvent(new CustomEvent('walletUpdate', { 
                    detail: { userId: userId, balance: updatedRecord.balance } 
                }));
                return updatedRecord.balance;
            });
    },

    deposit: function(userId, amount, role = 'client') {
        return this._getWalletRecord(userId, role)
            .then(record => {
                const newBalance = record.balance + parseFloat(amount);
                return api.put('/wallets/' + record.id, {
                    balance: newBalance,
                    updatedAt: new Date().toISOString()
                });
            })
            .then(updatedRecord => {
                window.dispatchEvent(new CustomEvent('walletUpdate', { 
                    detail: { userId: userId, balance: updatedRecord.balance } 
                }));
                // Không ghi log cho ví nền tảng hoặc ví tạm ký quỹ để tránh rác ledger
                if (role !== 'platform' && role !== 'escrow') {
                    const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
                    const userName = (currentUser && String(currentUser.id) === String(userId)) ? currentUser.name : 'Người dùng #' + userId;
                    Utils.logTransaction(userId, userName, 'deposit', parseFloat(amount));
                }
                return updatedRecord.balance;
            });
    },

    withdraw: function(userId, amount, role = 'client') {
        return this._getWalletRecord(userId, role)
            .then(record => {
                if (record.balance < parseFloat(amount)) {
                    throw new Error('Số dư ví không đủ để thực hiện giao dịch.');
                }
                const newBalance = record.balance - parseFloat(amount);
                return api.put('/wallets/' + record.id, {
                    balance: newBalance,
                    updatedAt: new Date().toISOString()
                });
            })
            .then(updatedRecord => {
                window.dispatchEvent(new CustomEvent('walletUpdate', { 
                    detail: { userId: userId, balance: updatedRecord.balance } 
                }));
                if (role !== 'platform' && role !== 'escrow') {
                    const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
                    const userName = (currentUser && String(currentUser.id) === String(userId)) ? currentUser.name : 'Người dùng #' + userId;
                    Utils.logTransaction(userId, userName, 'withdraw', parseFloat(amount));
                }
                return updatedRecord.balance;
            });
    },

    getEscrow: function(projectId) {
        const escrowUserId = 'escrow_project_' + projectId;
        return this._getWalletRecord(escrowUserId, 'escrow')
            .then(record => record.balance);
    },

    setEscrow: function(projectId, amount) {
        const escrowUserId = 'escrow_project_' + projectId;
        return this._getWalletRecord(escrowUserId, 'escrow')
            .then(record => {
                return api.put('/wallets/' + record.id, {
                    balance: parseFloat(amount),
                    updatedAt: new Date().toISOString()
                });
            })
            .then(updatedRecord => {
                window.dispatchEvent(new CustomEvent('escrowUpdate', { 
                    detail: { projectId: projectId, amount: updatedRecord.balance } 
                }));
                if (parseFloat(amount) > 0) {
                    const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
                    const userName = currentUser ? currentUser.name : 'Hệ thống';
                    Utils.logTransaction(currentUser ? currentUser.id : 'system', userName, 'escrow_lock', parseFloat(amount));
                }
                return updatedRecord.balance;
            });
    },

    releaseEscrow: function(projectId, freelancerId) {
        const escrowUserId = 'escrow_project_' + projectId;
        let escrowAmount = 0;
        
        return this.getEscrow(projectId)
            .then(amt => {
                escrowAmount = amt;
                if (escrowAmount <= 0) {
                    return { total: 0, commission: 0, freelancerReceives: 0 };
                }
                
                const commission = Math.round(escrowAmount * COMMISSION_RATE);
                const freelancerReceives = escrowAmount - commission;
                
                // 1. Đặt Escrow về 0
                return this.setEscrow(projectId, 0)
                    .then(() => {
                        // 2. Chuyển tiền cho Freelancer
                        return this.deposit(freelancerId, freelancerReceives, 'freelancer');
                    })
                    .then(() => {
                        // 3. Chuyển phí hoa hồng vào tài khoản commission
                        return this.deposit('platform_commission', commission, 'platform');
                    })
                    .then(() => {
                        const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
                        const clientName = currentUser ? currentUser.name : 'Khách hàng';
                        Utils.logTransaction(freelancerId, clientName, 'escrow_release', escrowAmount, commission);
                        return { 
                            total: escrowAmount, 
                            commission: commission, 
                            freelancerReceives: freelancerReceives 
                        };
                    });
            });
    },

    refundEscrow: function(projectId, clientId) {
        let escrowAmount = 0;
        return this.getEscrow(projectId)
            .then(amt => {
                escrowAmount = amt;
                if (escrowAmount <= 0) return 0;
                
                // 1. Đặt Escrow về 0
                return this.setEscrow(projectId, 0)
                    .then(() => {
                        // 2. Hoàn tiền cho Client
                        return this.deposit(clientId, escrowAmount, 'client');
                    })
                    .then(() => {
                        const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
                        const actorName = currentUser ? currentUser.name : 'Hệ thống';
                        Utils.logTransaction(clientId, actorName, 'escrow_refund', escrowAmount);
                        return escrowAmount;
                    });
            });
    },

    getCommissionPool: function() {
        return this._getWalletRecord('platform_commission', 'platform')
            .then(record => record.balance);
    },

    resetCommissionPool: function() {
        return this.setBalance('platform_commission', 0, 'platform');
    }
};
