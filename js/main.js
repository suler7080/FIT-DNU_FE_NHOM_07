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

    // 1. Khởi tạo bộ lọc và sắp xếp động
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        // Cân đối các cột của Grid để lắp thêm ô chọn Lọc/Sắp xếp trên cùng một dòng
        const keywordCol = searchForm.querySelector('#keyword').closest('.col-md-4');
        if (keywordCol) {
            keywordCol.className = 'col-md-3';
        }
        const categoryCol = searchForm.querySelector('#category').closest('.col-md-3');
        if (categoryCol) {
            categoryCol.className = 'col-md-3';
        }
        const maxPriceCol = searchForm.querySelector('#maxPrice').closest('.col-md-3');
        if (maxPriceCol) {
            maxPriceCol.className = 'col-md-2';
        }

        // Tạo phần tử lọc rating (Đánh giá)
        const ratingCol = document.createElement('div');
        ratingCol.className = 'col-md-2';
        ratingCol.innerHTML = `
            <label for="minRating" class="form-label fw-semibold text-muted small text-uppercase">Đánh giá</label>
            <select id="minRating" class="form-select">
                <option value="0">Tất cả</option>
                <option value="4.0">Từ 4.0 ★</option>
                <option value="4.5">Từ 4.5 ★</option>
                <option value="4.8">Từ 4.8 ★</option>
            </select>
        `;

        // Tạo phần tử sắp xếp (Sort By)
        const sortCol = document.createElement('div');
        sortCol.className = 'col-md-2';
        sortCol.innerHTML = `
            <label for="sortBy" class="form-label fw-semibold text-muted small text-uppercase">Sắp xếp</label>
            <select id="sortBy" class="form-select">
                <option value="default">Mặc định</option>
                <option value="priceAsc">Giá tăng dần</option>
                <option value="priceDesc">Giá giảm dần</option>
                <option value="ratingDesc">Đánh giá cao</option>
            </select>
        `;

        // Chèn các cột mới trước nút submit (nằm trong col-md-2)
        const lastCol = searchForm.querySelector('button[type="submit"]').closest('.col-md-2');
        if (lastCol) {
            searchForm.insertBefore(ratingCol, lastCol);
            searchForm.insertBefore(sortCol, lastCol);
        }
    }

    // Tải dữ liệu danh mục và danh sách dịch vụ ban đầu
    loadCategoryOptions();
    loadServices();

    // 2. Lắng nghe sự kiện submit form Tìm kiếm / Lọc (Sử dụng Array.filter và Array.sort)
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const keyword = document.getElementById('keyword').value.toLowerCase().trim();
            const category = document.getElementById('category').value;
            const maxPriceInput = document.getElementById('maxPrice').value;
            const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;
            const minRating = parseFloat(document.getElementById('minRating').value) || 0;
            const sortBy = document.getElementById('sortBy').value;

            let filteredServices = allServices.filter(service => {
                const matchKeyword = service.title.toLowerCase().includes(keyword) || 
                                     service.description.toLowerCase().includes(keyword);
                const matchCategory = category === "" || service.category === category;
                const matchPrice = parseFloat(service.price) <= maxPrice;
                const matchRating = parseFloat(service.freelancerRating) >= minRating;
                
                return matchKeyword && matchCategory && matchPrice && matchRating;
            });

            // Thực hiện sắp xếp mảng
            if (sortBy === 'priceAsc') {
                filteredServices.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            } else if (sortBy === 'priceDesc') {
                filteredServices.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            } else if (sortBy === 'ratingDesc') {
                filteredServices.sort((a, b) => parseFloat(b.freelancerRating) - parseFloat(a.freelancerRating));
            }

            renderServices(filteredServices);
        });

        // Tự động kích hoạt tìm kiếm khi thay đổi các tiêu chí lọc/sắp xếp
        document.getElementById('minRating').addEventListener('change', () => {
            if (searchForm.requestSubmit) {
                searchForm.requestSubmit();
            } else {
                searchForm.dispatchEvent(new Event('submit'));
            }
        });
        document.getElementById('sortBy').addEventListener('change', () => {
            if (searchForm.requestSubmit) {
                searchForm.requestSubmit();
            } else {
                searchForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Admin: Delete service directly from homepage
    document.getElementById('servicesContainer').addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-admin-delete-service');
      if (!btn) return;

      const serviceId = btn.dataset.id;
      const serviceTitle = btn.dataset.title;

      // Confirm dialog
      if (!confirm(`Xóa dịch vụ "${serviceTitle}"?\n\nHành động này không thể hoàn tác.`)) return;

      // Visual feedback — show loading state on button
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      // DELETE from MockAPI
      api.delete('/services/' + serviceId)
        .then(() => {
          // 1. Remove from allServices array
          allServices = allServices.filter(s => String(s.id) !== String(serviceId));

          // 2. Fade out the card from DOM
          const cardWrapper = document.querySelector(`[data-service-id="${serviceId}"]`);
          if (cardWrapper) {
            cardWrapper.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            cardWrapper.style.opacity = '0';
            cardWrapper.style.transform = 'scale(0.95)';
            setTimeout(() => cardWrapper.remove(), 380);
          }

          // 3. Show success toast (reuse existing #successToast)
          const toastEl = document.getElementById('successToast');
          if (toastEl) {
            // Reset success toast classes in case they were modified by openRequestModal warning
            toastEl.classList.remove('bg-warning', 'text-dark');
            toastEl.classList.add('bg-success', 'text-white');
            const toastBody = toastEl.querySelector('.toast-body');
            if (toastBody) toastBody.textContent = `Đã xóa dịch vụ "${serviceTitle}" thành công.`;
            new bootstrap.Toast(toastEl).show();
          }

          // 4. Show empty state if no services left
          const container = document.getElementById('servicesContainer');
          if (allServices.length === 0) {
            container.innerHTML = `
              <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size:40px;opacity:0.3;display:block;margin-bottom:12px;"></i>
                <p>Không còn dịch vụ nào.</p>
              </div>`;
          }
        })
        .catch(err => {
          console.error('Lỗi xóa dịch vụ:', err);
          alert('Xóa thất bại. Vui lòng thử lại.');
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-trash3-fill" style="font-size:11px;"></i> Xóa';
        });
    });

    // Wishlist: Đảo trạng thái yêu thích từ trang chủ
    document.getElementById('servicesContainer').addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-wishlist-toggle');
      if (!btn) return;

      const serviceId = btn.dataset.id;
      const service = allServices.find(s => String(s.id) === String(serviceId));
      if (!service) return;

      // Đảo trạng thái yêu thích
      const added = Wishlist.toggle(service);

      // Cập nhật giao diện trái tim trực quan
      const icon = btn.querySelector('i');
      if (icon) {
          if (added) {
              icon.className = 'bi bi-heart-fill text-danger';
              btn.style.transform = 'scale(1.25)';
              setTimeout(() => btn.style.transform = 'scale(1)', 180);
          } else {
              icon.className = 'bi bi-heart text-muted';
          }
      }

      // Hiển thị thông báo Toast
      const toastEl = document.getElementById('successToast');
      if (toastEl) {
          toastEl.classList.remove('bg-warning', 'text-dark');
          toastEl.classList.add('bg-success', 'text-white');
          const toastBody = toastEl.querySelector('.toast-body');
          if (toastBody) {
              toastBody.textContent = added 
                  ? `Đã lưu "${Utils.escapeHtml(service.title)}" vào danh sách yêu thích.` 
                  : `Đã xóa "${Utils.escapeHtml(service.title)}" khỏi danh sách yêu thích.`;
          }
          new bootstrap.Toast(toastEl).show();
      }
    });

    // Xử lý các query parameter để mở modal yêu cầu/thuê ngay khi chuyển trang
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const serviceId = urlParams.get('serviceId');
    if (action === 'hire' && serviceId) {
        setTimeout(() => {
            if (typeof openRequestModal === 'function') {
                openRequestModal(serviceId);
                // Xóa tham số trên thanh địa chỉ để tránh lặp lại modal khi F5
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 800);
    }

    // 3. Xử lý Form Validation & Submit
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const deadlineInput = document.getElementById('proposedDeadline');
            const budgetInput = document.getElementById('proposedBudget');
            const messageInput = document.getElementById('message');
            const deadlineError = document.getElementById('deadlineError');
            const budgetError = document.getElementById('budgetError');
            const messageError = document.getElementById('messageError');
            
            // Reset validation
            deadlineInput.classList.remove('is-invalid');
            budgetInput.classList.remove('is-invalid');
            messageInput.classList.remove('is-invalid');
            deadlineError.textContent = '';
            budgetError.textContent = '';
            messageError.textContent = '';
            
            let hasError = false;
            
            // Validate deadline
            if (!deadlineInput.value) {
                deadlineInput.classList.add('is-invalid');
                deadlineError.textContent = 'Vui lòng chọn ngày hoàn thành.';
                hasError = true;
            }
            
            // Validate budget
            if (!budgetInput.value) {
                budgetInput.classList.add('is-invalid');
                budgetError.textContent = 'Vui lòng nhập ngân sách đề xuất.';
                hasError = true;
            } else if (parseFloat(budgetInput.value) <= 0) {
                budgetInput.classList.add('is-invalid');
                budgetError.textContent = 'Ngân sách phải lớn hơn 0.';
                hasError = true;
            }
            
            // Validate message
            if (!messageInput.value.trim()) {
                messageInput.classList.add('is-invalid');
                messageError.textContent = 'Vui lòng mô tả yêu cầu chi tiết.';
                hasError = true;
            } else if (messageInput.value.trim().length < 10) {
                messageInput.classList.add('is-invalid');
                messageError.textContent = 'Mô tả phải có ít nhất 10 ký tự.';
                hasError = true;
            }
            
            if (hasError) return;
            
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

    const currentUser = Auth.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

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
        // Áp dụng escape HTML để ngăn chặn tấn công XSS từ dữ liệu MockAPI hoặc do người dùng tạo
        const escapedTitle = Utils.escapeHtml(service.title);
        const escapedCategory = Utils.escapeHtml(service.category);
        const escapedFreelancerName = Utils.escapeHtml(service.freelancerName);
        const escapedDescription = Utils.escapeHtml(service.description);
        
        const catStyle = getCategoryStyles(escapedCategory);
        const image = service.image || 'https://via.placeholder.com/400x200?text=No+Image';

        const isWishlisted = typeof Wishlist !== 'undefined' && Wishlist.has(service.id);
        const wishlistButtonHTML = `
            <div class="wishlist-card-overlay" style="position:absolute;top:10px;left:10px;z-index:10;">
                <button class="btn btn-sm btn-light d-flex align-items-center justify-content-center shadow-sm btn-wishlist-toggle"
                        data-id="${service.id}"
                        style="width: 32px; height: 32px; border-radius: 50%; padding: 0; border: none; background: rgba(255, 255, 255, 0.9); transition: transform 0.2s;">
                    <i class="bi ${isWishlisted ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}" style="font-size:16px;"></i>
                </button>
            </div>
        `;

        const cardHTML = `
            <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up" data-service-id="${service.id}">
                <div class="card h-100 service-card border-0 shadow-sm" style="position:relative;">
                    ${isAdmin ? `
                    <div class="admin-card-overlay"
                         style="position:absolute;top:10px;right:10px;z-index:10;">
                      <button class="btn btn-sm btn-danger d-flex align-items-center gap-1 shadow-sm
                                     btn-admin-delete-service"
                              data-id="${service.id}"
                              data-title="${escapedTitle.replace(/"/g, '&quot;')}"
                              style="font-size:11px;padding:4px 10px;border-radius:7px;
                                     font-weight:600;letter-spacing:0.02em;">
                        <i class="bi bi-trash3-fill" style="font-size:11px;"></i> Xóa
                      </button>
                    </div>` : wishlistButtonHTML}
                    <div class="card-img-wrapper" style="height: 200px; overflow: hidden;">
                        <img src="${image}" class="card-img-top w-100 h-100 object-fit-cover" alt="${escapedTitle}" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge badge-category">
                                <i class="bi bi-${catStyle.icon} me-1"></i> ${escapedCategory}
                            </span>
                            <div class="text-warning small fw-bold">
                                <i class="bi bi-star-fill"></i> ${parseFloat(service.freelancerRating).toFixed(1)}
                            </div>
                        </div>
                        <h5 class="card-title text-dark fw-bold mb-1">${escapedTitle}</h5>
                        <p class="text-muted small mb-3">
                            <i class="bi bi-person-circle me-1"></i>
                            <a href="javascript:void(0)" class="text-decoration-none" onclick="openProfileModal('${service.freelancerId}')">
                                ${escapedFreelancerName}
                            </a>
                        </p>
                        <p class="card-text text-muted small flex-grow-1">${Utils.truncateText(escapedDescription, 90)}</p>
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
                const escapedClientName = Utils.escapeHtml(r.clientName || 'Khách hàng');
                const escapedComment = Utils.escapeHtml(r.comment);
                reviewsContainer.innerHTML += `
                    <div class="review-item mb-4 pb-3 border-bottom">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold text-dark">${escapedClientName}</span>
                            <span class="text-warning">${'⭐'.repeat(r.rating)}</span>
                        </div>
                        <p class="text-muted small mb-1">${escapedComment}</p>
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
