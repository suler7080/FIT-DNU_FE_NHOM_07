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

    // ==========================================
    // TASK: HERO TYPING EFFECT
    // ==========================================
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        const words = ["Thiết kế Đồ họa", "Lập trình Website", "Marketing", "Dịch thuật"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                typingElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                typingElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 150;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }
        type();
    }

    // 1. Tải dữ liệu ban đầu
    loadCategoryOptions();
    loadServices();


    // 2. Lắng nghe sự kiện submit form Tìm kiếm / Lọc (Sử dụng Array.filter)
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const keyword = document.getElementById('keyword').value.toLowerCase().trim();
            const category = document.getElementById('category').value;
            const maxPriceInput = document.getElementById('maxPrice').value;
            const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;

            const filteredServices = allServices.filter(service => {
                const matchKeyword = service.title.toLowerCase().includes(keyword) || 
                                     service.description.toLowerCase().includes(keyword);
                const matchCategory = category === "" || service.category === category;
                const matchPrice = parseFloat(service.price) <= maxPrice;
                
                return matchKeyword && matchCategory && matchPrice;
            });

            renderServices(filteredServices);
        });
    }

    // 3. Xử lý Form Validation & Submit
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

            const currentUser = Auth.getCurrentUser();
            const orderData = {
                serviceId: document.getElementById('serviceId').value,
                clientId: currentUser.id,
                clientName: currentUser.name,
                clientEmail: currentUser.email,
                proposedDeadline: document.getElementById('proposedDeadline').value,
                proposedBudget: document.getElementById('proposedBudget').value,
                attachmentLink: document.getElementById('attachmentLink').value.trim(),
                message: document.getElementById('message').value.trim(),
                status: "pending",
                type: "service",
                createdAt: new Date().toISOString()
            };

            api.post('/requests', orderData)
                .then(response => {
                    const modalEl = document.getElementById('requestModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    modalInstance.hide();
                    
                    const toastEl = document.getElementById('successToast');
                    const toast = new bootstrap.Toast(toastEl);
                    toast.show();
                    
                    requestForm.reset();
                })
                .catch(err => {
                    console.error('Lỗi khi gửi yêu cầu:', err);
                    alert('Có lỗi xảy ra khi gửi yêu cầu.');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Xác Nhận Thuê Ngay';
                });
        });
    }
});

/**
 * Tải danh mục từ API và đổ vào Select (Task: Dynamic Categories)
 */
async function loadCategoryOptions() {
    const select = document.getElementById('category');
    if (!select) return;

    try {
        const categories = await api.get('/categories');
        select.innerHTML = '<option value="">Tất cả danh mục</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.warn('Lỗi load categories từ API, dùng mặc định:', err);
        select.innerHTML = '<option value="">Tất cả danh mục</option>';
    }
}

/**
 * Tải danh sách dịch vụ từ MockAPI
 */
function loadServices() {
    Utils.toggleVisibility('loadingSpinner', true);
    
    // Gọi cả /services và /users để lấy thông tin rating của freelancer
    Promise.all([
        api.get('/services'),
        api.get('/users')
    ]).then(([services, users]) => {
        allServices = services.filter(s => s.status === 'approved').map(s => {
            const freelancer = users.find(u => String(u.id) === String(s.freelancerId));
            return {
                ...s,
                freelancerRating: freelancer ? freelancer.rating || 0 : 0,
                freelancerName: freelancer ? freelancer.name : 'Unknown'
            };
        });

        if(allServices.length === 0) {
            allServices = getMockLocalServices().filter(s => s.status === 'approved');
        }
        renderServices(allServices);
    })
    .catch(err => {
        console.warn('Fallback to mock data:', err);
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
    container.innerHTML = ''; 

    if (services.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted"><p>Không tìm thấy dịch vụ nào phù hợp.</p></div>';
        return;
    }

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

    services.forEach(service => {
        const catStyle = getCategoryStyles(service.category);
        const image = service.image || 'https://via.placeholder.com/400x200?text=No+Image';

        const cardHTML = `
            <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up">
                <div class="card h-100 service-card border-0 shadow-sm">
                    <div class="card-img-wrapper" style="height: 200px; overflow: hidden;">
                        <img src="${image}" class="card-img-top w-100 h-100 object-fit-cover" alt="${service.title}" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge badge-category">
                                <i class="bi bi-${catStyle.icon} me-1"></i> ${service.category}
                            </span>
                            <div class="text-warning small fw-bold">
                                <i class="bi bi-star-fill"></i> ${parseFloat(service.freelancerRating).toFixed(1)}
                            </div>
                        </div>
                        <h5 class="card-title text-dark fw-bold mb-1">${service.title}</h5>
                        <p class="text-muted small mb-3">
                            <i class="bi bi-person-circle me-1"></i>
                            <a href="javascript:void(0)" class="text-decoration-none" onclick="openProfileModal('${service.freelancerId}')">
                                ${service.freelancerName}
                            </a>
                        </p>
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

    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

/**
 * Mở Hồ sơ Freelancer & Đánh giá (Task 3)
 */
window.openProfileModal = function(freelancerId) {
    Utils.toggleVisibility('loadingSpinner', true);
    
    Promise.all([
        api.get(`/users/${freelancerId}`),
        api.get('/reviews')
    ]).then(([user, reviews]) => {
        const freelancerReviews = reviews.filter(r => String(r.freelancerId) === String(freelancerId));
        
        // Cập nhật UI Profile
        document.getElementById('profileInitial').textContent = user.name.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileCategory').textContent = user.skills || 'Freelancer';
        document.getElementById('profileRating').textContent = parseFloat(user.rating || 0).toFixed(1);
        document.getElementById('profileReviewCount').textContent = `(${freelancerReviews.length} đánh giá)`;
        
        // Render Stars
        const starsContainer = document.getElementById('profileStars');
        starsContainer.innerHTML = '';
        const fullStars = Math.floor(user.rating || 0);
        for(let i=0; i<5; i++) {
            starsContainer.innerHTML += `<i class="bi bi-star${i < fullStars ? '-fill' : ''}"></i>`;
        }

        // Render Reviews List
        const reviewsContainer = document.getElementById('reviewsList');
        reviewsContainer.innerHTML = '';
        
        if (freelancerReviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="text-center text-muted py-5">Chưa có đánh giá nào.</div>';
        } else {
            // Sắp xếp mới nhất lên đầu
            freelancerReviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(r => {
                reviewsContainer.innerHTML += `
                    <div class="review-item mb-4 pb-3 border-bottom">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold text-dark">${r.clientName || 'Khách hàng'}</span>
                            <span class="text-warning">${'⭐'.repeat(r.rating)}</span>
                        </div>
                        <p class="text-muted small mb-1">${r.comment}</p>
                        <small class="text-muted opacity-75">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</small>
                    </div>
                `;
            });
        }

        new bootstrap.Modal(document.getElementById('profileModal')).show();
    })
    .catch(err => console.error(err))
    .finally(() => Utils.toggleVisibility('loadingSpinner', false));
};

window.openRequestModal = function(serviceId) {
    if (!Auth.isLoggedIn()) {
        alert("Bạn cần đăng nhập với tài khoản Khách hàng để thuê dịch vụ này!");
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user.role === 'freelancer' || user.role === 'admin') {
        const toastEl = document.getElementById('successToast');
        if (toastEl) {
            const toastBody = toastEl.querySelector('.toast-body');
            toastBody.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> Chỉ tài khoản Khách hàng mới có thể thuê dịch vụ.`;
            toastEl.classList.remove('bg-success');
            toastEl.classList.add('bg-warning', 'text-dark');
            new bootstrap.Toast(toastEl).show();
        } else {
            alert('Chỉ tài khoản Khách hàng mới có thể thuê dịch vụ.');
        }
        return;
    }

    const service = allServices.find(s => String(s.id) === String(serviceId));
    if (!service) return;

    document.getElementById('serviceId').value = serviceId;
    document.getElementById('summaryServiceImage').src = service.image || 'https://via.placeholder.com/400x200?text=No+Image';
    document.getElementById('summaryServiceTitle').textContent = service.title;
    document.getElementById('summaryServicePrice').textContent = Utils.formatCurrency(service.price);
    document.getElementById('summaryFreelancerName').textContent = service.freelancerName;
    const initialEl = document.getElementById('summaryFreelancerInitial');
    if (initialEl && service.freelancerName) {
        initialEl.textContent = service.freelancerName.charAt(0).toUpperCase();
    }

    const deadlineInput = document.getElementById('proposedDeadline');
    if (deadlineInput) {
        const today = new Date().toISOString().split('T')[0];
        deadlineInput.setAttribute('min', today);
        deadlineInput.value = today;
    }

    const modalEl = document.getElementById('requestModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

function getMockLocalServices() {
    return [
        { id: "1", title: "Thiết kế Website E-commerce", category: "Programming", price: "8000000", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80", description: "Nhận code front-end responsive mượt mà, tối ưu SEO với ReactJS, NextJS.", status: "approved", freelancerId: "1", freelancerName: "Lê Văn A", freelancerRating: 4.8 },
        { id: "2", title: "Thiết kế Logo Doanh Nghiệp Premium", category: "Design", price: "2500000", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80", description: "Sáng tạo logo nhận diện thương hiệu độc đáo, bao gồm bộ Guideline.", status: "approved", freelancerId: "2", freelancerName: "Nguyễn Thị B", freelancerRating: 4.5 }
    ];
}
