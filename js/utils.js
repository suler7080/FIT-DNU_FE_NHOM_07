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
    }
};
