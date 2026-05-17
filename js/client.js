/**
 * CLIENT.JS - Xử lý logic cho Client Dashboard
 * Yêu cầu: Dùng Vanilla JS để fetch data. Dùng jQuery cho 2 thao tác DOM/UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.checkAuth('client')) return;

    const currentUser = Auth.getCurrentUser();
    let clientProjects = [];

    // 1. Đăng dự án mới (Task 1)
    const postProjectForm = document.getElementById('postProjectForm');
    if (postProjectForm) {
        postProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const titleInput = document.getElementById('projectTitle');
            const categoryInput = document.getElementById('projectCategory');
            const budgetInput = document.getElementById('projectBudget');
            const descInput = document.getElementById('projectDesc');
            
            // Reset validation
            [titleInput, categoryInput, budgetInput, descInput].forEach(el => el.classList.remove('is-invalid'));
            document.getElementById('projectTitleError').textContent = '';
            document.getElementById('projectCategoryError').textContent = '';
            document.getElementById('projectBudgetError').textContent = '';
            document.getElementById('projectDescError').textContent = '';
            
            let hasError = false;
            
            if (!titleInput.value.trim()) {
                titleInput.classList.add('is-invalid');
                document.getElementById('projectTitleError').textContent = 'Tiêu đề không được để trống.';
                hasError = true;
            }
            
            if (!categoryInput.value) {
                categoryInput.classList.add('is-invalid');
                document.getElementById('projectCategoryError').textContent = 'Vui lòng chọn danh mục.';
                hasError = true;
            }
            
            if (!budgetInput.value) {
                budgetInput.classList.add('is-invalid');
                document.getElementById('projectBudgetError').textContent = 'Ngân sách không được để trống.';
                hasError = true;
            } else if (parseFloat(budgetInput.value) <= 0) {
                budgetInput.classList.add('is-invalid');
                document.getElementById('projectBudgetError').textContent = 'Ngân sách phải lớn hơn 0.';
                hasError = true;
            }
            
            if (!descInput.value.trim()) {
                descInput.classList.add('is-invalid');
                document.getElementById('projectDescError').textContent = 'Mô tả không được để trống.';
                hasError = true;
            } else if (descInput.value.trim().length < 10) {
                descInput.classList.add('is-invalid');
                document.getElementById('projectDescError').textContent = 'Mô tả phải có ít nhất 10 ký tự.';
                hasError = true;
            }
            
            if (hasError) return;
            
            const btn = document.getElementById('btnPostProject');
            btn.disabled = true;
            btn.innerHTML = 'Đang đăng...';

            const newJob = {
                clientId: currentUser.id,
                clientName: currentUser.name,
                title: document.getElementById('projectTitle').value.trim(),
                category: document.getElementById('projectCategory').value,
                description: document.getElementById('projectDesc').value.trim(),
                budget: document.getElementById('projectBudget').value,
                status: 'pending' // Task 1: Khởi tạo ở trạng thái pending chờ Admin duyệt
            };

            // Dùng Vanilla JS Fetch API
            api.post('/jobs', newJob)
                .then(job => {
                    alert('Đăng tin tuyển dụng thành công!');
                    postProjectForm.reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('postProjectModal'));
                    modal.hide();
                    loadMyProjects(); // Reload list
                })
                .catch(err => {
                    console.error('Lỗi khi đăng tin:', err);
                    alert('Đã xảy ra lỗi khi đăng tin.');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Đăng Tuyển';
                });
        });
    }

    // 2. Hiển thị danh sách dự án (Task 3)
    function loadMyProjects() {
        api.get('/jobs')
            .then(jobs => {
                // Lọc dự án của client hiện tại
                clientProjects = jobs.filter(j => String(j.clientId) === String(currentUser.id));
                renderProjects(clientProjects);
            })
            .catch(err => console.error('Lỗi tải tin tuyển dụng:', err));
    }

    function renderProjects(projects) {
        const tbody = document.getElementById('clientProjectsTableBody');
        tbody.innerHTML = '';

        if (projects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="bi bi-briefcase-x"></i>
                            <h5>Chưa có dự án nào</h5>
                            <p>Bạn chưa đăng bất kỳ dự án nào. Hãy đăng dự án đầu tiên để tìm kiếm freelancer!</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#postProjectModal">Đăng Dự Án Ngay</button>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        projects.forEach(p => {
            let statusBadge = '';
            let deliveryInfo = '';
            
            if (p.status === 'open') {
                statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success">Mở</span>';
            } else if (p.status === 'in-progress') {
                statusBadge = '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary">Đang làm</span>';
            } else if (p.status === 'delivered') {
                statusBadge = '<span class="badge bg-info bg-opacity-10 text-info border border-info animate-pulse">Đã bàn giao</span>';
                deliveryInfo = `
                    <div class="mt-2 p-2 bg-light rounded small border">
                        <p class="mb-1"><strong>Sản phẩm:</strong> <a href="${p.deliveryLink}" target="_blank">Xem link</a></p>
                        <p class="mb-2"><strong>Ghi chú:</strong> ${p.deliveryNote || 'N/A'}</p>
                        <button class="btn btn-sm btn-success w-100 btn-accept-project" data-id="${p.id}">
                            <i class="bi bi-check-circle me-1"></i> Nghiệm thu & Hoàn tất
                        </button>
                    </div>
                `;
            } else if (p.status === 'completed') {
                statusBadge = '<span class="badge bg-secondary">Hoàn tất</span>';
            } else if (p.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-medium text-muted">#${p.id}</td>
                <td class="fw-semibold">
                    ${p.title}
                    ${deliveryInfo}
                </td>
                <td class="text-success fw-bold">${Utils.formatCurrency(p.budget)}</td>
                <td class="project-status-cell">${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary btn-view-bids" data-id="${p.id}" title="Xem Bids">
                        <i class="bi bi-eye"></i> Xem Bids
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Gắn sự kiện xem bids
        document.querySelectorAll('.btn-view-bids').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-id');
                loadBidsForProject(projectId);
                // Chuyển tab sang Manage Bids
                const triggerEl = document.querySelector('a[href="#manage-bids"]');
                bootstrap.Tab.getInstance(triggerEl) || new bootstrap.Tab(triggerEl).show();
                
                // Scroll to top to see results
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // 3. Tải và hiển thị Bids của 1 dự án (Task 3)
    function loadBidsForProject(projectId) {
        const tbody = document.getElementById('clientBidsTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải...</td></tr>';

        // Gọi 2 API song song để lấy thông tin freelancers (cho tên) và bids
        Promise.all([
            api.get('/bids'),
            api.get('/users'),
            api.get('/jobs')
        ]).then(([allBids, allUsers, allJobs]) => {
            const projectBids = allBids.filter(b => String(b.projectId) === String(projectId));
            const project = allJobs.find(p => String(p.id) === String(projectId));

            tbody.innerHTML = '';
            
            if (projectBids.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state">
                                <i class="bi bi-inbox"></i>
                                <h5>Chưa có báo giá</h5>
                                <p>Chưa có freelancer nào chào giá cho dự án <b>${project ? project.title : ''}</b>.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            // Tiêu đề gợi nhớ đang xem bid của dự án nào
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `<td colspan="5" class="bg-light text-primary fw-bold">Danh sách Bids cho dự án: ${project ? project.title : projectId}</td>`;
            tbody.appendChild(headerRow);

            projectBids.forEach(bid => {
                const freelancer = allUsers.find(u => u.id === bid.freelancerId) || { name: 'Unknown' };
                const isAccepted = bid.status === 'accepted';
                const isRejected = bid.status === 'rejected';

                let actionHtml = '';
                if (bid.status === 'pending' && project && project.status === 'approved') {
                    actionHtml = `
                        <button class="btn btn-sm btn-success btn-accept-bid" data-bid-id="${bid.id}" data-project-id="${bid.projectId}">
                            <i class="bi bi-check-lg"></i> Nhận
                        </button>
                    `;
                } else if (isAccepted) {
                    actionHtml = `<span class="badge bg-success">Đã nhận</span>`;
                } else if (isRejected) {
                    actionHtml = `<span class="badge bg-danger">Đã từ chối</span>`;
                } else {
                    actionHtml = `<span class="badge bg-secondary">Không khả dụng</span>`;
                }

                const tr = document.createElement('tr');
                tr.className = `bid-row-${bid.projectId} bid-item`;
                tr.id = `bid-row-${bid.id}`;
                
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 35px; height: 35px;">
                                ${freelancer.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="fw-semibold">${freelancer.name}</span>
                        </div>
                    </td>
                    <td class="text-muted">#${bid.projectId}</td>
                    <td class="text-primary fw-bold">${Utils.formatCurrency(bid.price)}</td>
                    <td class="small text-muted">${bid.message}</td>
                    <td class="text-end action-cell">
                        ${actionHtml}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }).catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu.</td></tr>';
        });
    }

    // 4. Nghiệm thu dự án (Task 2)
    $(document).on('click', '.btn-accept-project', function() {
        const projectId = $(this).data('id');
        if (confirm("Bạn xác nhận sản phẩm đã đạt yêu cầu và muốn hoàn tất dự án này?")) {
            $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
            
            api.put(`/jobs/${projectId}`, { status: 'completed' })
                .then(() => {
                    alert('Dự án đã được nghiệm thu và hoàn tất!');
                    loadMyProjects();
                    loadCompletedProjects();
                })
                .catch(err => alert('Lỗi: ' + err.message));
        }
    });

    // 5. Lịch sử hoàn tất (Task 3)
    function loadCompletedProjects() {
        const tbody = document.getElementById('clientCompletedProjectsTableBody');
        if (!tbody) return;

        api.get('/jobs')
            .then(jobs => {
                const completed = jobs.filter(j => String(j.clientId) === String(currentUser.id) && j.status === 'completed');
                tbody.innerHTML = '';
                
                if (completed.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dự án nào hoàn tất.</td></tr>';
                    return;
                }

                completed.forEach(j => {
                    const reviewBtn = j.isReviewed 
                        ? `<button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-star-fill me-1"></i>Đã đánh giá</button>`
                        : `<button class="btn btn-sm btn-warning btn-open-review" data-id="${j.id}" data-freelancer-id="${j.freelancerId}">
                                <i class="bi bi-star me-1"></i>Đánh giá
                           </button>`;

                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-primary">${j.title}</td>
                            <td>Freelancer ID: ${j.freelancerId || 'N/A'}</td>
                            <td class="text-success fw-bold">${Utils.formatCurrency(j.budget)}</td>
                            <td>${reviewBtn}</td>
                        </tr>
                    `;
                });

                // Gắn sự kiện mở modal Review
                tbody.querySelectorAll('.btn-open-review').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const pid = e.currentTarget.getAttribute('data-id');
                        const fid = e.currentTarget.getAttribute('data-freelancer-id');
                        document.getElementById('reviewProjectId').value = pid;
                        document.getElementById('reviewFreelancerId').value = fid;
                        new bootstrap.Modal(document.getElementById('reviewModal')).show();
                    });
                });
            });
    }

    // 6. Xử lý gửi Đánh giá & Tính toán Rating (Task 1 & 2)
    const reviewForm = document.getElementById('reviewForm');


    /**
     * Thuật toán tính Rating trung bình (Task 2)
     */
    function calculateAndUpdateFreelancerRating(freelancerId) {
        // Step A: Fetch ALL reviews for this freelancer
        api.get('/reviews')
            .then(reviews => {
                const freelancerReviews = reviews.filter(r => String(r.freelancerId) === String(freelancerId));
                
                if (freelancerReviews.length === 0) return;

                // Step B: Calculate Average Rating using reduce()
                const totalStars = freelancerReviews.reduce((sum, r) => sum + r.rating, 0);
                const avgRating = (totalStars / freelancerReviews.length).toFixed(1);

                // Step C: Update Freelancer's rating in /users
                api.put(`/users/${freelancerId}`, { rating: parseFloat(avgRating) })
                    .then(() => console.log(`Freelancer ${freelancerId} rating updated to ${avgRating}`))
                    .catch(err => console.error('Error updating freelancer rating:', err));
            });
    }

    // Task 3: Client Managing Bids - YÊU CẦU DÙNG jQuery
    $(document).on('click', '.btn-accept-bid', function() {
        const $btn = $(this);
        const bidId = $btn.data('bid-id');
        const projectId = $btn.data('project-id');
        
        api.get(`/bids/${bidId}`).then(bid => {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/bids/${bidId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'accepted' }),
                success: function() {
                    $.ajax({
                        url: api.getUrl(`/jobs/${projectId}`),
                        method: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify({ 
                            status: 'in-progress',
                            freelancerId: bid.freelancerId
                        }),
                        success: function() {
                            $btn.parent('.action-cell').html('<span class="badge bg-success">Đã nhận</span>');
                            $(`.bid-row-${projectId}`).not(`#bid-row-${bidId}`).fadeOut(500, function() {
                                $(this).remove();
                            });
                            loadMyProjects();
                        }
                    });
                }
            });
        });
    });

    // 7. QUẢN LÝ DỊCH VỤ ĐÃ THUÊ (Task 2 & 3)
    // ==========================================
    window.loadServiceRequests = function() {
        const tbody = document.getElementById('clientRequestsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải dữ liệu...</td></tr>';

        Promise.all([
            api.get('/requests'),
            api.get('/services'),
            api.get('/users')
        ]).then(([requests, services, users]) => {
            const myRequests = Array.isArray(requests) ? requests.filter(r => String(r.clientId) === String(currentUser.id)) : [];
            renderServiceRequests(myRequests, services || [], users || []);
        }).catch(err => {
            console.error("Lỗi tải Service Requests:", err);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi kết nối API. Hãy kiểm tra MockAPI!</td></tr>';
        });
    };

    function renderServiceRequests(requests, services, users) {
        const tbody = document.getElementById('clientRequestsTableBody');
        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Bạn chưa thuê dịch vụ nào.</td></tr>';
            return;
        }

        requests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(req => {
            const service = services.find(s => String(s.id) === String(req.serviceId));
            const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;
            
            // Map Freelancer ID to Name
            const freelancer = users.find(u => String(u.id) === String(service?.freelancerId));
            const freelancerDisplay = freelancer ? freelancer.name : `Freelancer #${service?.freelancerId || '?'}`;

            let statusBadge = '';
            let actionBtn = '';

            if (req.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
            } else if (req.status === 'accepted') {
                statusBadge = '<span class="badge bg-primary">Đang thực hiện</span>';
            } else if (req.status === 'delivered') {
                statusBadge = '<span class="badge bg-info animate-pulse">Đã bàn giao</span>';
                actionBtn = `<button class="btn btn-sm btn-success btn-pay-request" data-id="${req.id}" data-title="${serviceTitle}" data-amount="${req.proposedBudget}" data-freelancer-id="${service ? service.freelancerId : ''}">Thanh toán & Nghiệm thu</button>`;
            } else if (req.status === 'completed') {
                statusBadge = '<span class="badge bg-success">Hoàn tất</span>';
                if (!req.isReviewed) {
                    actionBtn = `<button class="btn btn-sm btn-warning btn-open-review-req" data-id="${req.id}" data-freelancer-id="${service ? service.freelancerId : ''}">Đánh giá</button>`;
                } else {
                    actionBtn = `<span class="text-muted small">Đã đánh giá</span>`;
                }
            } else if (req.status === 'rejected') {
                statusBadge = '<span class="badge bg-danger">Bị từ chối</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="fw-bold">${serviceTitle}</span></td>
                <td>
                    <div class="fw-semibold">${freelancerDisplay}</div>
                    <div class="small text-muted">ID: ${service?.freelancerId || '?'}</div>
                </td>
                <td>${req.proposedDeadline || 'N/A'}</td>
                <td class="text-primary fw-bold">${Utils.formatCurrency(req.proposedBudget)}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        // Gắn sự kiện thanh toán
        tbody.querySelectorAll('.btn-pay-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, title, amount, freelancerId } = e.target.dataset;
                document.getElementById('payServiceTitle').textContent = title;
                document.getElementById('payAmount').textContent = Utils.formatCurrency(amount);
                
                // Lưu thông tin vào nút xác nhận
                const confirmBtn = document.getElementById('btnConfirmPayment');
                confirmBtn.dataset.id = id;
                confirmBtn.dataset.freelancerId = freelancerId;
                
                new bootstrap.Modal(document.getElementById('paymentModal')).show();
            });
        });

        // Gắn sự kiện đánh giá (cho request)
        tbody.querySelectorAll('.btn-open-review-req').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reqId = e.currentTarget.dataset.id;
                const fid = e.currentTarget.dataset.freelancerId;
                document.getElementById('reviewProjectId').value = reqId;
                document.getElementById('reviewProjectId').dataset.type = 'request';
                document.getElementById('reviewFreelancerId').value = fid;
                resetStarRating(); // Reset stars UI
                new bootstrap.Modal(document.getElementById('reviewModal')).show();
            });
        });
    }

    // Xử lý xác nhận thanh toán (Task 2)
    const btnConfirmPayment = document.getElementById('btnConfirmPayment');
    if (btnConfirmPayment) {
        btnConfirmPayment.addEventListener('click', function() {
            const id = this.dataset.id;
            const freelancerId = this.dataset.freelancerId;
            
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';

            api.put(`/requests/${id}`, { status: 'completed' })
                .then(() => {
                    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
                    // Tự động mở modal đánh giá
                    document.getElementById('reviewProjectId').value = id;
                    document.getElementById('reviewProjectId').dataset.type = 'request';
                    document.getElementById('reviewFreelancerId').value = freelancerId;
                    resetStarRating();
                    new bootstrap.Modal(document.getElementById('reviewModal')).show();
                    
                    loadServiceRequests();
                })
                .catch(err => alert('Lỗi thanh toán: ' + err.message))
                .finally(() => {
                    this.disabled = false;
                    this.innerHTML = 'Xác nhận đã chuyển khoản';
                });
        });
    }

    // Cập nhật lại logic gửi đánh giá để hỗ trợ cả Job và Request
    if (reviewForm) {
        reviewForm.onsubmit = (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitReview');
            const freelancerId = document.getElementById('reviewFreelancerId').value;
            const id = document.getElementById('reviewProjectId').value;
            const type = document.getElementById('reviewProjectId').dataset.type || 'job';

            const ratingVal = parseInt(document.getElementById('ratingValue').value);
            if (ratingVal === 0) {
                document.getElementById('ratingError').style.display = 'block';
                return;
            }

            const reviewData = {
                clientId: currentUser.id,
                clientName: currentUser.name,
                freelancerId: freelancerId,
                projectId: id,
                type: type,
                rating: ratingVal,
                comment: document.getElementById('reviewComment').value.trim(),
                createdAt: new Date().toISOString()
            };

            btn.disabled = true;
            btn.innerHTML = 'Đang gửi...';

            api.post('/reviews', reviewData)
                .then(() => {
                    const endpoint = type === 'request' ? `/requests/${id}` : `/jobs/${id}`;
                    return api.put(endpoint, { isReviewed: true });
                })
                .then(() => {
                    calculateAndUpdateFreelancerRating(freelancerId);
                    alert('Cảm ơn bạn đã gửi đánh giá!');
                    if (type === 'request') loadServiceRequests();
                    else loadCompletedProjects();
                    reviewForm.reset();
                    resetStarRating();
                })
                .catch(err => alert('Lỗi: ' + err.message))
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi Đánh Giá';
                });
        };
    }

    // Logic Đánh giá bằng Ngôi sao (Task: Star UI)
    const stars = document.querySelectorAll('.star-rating-ui .star');
    const ratingInput = document.getElementById('ratingValue');
    const ratingError = document.getElementById('ratingError');

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const val = this.getAttribute('data-value');
            ratingInput.value = val;
            
            // Cập nhật giao diện sao
            stars.forEach(s => {
                const sVal = parseInt(s.getAttribute('data-value'));
                if (sVal <= parseInt(val)) {
                    s.classList.add('active');
                    s.innerHTML = '★'; // Sao đầy
                } else {
                    s.classList.remove('active');
                    s.innerHTML = '☆'; // Sao rỗng
                }
            });
            if (ratingError) ratingError.style.display = 'none';
        });
    });

    function resetStarRating() {
        if (!ratingInput) return;
        ratingInput.value = '0';
        stars.forEach(s => {
            s.classList.remove('active');
            s.innerHTML = '☆';
        });
        if (ratingError) ratingError.style.display = 'none';
    }

    // Tải dữ liệu ban đầu
    loadMyProjects();
    loadCompletedProjects();
    loadServiceRequests();
});
