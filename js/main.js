/**
 * MAIN.JS - Xử lý logic cho trang người dùng (index.html)
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

// Trạng thái lưu trữ dịch vụ và dự án
let allServices = [];
let allJobs = [];
let allUsers = [];
let currentServicesPage = 1;
let currentJobsPage = 1;

document.addEventListener('DOMContentLoaded', () => {

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

    // 1. Khởi tạo bộ lọc và sắp xếp
    const searchForm = document.getElementById('searchForm');

    // Tải dữ liệu danh mục và danh sách dịch vụ ban đầu
    loadCategoryOptions();
    loadServices();
    loadPublicJobs();
    applyRoleVisibility();
    adjustSearchFormForRole();

    // 2. Lắng nghe sự kiện submit form Tìm kiếm / Lọc
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
            const isFreelancer = user && user.role === 'freelancer';

            const keyword = document.getElementById('keyword').value.toLowerCase().trim();
            const category = document.getElementById('category').value;
            const maxPriceInput = document.getElementById('maxPrice').value;
            const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;
            const sortBy = document.getElementById('sortBy').value;

            if (isFreelancer) {
                // Freelancer: Tìm kiếm Dự án
                currentJobsPage = 1;
                let filteredJobs = allJobs.filter(job => {
                    const matchKeyword = (job.title || '').toLowerCase().includes(keyword) || 
                                         (job.description || '').toLowerCase().includes(keyword);
                    const matchCategory = category === "" || job.category === category;
                    const matchPrice = (parseFloat(job.budget) || 0) <= maxPrice;
                    
                    return matchKeyword && matchCategory && matchPrice;
                });

                if (sortBy === 'priceAsc') {
                    filteredJobs.sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget));
                } else if (sortBy === 'priceDesc') {
                    filteredJobs.sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget));
                }

                renderJobCards(filteredJobs, allUsers);
            } else {
                // Client/Khách: Tìm kiếm Dịch vụ
                currentServicesPage = 1;
                const minRatingEl = document.getElementById('minRating');
                const minRating = minRatingEl ? (parseFloat(minRatingEl.value) || 0) : 0;
                
                let filteredServices = allServices.filter(service => {
                    const matchKeyword = (service.title || '').toLowerCase().includes(keyword) || 
                                         (service.description || '').toLowerCase().includes(keyword);
                    const matchCategory = category === "" || service.category === category;
                    const matchPrice = (parseFloat(service.price) || 0) <= maxPrice;
                    const matchRating = (parseFloat(service.freelancerRating) || 0) >= minRating;
                    
                    return matchKeyword && matchCategory && matchPrice && matchRating;
                });

                if (sortBy === 'priceAsc') {
                    filteredServices.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                } else if (sortBy === 'priceDesc') {
                    filteredServices.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                } else if (sortBy === 'ratingDesc') {
                    filteredServices.sort((a, b) => parseFloat(b.freelancerRating) - parseFloat(a.freelancerRating));
                }

                renderServices(filteredServices);
            }
        });

        // Tự động kích hoạt tìm kiếm khi thay đổi các tiêu chí lọc/sắp xếp
        const minRatingEl = document.getElementById('minRating');
        if (minRatingEl) {
            minRatingEl.addEventListener('change', () => {
                if (searchForm.requestSubmit) {
                    searchForm.requestSubmit();
                } else {
                    searchForm.dispatchEvent(new Event('submit'));
                }
            });
        }
        
        const sortByEl = document.getElementById('sortBy');
        if (sortByEl) {
            sortByEl.addEventListener('change', () => {
                if (searchForm.requestSubmit) {
                    searchForm.requestSubmit();
                } else {
                    searchForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    // Admin: Delete service directly from homepage
    document.getElementById('servicesContainer').addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-admin-delete-service');
      if (!btn) return;

      const serviceId = btn.dataset.id;
      const serviceTitle = btn.dataset.title;

      // Confirm dialog
      Utils.showConfirmDialog(
          'Xóa dịch vụ',
          `Bạn có chắc chắn muốn xóa dịch vụ "${serviceTitle}"? Hành động này không thể hoàn tác.`,
          () => {
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
                  Utils.showToast('Xóa thất bại. Vui lòng thử lại.', 'error');
                  btn.disabled = false;
                  btn.innerHTML = '<i class="bi bi-trash3-fill" style="font-size:11px;"></i> Xóa';
                });
          }
      );
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
            const proposedBudget = parseFloat(document.getElementById('proposedBudget').value);

            if (typeof Wallet !== 'undefined') {
                Wallet.getBalance(currentUser.id, 'client').then(balance => {
                    if (balance < proposedBudget) {
                        Utils.showToast(`Số dư ví không đủ để thuê dịch vụ này (Đề xuất: ${Utils.formatCurrency(proposedBudget)} vs Số dư: ${Utils.formatCurrency(balance)}). Vui lòng nạp thêm tiền.`, 'warning');
                        btn.disabled = false;
                        btn.innerHTML = 'Xác Nhận Thuê Ngay';
                        return;
                    }
                    
                    Utils.showConfirmDialog(
                        'Xác nhận Thuê Dịch vụ',
                        `Bạn xác nhận muốn gửi yêu cầu thuê dịch vụ này với ngân sách ${Utils.formatCurrency(proposedBudget)}? Số tiền này sẽ được ký quỹ trên hệ thống.`,
                        () => {
                            Wallet.withdraw(currentUser.id, proposedBudget, 'client')
                                .then(() => {
                                    sendOrder(proposedBudget);
                                })
                                .catch(err => {
                                    console.error("Lỗi khi rút tiền ký quỹ:", err);
                                    Utils.showToast("Không thể trừ tiền ký quỹ từ ví: " + err.message, 'error');
                                    btn.disabled = false;
                                    btn.innerHTML = 'Xác Nhận Thuê Ngay';
                                });
                        },
                        () => {
                            btn.disabled = false;
                            btn.innerHTML = 'Xác Nhận Thuê Ngay';
                        }
                    );
                }).catch(err => {
                    console.error("Lỗi lấy số dư ví:", err);
                    Utils.showToast("Không thể tải thông tin ví. Vui lòng thử lại sau.", 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Xác Nhận Thuê Ngay';
                });
            } else {
                sendOrder(proposedBudget);
            }

            function sendOrder(budget) {
                const orderData = {
                    serviceId: document.getElementById('serviceId').value,
                    clientId: currentUser.id,
                    clientName: currentUser.name,
                    clientEmail: currentUser.email,
                    proposedDeadline: document.getElementById('proposedDeadline').value,
                    proposedBudget: budget,
                    attachmentLink: document.getElementById('attachmentLink').value.trim(),
                    message: document.getElementById('message').value.trim(),
                    status: "pending",
                    type: "service",
                    createdAt: new Date().toISOString()
                };

                api.post('/requests', orderData)
                    .then(response => {
                        if (typeof Wallet !== 'undefined' && response && response.id) {
                            return Wallet.setEscrow(response.id, budget);
                        }
                    })
                    .then(() => {
                        const modalEl = document.getElementById('requestModal');
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                        
                        const toastEl = document.getElementById('successToast');
                        if (toastEl) {
                            toastEl.classList.remove('bg-warning', 'text-dark');
                            toastEl.classList.add('bg-success', 'text-white');
                            const toastBody = toastEl.querySelector('.toast-body');
                            if (toastBody) toastBody.textContent = 'Gửi yêu cầu thành công!';
                            new bootstrap.Toast(toastEl).show();
                        }
                        
                        requestForm.reset();
                    })
                    .catch(err => {
                        console.error('Lỗi khi gửi yêu cầu:', err);
                        Utils.showToast('Có lỗi xảy ra khi gửi yêu cầu.', 'error');
                        if (typeof Wallet !== 'undefined') {
                            Wallet.deposit(currentUser.id, budget, 'client').catch(console.error);
                        }
                    })
                    .finally(() => {
                        btn.disabled = false;
                        btn.innerHTML = 'Xác Nhận Thuê Ngay';
                    });
            }
        });
    }

    // ==========================================
    // QUICK BID FORM (đã gộp từ DOMContentLoaded thứ 2)
    // ==========================================
    const quickBidForm = document.getElementById('quickBidForm');
    if (quickBidForm) {
        quickBidForm.addEventListener('submit', e => {
            e.preventDefault();

            const priceInput = document.getElementById('bidPrice');
            const messageInput = document.getElementById('bidMessage');
            let hasError = false;

            priceInput.classList.remove('is-invalid');
            messageInput.classList.remove('is-invalid');

            const price = parseFloat(priceInput.value);
            if (!priceInput.value || isNaN(price) || price <= 0) {
                priceInput.classList.add('is-invalid');
                document.getElementById('bidPriceError').textContent = 'Vui lòng nhập giá bid hợp lệ (> 0).';
                hasError = true;
            }

            const message = messageInput.value.trim();
            if (!message || message.length < 20) {
                messageInput.classList.add('is-invalid');
                document.getElementById('bidMessageError').textContent = 'Lời nhắn phải có ít nhất 20 ký tự.';
                hasError = true;
            }

            if (hasError) return;

            const currentUser = Auth.getCurrentUser();
            if (!currentUser || currentUser.role !== 'freelancer') {
                Utils.showToast('Bạn phải đăng nhập với tài khoản Freelancer để đặt bid.', 'warning');
                return;
            }

            const btn = document.getElementById('btnSubmitBid');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

            const bidData = {
                projectId: document.getElementById('bidJobId').value,
                freelancerId: currentUser.id,
                freelancerName: currentUser.name,
                price: price,
                message: message,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            api.post('/bids', bidData)
                .then(() => {
                    bootstrap.Modal.getInstance(document.getElementById('quickBidModal')).hide();

                    const toastEl = document.getElementById('successToast');
                    if (toastEl) {
                        toastEl.classList.remove('bg-warning', 'text-dark');
                        toastEl.classList.add('bg-success', 'text-white');
                        const body = toastEl.querySelector('.toast-body');
                        if (body) body.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Đặt bid thành công! Client sẽ xem xét và phản hồi sớm.';
                        new bootstrap.Toast(toastEl).show();
                    }
                })
                .catch(err => {
                    console.error('Lỗi đặt bid:', err);
                    Utils.showToast('Có lỗi xảy ra khi gửi bid. Vui lòng thử lại.', 'error');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-send me-2"></i>Gửi Bid Ngay';
                });
        });
    }

    // ================================================================
    // A5: PARALLAX HERO + COUNTER ANIMATION + SERVICE CARD STAGGER
    // ================================================================

    // Parallax Hero on Scroll
    const hero = document.querySelector('.hero-section[data-parallax]');
    if (hero) {
        window.addEventListener('scroll', function parallaxScroll() {
            const speed = parseFloat(hero.getAttribute('data-speed')) || 0.3;
            const offset = window.scrollY * speed;
            hero.style.backgroundPositionY = offset + 'px';
        });
    }

    // Counter Animation with IntersectionObserver (Task: Counter Animation)
    if (typeof Utils !== 'undefined') {
        Utils.initCounterObserver('counterRow');
    }

    // Service Card Staggered Reveal on Scroll
    const serviceCards = document.querySelectorAll('.service-card');
    if (serviceCards.length) {
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        serviceCards.forEach((card, i) => {
            card.classList.add('service-card-stagger');
            card.style.transitionDelay = (i * 0.08) + 's';
            staggerObserver.observe(card);
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
 * Hiển thị Khung xương tải trang (Skeleton Loading) cho dịch vụ
 */
function showSkeletonLoader(isVisible) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    if (isVisible) {
        let html = '';
        for (let i = 0; i < 6; i++) {
            html += `
                <div class="col-md-6 col-lg-4 skeleton-placeholder">
                    <div class="card h-100 skeleton-card border-0 shadow-sm p-3">
                        <div class="skeleton-thumbnail rounded-3 mb-3"></div>
                        <div class="skeleton-line mb-3"></div>
                        <div class="skeleton-line short mb-3"></div>
                        <div class="skeleton-line mt-auto" style="height: 38px; width: 100%; border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }
}

/**
 * Tải danh sách dịch vụ từ MockAPI
 */
function loadServices() {
    showSkeletonLoader(true);
    
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

        renderServices(allServices);
    })
    .catch(err => {
        console.warn('Fallback to empty data:', err);
        allServices = [];
        renderServices(allServices);
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
        const paginationContainer = document.getElementById('servicesPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Phân trang
    const paginateResult = Utils.paginateArray(services, currentServicesPage, 6);
    const paginatedServices = paginateResult.paginatedItems;
    currentServicesPage = paginateResult.currentPage;

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

    paginatedServices.forEach(service => {
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
            <div class="col-md-6 col-lg-4 mb-4" data-service-id="${service.id}">
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

    // Render thanh phân trang
    Utils.renderPagination('servicesPagination', currentServicesPage, paginateResult.totalPages, function(newPage) {
        currentServicesPage = newPage;
        renderServices(services);
    });
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
        Utils.showToast("Bạn cần đăng nhập với tài khoản Khách hàng để thuê dịch vụ này!", 'warning');
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
            Utils.showToast('Chỉ tài khoản Khách hàng mới có thể thuê dịch vụ.', 'warning');
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

// ===================================================
// PUBLIC JOBS BOARD
// ===================================================

/**
 * Tải danh sách dự án công khai (status === 'open') từ MockAPI
 */
function loadPublicJobs() {
    const container = document.getElementById('jobsContainer');
    const section = document.getElementById('jobsBoardSection');
    if (!container) return;

    // Skeleton loading
    let skeletonHtml = '';
    for (let i = 0; i < 3; i++) {
        skeletonHtml += `
            <div class="col-md-6 col-lg-4 skeleton-placeholder">
                <div class="card h-100 skeleton-card border-0 shadow-sm p-3">
                    <div class="skeleton-line mb-3" style="height:24px;width:70%;"></div>
                    <div class="skeleton-line short mb-2" style="height:16px;width:40%;"></div>
                    <div class="skeleton-line mb-3" style="height:60px;"></div>
                    <div class="skeleton-line mt-auto" style="height:38px;width:100%;border-radius:10px;"></div>
                </div>
            </div>`;
    }
    container.innerHTML = skeletonHtml;

    Promise.all([
        api.get('/jobs'),
        api.get('/users')
    ]).then(([jobs, users]) => {
        allJobs = (jobs || []).filter(j => j.status === 'open' || j.status === 'approved');
        allUsers = users || [];

        if (allJobs.length === 0) {
            // Ẩn section nếu không có dự án nào
            if (section) section.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        if (section) section.style.display = '';
        renderJobCards(allJobs, allUsers);
    }).catch(err => {
        console.warn('Lỗi load public jobs:', err);
        container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="bi bi-cloud-slash fs-1 opacity-25 d-block mb-2"></i>Không thể tải danh sách dự án.</div>';
    });
}

/**
 * Render cards dự án lên #jobsContainer
 */
function renderJobCards(jobs, users) {
    const container = document.getElementById('jobsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (jobs.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="bi bi-search fs-1 opacity-25 d-block mb-2"></i>Không tìm thấy dự án nào phù hợp.</div>';
        const paginationContainer = document.getElementById('jobsPagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Phân trang
    const paginateResult = Utils.paginateArray(jobs, currentJobsPage, 6);
    const paginatedJobs = paginateResult.paginatedItems;
    currentJobsPage = paginateResult.currentPage;

    const catBadgeColors = {
        'Programming': '#4f46e5', 'Design': '#dc2626', 'Marketing': '#d97706',
        'Content': '#16a34a', 'SEO': '#0891b2', 'Mobile App': '#7c3aed',
        'Video': '#0284c7', 'Translation': '#64748b', 'AI Development': '#9f1239'
    };

    paginatedJobs.forEach(job => {
        const client = users.find(u => String(u.id) === String(job.clientId));
        const clientName = client ? client.name : 'Khách hàng ẩn danh';
        const catColor = catBadgeColors[job.category] || '#4f46e5';
        const budgetText = Utils.formatCurrency(parseFloat(job.budget) || 0);
        const descShort = Utils.truncateText(job.description || 'Chưa có mô tả chi tiết.', 100);

        const cardHtml = `
            <div class="col-md-6 col-lg-4" data-job-id="${job.id}">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style="transition: transform 0.25s, box-shadow 0.25s; cursor:pointer;"
                     onmouseenter="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 1rem 2rem rgba(79,70,229,0.15)'"
                     onmouseleave="this.style.transform=''; this.style.boxShadow=''">
                    <!-- Colored header bar -->
                    <div class="py-3 px-4" style="background: linear-gradient(135deg, ${catColor}18 0%, ${catColor}08 100%); border-bottom: 3px solid ${catColor}30;">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge rounded-pill fw-semibold" style="background:${catColor}20; color:${catColor}; font-size:11px;">${Utils.escapeHtml(job.category || 'Khác')}</span>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success" style="font-size:10px;"><i class="bi bi-circle-fill me-1" style="font-size:6px;"></i>Đang tuyển</span>
                        </div>
                        <h6 class="fw-bold text-dark mb-0 lh-base" style="font-size:15px;">${Utils.escapeHtml(job.title)}</h6>
                    </div>
                    <div class="card-body p-4 d-flex flex-column">
                        <p class="text-muted small mb-3 flex-grow-1" style="line-height:1.6;">${Utils.escapeHtml(descShort)}</p>
                        <div class="d-flex justify-content-between align-items-center mb-3 p-2 rounded-3" style="background:#f8f7ff;">
                            <div class="small text-muted">
                                <i class="bi bi-person-circle me-1"></i>${Utils.escapeHtml(clientName)}
                            </div>
                            <div class="fw-bold" style="color:${catColor}; font-size:15px;">${budgetText}</div>
                        </div>
                        <button class="btn fw-bold text-white rounded-pill w-100 py-2 btn-quick-bid"
                                data-id="${job.id}"
                                data-client-id="${job.clientId}"
                                style="background: linear-gradient(135deg, ${catColor} 0%, ${catColor}cc 100%); transition: all 0.2s; font-size:14px;">
                            <i class="bi bi-send me-2"></i>Nộp Bid Ngay
                        </button>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Gắn sự kiện nút Bid
    container.querySelectorAll('.btn-quick-bid').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const jobCard = btn.closest('[data-job-id]');
            const jobId = btn.dataset.id;
            const clientId = btn.dataset.clientId;
            const title = jobCard.querySelector('h6').textContent;
            const budget = jobCard.querySelector('.fw-bold[style]').textContent;
            const desc = jobCard.querySelector('.text-muted.small').textContent;
            openQuickBidModal(jobId, clientId, title, budget, desc);
        });
    });

    // Render thanh phân trang
    Utils.renderPagination('jobsPagination', currentJobsPage, paginateResult.totalPages, function(newPage) {
        currentJobsPage = newPage;
        renderJobCards(jobs, users);
    });
}

/**
 * Mở modal đặt bid nhanh
 */
function openQuickBidModal(jobId, clientId, title, budget, desc) {
    // Điền thông tin dự án vào modal
    document.getElementById('bidJobId').value = jobId;
    document.getElementById('bidJobClientId').value = clientId || '';
    document.getElementById('bidJobTitle').textContent = title;
    document.getElementById('bidJobBudget').textContent = budget;
    document.getElementById('bidJobDesc').textContent = desc;
    document.getElementById('bidJobBadge').textContent = 'Dự án mở';

    // Reset form
    const form = document.getElementById('quickBidForm');
    if (form) form.reset();
    document.getElementById('bidPrice').classList.remove('is-invalid');
    document.getElementById('bidMessage').classList.remove('is-invalid');

    // Kiểm tra login
    const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const warning = document.getElementById('quickBidLoginWarning');
    const submitBtn = document.getElementById('btnSubmitBid');

    if (!currentUser || currentUser.role !== 'freelancer') {
        if (warning) warning.classList.remove('d-none');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        if (warning) warning.classList.add('d-none');
        if (submitBtn) submitBtn.disabled = false;
    }

    new bootstrap.Modal(document.getElementById('quickBidModal')).show();
}

/**
 * Lọc hiển thị Section trên trang chủ dựa theo Vai trò người dùng (Client / Freelancer)
 */
function applyRoleVisibility() {
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const servicesBoard = document.getElementById('servicesBoardSection');
    const jobsBoard = document.getElementById('jobsBoardSectionWrapper');

    if (!user) {
        // Khách vãng lai: Hiện cả hai
        if (servicesBoard) servicesBoard.style.display = 'block';
        if (jobsBoard) jobsBoard.style.display = 'block';
        return;
    }

    if (user.role === 'freelancer') {
        // Freelancer: Chỉ hiện Dự án tuyển dụng (Bids Board), ẩn Dịch vụ
        if (servicesBoard) servicesBoard.style.display = 'none';
        if (jobsBoard) jobsBoard.style.display = 'block';
    } else if (user.role === 'client') {
        // Client: Chỉ hiện Dịch vụ (Services Board), ẩn Dự án
        if (servicesBoard) servicesBoard.style.display = 'block';
        if (jobsBoard) jobsBoard.style.display = 'none';
    } else {
        // Admin hoặc vai trò khác: Hiện cả hai
        if (servicesBoard) servicesBoard.style.display = 'block';
        if (jobsBoard) jobsBoard.style.display = 'block';
    }
}

/**
 * Thiết kế lại thanh tìm kiếm cho từng vai trò người dùng (Freelancer và Client)
 */
function adjustSearchFormForRole() {
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const isFreelancer = user && user.role === 'freelancer';

    const keywordCol = document.getElementById('searchKeywordCol');
    const categoryCol = document.getElementById('searchCategoryCol');
    const priceCol = document.getElementById('searchPriceCol');
    const ratingCol = document.getElementById('searchRatingCol');
    const sortCol = document.getElementById('searchSortCol');
    const btnCol = document.getElementById('searchBtnCol');

    const keywordInput = document.getElementById('keyword');
    const priceLabel = document.getElementById('priceLabel');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');

    if (!keywordInput || !sortBySelect) return;

    if (isFreelancer) {
        // --- VAI TRÒ FREELANCER: Tìm kiếm Dự Án ---
        keywordInput.placeholder = "Tên dự án...";
        if (priceLabel) priceLabel.textContent = "Ngân sách tối đa";
        if (maxPriceInput) maxPriceInput.placeholder = "Ví dụ: 10000000";

        // Ẩn cột đánh giá vì Dự án không có thông số rating đánh giá
        if (ratingCol) ratingCol.style.display = 'none';

        // Cân đối lại lưới 2 dòng cân xứng:
        // Dòng 1: Từ khóa (6) + Danh mục (6) = 12
        // Dòng 2: Ngân sách (4) + Sắp xếp (4) + Tìm kiếm (4) = 12
        if (keywordCol) { keywordCol.className = 'col-md-6'; }
        if (categoryCol) { categoryCol.className = 'col-md-6'; }
        if (priceCol) { priceCol.className = 'col-md-4'; }
        if (sortCol) { sortCol.className = 'col-md-4'; }
        if (btnCol) { btnCol.className = 'col-md-4'; }

        // Cấu hình các tùy chọn sắp xếp cho Dự án
        sortBySelect.innerHTML = `
            <option value="default">Mặc định</option>
            <option value="priceAsc">Ngân sách tăng dần</option>
            <option value="priceDesc">Ngân sách giảm dần</option>
        `;
    } else {
        // --- VAI TRÒ CLIENT / KHÁCH / ADMIN: Tìm kiếm Dịch Vụ ---
        keywordInput.placeholder = "Tên dịch vụ...";
        if (priceLabel) priceLabel.textContent = "Mức giá tối đa";
        if (maxPriceInput) maxPriceInput.placeholder = "Ví dụ: 5000000";

        // Hiển thị lại cột đánh giá
        if (ratingCol) ratingCol.style.display = 'block';

        // Khôi phục lưới 3 cột ban đầu (mỗi cột col-md-4)
        if (keywordCol) { keywordCol.className = 'col-md-4'; }
        if (categoryCol) { categoryCol.className = 'col-md-4'; }
        if (priceCol) { priceCol.className = 'col-md-4'; }
        if (sortCol) { sortCol.className = 'col-md-4'; }
        if (btnCol) { btnCol.className = 'col-md-4'; }

        // Khôi phục tùy chọn sắp xếp cho Dịch vụ
        sortBySelect.innerHTML = `
            <option value="default">Mặc định</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="ratingDesc">Đánh giá cao</option>
        `;
    }
}




