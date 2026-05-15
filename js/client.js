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
                clientProjects = jobs.filter(j => j.clientId === currentUser.id);
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
                const completed = jobs.filter(j => j.clientId === currentUser.id && j.status === 'completed');
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
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitReview');
            const freelancerId = document.getElementById('reviewFreelancerId').value;
            const projectId = document.getElementById('reviewProjectId').value;

            const reviewData = {
                clientId: currentUser.id,
                clientName: currentUser.name,
                freelancerId: freelancerId,
                projectId: projectId,
                rating: parseInt(document.getElementById('ratingSelect').value),
                comment: document.getElementById('reviewComment').value.trim(),
                createdAt: new Date().toISOString()
            };

            btn.disabled = true;
            btn.innerHTML = 'Đang gửi...';

            // Bước 1: POST Review
            api.post('/reviews', reviewData)
                .then(() => {
                    // Bước 2: Đánh dấu dự án đã review
                    return api.put(`/jobs/${projectId}`, { isReviewed: true });
                })
                .then(() => {
                    // Bước 3: Tính toán Rating trung bình (Task 2)
                    calculateAndUpdateFreelancerRating(freelancerId);
                    
                    alert('Cảm ơn bạn đã gửi đánh giá!');
                    bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
                    loadCompletedProjects();
                    reviewForm.reset();
                })
                .catch(err => alert('Lỗi: ' + err.message))
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi Đánh Giá';
                });
        });
    }

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

    // Tải dữ liệu ban đầu
    loadMyProjects();
    loadCompletedProjects();
});
