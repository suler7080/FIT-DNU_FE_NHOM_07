/**
 * API.JS - Vanilla Javascript Fetch Implementation
 * Quản lý các thao tác CRUD qua Vanilla Fetch API. Không sử dụng jQuery.
 */

const API_BASE_URL = 'https://664a781da300e8795d425b01.mockapi.io/api/v1';

const api = {
    /**
     * Phương thức GET - Lấy dữ liệu
     * @param {string} endpoint 
     * @returns {Promise}
     */
    get: function(endpoint) {
        return fetch(`${API_BASE_URL}${endpoint}`)
            .then(response => {
                if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');
                return response.json();
            });
    },

    /**
     * Phương thức POST - Thêm mới dữ liệu
     * @param {string} endpoint 
     * @param {Object} data 
     * @returns {Promise}
     */
    post: function(endpoint, data) {
        return fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) throw new Error('Lỗi khi gửi dữ liệu');
            return response.json();
        });
    },

    /**
     * Phương thức PUT - Cập nhật dữ liệu
     * @param {string} endpoint 
     * @param {Object} data 
     * @returns {Promise}
     */
    put: function(endpoint, data) {
        return fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) throw new Error('Lỗi khi cập nhật dữ liệu');
            return response.json();
        });
    },

    /**
     * Phương thức DELETE - Xóa dữ liệu
     * @param {string} endpoint 
     * @returns {Promise}
     */
    delete: function(endpoint) {
        return fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        }).then(response => {
            if (!response.ok) throw new Error('Lỗi khi xóa dữ liệu');
            return response.json();
        });
    }
};
