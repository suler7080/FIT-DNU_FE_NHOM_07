/**
 * API.JS - Vanilla Javascript Fetch Implementation
 * Quản lý các thao tác CRUD qua Vanilla Fetch API. Không sử dụng jQuery.
 */

const API_ENDPOINTS = {
    '/users': 'https://69fd356630ad0a6fd1c09577.mockapi.io/api/v1/users',
    '/services': 'https://6a0589d0aa826ca75c0a13ce.mockapi.io/Services',
    '/requests': 'https://6a0589d0aa826ca75c0a13ce.mockapi.io/Requests',
    '/projects': 'https://69fd356630ad0a6fd1c09577.mockapi.io/api/v1/projects',
    '/bids': 'https://69fef0058c70b15fa3cae26b.mockapi.io/api/v1/Bids',
    '/tickets': 'https://69fef0058c70b15fa3cae26b.mockapi.io/api/v1/tickets',
    '/jobs': 'https://69fd352230ad0a6fd1c093a0.mockapi.io/api/v1/job',
    '/orders': 'https://69fd352230ad0a6fd1c093a0.mockapi.io/api/v1/orders',
    '/reviews': 'https://6a067723c83ba8ad9b3d80ec.mockapi.io/reviews',
    '/categories': 'https://6a06e4fdc83ba8ad9b3e16e4.mockapi.io/categories'
};

/**
 * Tạo fetch với timeout 10 giây
 * @param {string} url 
 * @param {Object} options 
 * @returns {Promise}
 */
function fetchWithTimeout(url, options = {}, timeout = 10000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Yêu cầu hết thời gian. Vui lòng kiểm tra kết nối mạng.')), timeout)
        )
    ]);
}

const api = {
    /**
     * Resolves an endpoint to its full URL based on API_ENDPOINTS
     * @param {string} endpoint 
     * @returns {string} full URL
     */
    getUrl: function(endpoint) {
        let base = endpoint;
        let id = '';
        
        const parts = endpoint.split('/');
        if (parts.length > 2) {
            base = '/' + parts[1];
            id = '/' + parts[2];
        }

        const baseUrl = API_ENDPOINTS[base];
        if (!baseUrl) {
            console.error(`[API ERROR] Endpoint "${base}" không có trong API_ENDPOINTS. Kiểm tra api.js!`);
            throw new Error('Endpoint không hợp lệ: ' + base);
        }
        
        return baseUrl + id;
    },

    /**
     * Phương thức GET - Lấy dữ liệu
     * @param {string} endpoint 
     * @returns {Promise}
     */
    get: function(endpoint) {
        return fetchWithTimeout(this.getUrl(endpoint))
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
        return fetchWithTimeout(this.getUrl(endpoint), {
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
        return fetchWithTimeout(this.getUrl(endpoint), {
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
        return fetchWithTimeout(this.getUrl(endpoint), {
            method: 'DELETE'
        }).then(response => {
            if (!response.ok) throw new Error('Lỗi khi xóa dữ liệu');
            return response.json();
        });
    }
};
