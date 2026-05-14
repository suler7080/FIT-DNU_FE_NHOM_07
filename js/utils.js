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
    }
};
