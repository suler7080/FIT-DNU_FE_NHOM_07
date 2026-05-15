/**
 * MAIN.JS - Xử lý logic cho trang người dùng (index.html)
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

// Trạng thái lưu trữ dịch vụ
let allServices = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS Animation Library
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // 1. Tải dữ liệu ban đầu
    loadServices();


    // 2. Lắng nghe sự kiện submit form Tìm kiếm / Lọc (Sử dụng Array.filter)
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn chặn tải lại trang
            
            // Lấy giá trị từ các ô input
            const keyword = document.getElementById('keyword').value.toLowerCase().trim();
            const category = document.getElementById('category').value;
            const maxPriceInput = document.getElementById('maxPrice').value;
            const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;

            // Sử dụng Array.filter() để lọc dữ liệu
            const filteredServices = allServices.filter(service => {
                const matchKeyword = service.title.toLowerCase().includes(keyword) || 
                                     service.description.toLowerCase().includes(keyword);
                const matchCategory = category === "" || service.category === category;
                const matchPrice = parseFloat(service.price) <= maxPrice;
                
                return matchKeyword && matchCategory && matchPrice;
            });

            // Hiển thị lại dữ liệu đã lọc
            renderServices(filteredServices);
        });
    }

    // 3. Xử lý Form Validation bằng Vanilla JS
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Dừng hành vi submit mặc định
            
            let isValid = true;
            const clientNameInput = document.getElementById('clientName');
            const clientEmailInput = document.getElementById('clientEmail');
            
            // Validate trường Tên (Không được để trống)
            if (clientNameInput.value.trim() === '') {
                clientNameInput.classList.add('is-invalid');
                isValid = false;
            } else {
                clientNameInput.classList.remove('is-invalid');
            }

            // Validate Email (Phải đúng định dạng)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(clientEmailInput.value.trim())) {
                clientEmailInput.classList.add('is-invalid');
                isValid = false;
            } else {
                clientEmailInput.classList.remove('is-invalid');
            }

            // Nếu hợp lệ, tiến hành gửi dữ liệu
            if (isValid) {
                const requestData = {
                    serviceId: document.getElementById('serviceId').value,
                    clientName: clientNameInput.value.trim(),
                    clientEmail: clientEmailInput.value.trim(),
                    message: document.getElementById('message').value.trim(),
                    status: "pending"
                };

                // Gửi dữ liệu qua api.js (Vanilla Fetch)
                api.post('/requests', requestData)
                    .then(response => {
                        // Đóng modal
                        const modalEl = document.getElementById('requestModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        modalInstance.hide();
                        
                        // Hiển thị Toast thông báo thành công
                        const toastEl = document.getElementById('successToast');
                        const toast = new bootstrap.Toast(toastEl);
                        toast.show();
                        
                        // Reset form
                        requestForm.reset();
                        clientNameInput.classList.remove('is-invalid');
                        clientEmailInput.classList.remove('is-invalid');
                    })
                    .catch(err => {
                        console.error('Lỗi khi gửi yêu cầu:', err);
                        alert('Có lỗi xảy ra khi gửi yêu cầu.');
                    });
            }
        });
    }
});

/**
 * Tải danh sách dịch vụ từ MockAPI
 */
function loadServices() {
    Utils.toggleVisibility('loadingSpinner', true);
    
    // Gọi API thông qua module api.js
    api.get('/services')
        .then(data => {
            // Lọc chỉ lấy các dịch vụ đã duyệt (Task 4: Filter approved services)
            allServices = data.filter(s => s.status === 'approved');
            
            // Nếu API rỗng, tạo dữ liệu mẫu cục bộ cho bài tập
            if(allServices.length === 0) {
                allServices = getMockLocalServices().filter(s => s.status === 'approved');
            }
            renderServices(allServices);
        })
        .catch(err => {
            console.warn('Không thể kết nối MockAPI, sử dụng dữ liệu mẫu:', err);
            // Fallback dữ liệu mẫu
            allServices = getMockLocalServices().filter(s => s.status === 'approved');
            renderServices(allServices);
        })
        .finally(() => {
            Utils.toggleVisibility('loadingSpinner', false);
        });
}

/**
 * Hiển thị danh sách dịch vụ lên DOM
 */
function renderServices(services) {
    const container = document.getElementById('servicesContainer');
    container.innerHTML = ''; // Vanilla JS Xóa nội dung cũ

    if (services.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted"><p>Không tìm thấy dịch vụ nào phù hợp.</p></div>';
        return;
    }

    // Helper to get category color/icon
    const getCategoryStyles = (cat) => {
        const styles = {
            'Programming': { color: 'primary', icon: 'code-slash' },
            'Design': { color: 'danger', icon: 'palette' },
            'Content': { color: 'success', icon: 'pencil' },
            'Marketing': { color: 'warning', icon: 'megaphone' },
            'Video': { color: 'info', icon: 'camera-video' },
            'SEO': { color: 'secondary', icon: 'graph-up' },
            'Translation': { color: 'dark', icon: 'translate' },
            'Voiceover': { color: 'primary', icon: 'mic' },
            'Mobile App': { color: 'success', icon: 'phone' },
            'AI Development': { color: 'danger', icon: 'robot' }
        };
        return styles[cat] || { color: 'secondary', icon: 'tag' };
    };

    // Lặp qua mảng và render card
    services.forEach(service => {
        const catStyle = getCategoryStyles(service.category);
        // Vanilla DOM Manipulation (Tạo chuỗi HTML)
        const image = service.image || 'https://via.placeholder.com/400x200?text=No+Image';

        const cardHTML = `
            <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up">
                <div class="card h-100 service-card border-0 shadow-sm">
                    <div class="card-img-wrapper" style="height: 200px; overflow: hidden;">
                        <img src="${image}" class="card-img-top w-100 h-100 object-fit-cover" alt="${service.title}" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <span class="badge badge-category mb-3 align-self-start">
                            <i class="bi bi-${catStyle.icon} me-1"></i> ${service.category}
                        </span>
                        <h5 class="card-title text-dark fw-bold">${service.title}</h5>
                        <p class="card-text text-muted small flex-grow-1">${Utils.truncateText(service.description, 90)}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                            <h4 class="service-price fw-bold text-primary mb-0">${Utils.formatCurrency(service.price)}</h4>
                        </div>
                        <button class="btn btn-primary w-100 fw-bold mt-auto shadow-sm" onclick="openRequestModal('${service.id}')">
                            <i class="bi bi-send me-1"></i> Liên Hệ Ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });

    // Cập nhật lại AOS cho các phần tử mới được render
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

/**
 * Mở modal gửi yêu cầu (Được gọi từ HTML inline onclick)
 */
window.openRequestModal = function(serviceId) {
    document.getElementById('serviceId').value = serviceId;
    const modalEl = document.getElementById('requestModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};


/**
 * Hàm tạo dữ liệu mẫu nếu API lỗi (giúp bài tập luôn chạy được)
 */
function getMockLocalServices() {
    return [
        { id: "1", title: "Thiết kế Website E-commerce", category: "Programming", price: "8000000", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80", description: "Nhận code front-end responsive mượt mà, tối ưu SEO với ReactJS, NextJS.", status: "approved" },
        { id: "2", title: "Thiết kế Logo Doanh Nghiệp Premium", category: "Design", price: "2500000", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80", description: "Sáng tạo logo nhận diện thương hiệu độc đáo, bao gồm bộ Guideline.", status: "approved" },
        { id: "3", title: "Viết bài chuẩn SEO Blog Mảng Công Nghệ", category: "Content", price: "500000", image: "https://images.unsplash.com/photo-1455390582262-044cdead2708?w=400&q=80", description: "Viết bài PR, bài chuẩn SEO 1500 chữ, unique 100%, nghiên cứu từ khóa.", status: "approved" },
        { id: "4", title: "Tích hợp AI Chatbot cho Website", category: "AI Development", price: "12000000", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80", description: "Xây dựng AI Chatbot thông minh dựa trên dữ liệu doanh nghiệp của bạn.", status: "approved" },
        { id: "5", title: "Dịch thuật Anh - Việt Chuyên Ngành", category: "Translation", price: "800000", image: "https://images.unsplash.com/photo-1543165365-07232ed12fad?w=400&q=80", description: "Dịch thuật tài liệu kỹ thuật, y tế đảm bảo độ chính xác cao.", status: "approved" },
        { id: "6", title: "Chạy chiến dịch Facebook Ads Tối Ưu", category: "Marketing", price: "4000000", image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&q=80", description: "Set up và tối ưu chiến dịch quảng cáo Facebook chuyển đổi cao.", status: "approved" }
    ];
}
