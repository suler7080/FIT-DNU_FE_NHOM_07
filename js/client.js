/**
 * CLIENT.JS - Xử lý logic cho Client Dashboard
 * Yêu cầu: Dùng Vanilla JS để fetch data. Dùng jQuery cho 2 thao tác DOM/UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.checkAuth('client')) return;

    const currentUser = Auth.getCurrentUser();
    let clientProjects = [];
    let currentProjectsPage = 1;
    let currentCompletedProjectsPage = 1;
    let currentRequestsPage = 1;
    let currentBidsPage = 1;
    let currentBidsProjectId = null;

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
                    if (typeof Utils !== 'undefined' && Utils.logAudit) {
                        Utils.logAudit('Đăng dự án', `Khách hàng ${currentUser.name} đã đăng dự án mới: "${newJob.title}" (Chờ duyệt).`);
                    }
                    Utils.showToast('Đăng tin tuyển dụng thành công!', 'success');
                    postProjectForm.reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('postProjectModal'));
                    modal.hide();
                    loadMyProjects(); // Reload list
                })
                .catch(err => {
                    console.error('Lỗi khi đăng tin:', err);
                    Utils.showToast('Đã xảy ra lỗi khi đăng tin.', 'error');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Đăng Tuyển';
                });
        });
    }

    // 2. Hiển thị danh sách dự án (Task 3)
    function loadMyProjects() {
        Promise.all([
            api.get('/jobs'),
            api.get('/users').catch(() => [])
        ])
            .then(([jobs, users]) => {
                // Lọc dự án của client hiện tại
                clientProjects = jobs.filter(j => String(j.clientId) === String(currentUser.id));
                window.__clientJobs = clientProjects;
                renderProjects(clientProjects, users);
                renderClientCharts();
            })
            .catch(err => console.error('Lỗi tải tin tuyển dụng:', err));
    }

    // Modal Edit Project & Submission
    function openEditProjectModal(projectId) {
        api.get('/jobs/' + projectId)
            .then(job => {
                document.getElementById('editProjectId').value = job.id;
                document.getElementById('editProjectTitle').value = job.title;
                document.getElementById('editProjectCategory').value = job.category;
                document.getElementById('editProjectBudget').value = job.budget;
                document.getElementById('editProjectDesc').value = job.description;

                // Reset validations
                const titleInput = document.getElementById('editProjectTitle');
                const categoryInput = document.getElementById('editProjectCategory');
                const budgetInput = document.getElementById('editProjectBudget');
                const descInput = document.getElementById('editProjectDesc');
                [titleInput, categoryInput, budgetInput, descInput].forEach(el => el.classList.remove('is-invalid'));

                const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
                modal.show();
            })
            .catch(err => {
                console.error(err);
                Utils.showToast('Không thể tải thông tin dự án.', 'error');
            });
    }

    const editProjectForm = document.getElementById('editProjectForm');
    if (editProjectForm) {
        editProjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const idInput = document.getElementById('editProjectId');
            const titleInput = document.getElementById('editProjectTitle');
            const categoryInput = document.getElementById('editProjectCategory');
            const budgetInput = document.getElementById('editProjectBudget');
            const descInput = document.getElementById('editProjectDesc');
            
            // Reset validation
            [titleInput, categoryInput, budgetInput, descInput].forEach(el => el.classList.remove('is-invalid'));
            
            let hasError = false;
            
            if (!titleInput.value.trim()) {
                titleInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (!categoryInput.value) {
                categoryInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (!budgetInput.value || parseFloat(budgetInput.value) <= 0) {
                budgetInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (!descInput.value.trim() || descInput.value.trim().length < 10) {
                descInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (hasError) return;
            
            const btn = document.getElementById('btnUpdateProject');
            btn.disabled = true;
            btn.innerHTML = 'Đang lưu...';

            const updatedJob = {
                title: titleInput.value.trim(),
                category: categoryInput.value,
                description: descInput.value.trim(),
                budget: budgetInput.value
            };

            api.put('/jobs/' + idInput.value, updatedJob)
                .then(job => {
                    if (typeof Utils !== 'undefined' && Utils.logAudit) {
                        Utils.logAudit('Cập nhật dự án', `Khách hàng ${currentUser.name} đã cập nhật thông tin dự án: "${updatedJob.title}".`);
                    }
                    Utils.showToast('Cập nhật tin tuyển dụng thành công!', 'success');
                    editProjectForm.reset();
                    const modalEl = document.getElementById('editProjectModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    loadMyProjects(); // Reload list
                })
                .catch(err => {
                    console.error('Lỗi khi cập nhật tin:', err);
                    Utils.showToast('Đã xảy ra lỗi khi cập nhật tin: ' + err.message, 'error');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Lưu Thay Đổi';
                });
        });
    }

    // Lắng nghe sự kiện chuyển tab Sidebar để xem toàn bộ Bids của Client
    $(document).on('shown.bs.tab', 'a[href="#manage-bids"]', function() {
        loadBidsForProject(null);
    });

    function renderProjects(projects, users = []) {
        const tbody = document.getElementById('clientProjectsTableBody');
        tbody.innerHTML = '';

        if (projects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="bi bi-briefcase-x"></i>
                            <h5>Chưa có dự án nào</h5>
                            <p>Bạn chưa đăng bất kỳ dự án nào. Hãy đăng dự án đầu tiên để tìm kiếm freelancer!</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#postProjectModal">Đăng Dự Án Ngay</button>
                        </div>
                    </td>
                </tr>`;
            Utils.renderPagination('clientProjectsPagination', 1, 1, null);
            return;
        }

        const paginateResult = Utils.paginateArray(projects, currentProjectsPage, 10);
        currentProjectsPage = paginateResult.currentPage;

        paginateResult.paginatedItems.forEach(p => {
            let statusBadge = '';
            let deliveryInfo = '';

            if (p.status === 'open' || p.status === 'approved') {
                statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success">Mở</span>';
            } else if (p.status === 'in-progress') {
                statusBadge = '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary">Đang làm</span>';
            } else if (p.status === 'delivered') {
                statusBadge = '<span class="badge bg-info bg-opacity-10 text-info border border-info animate-pulse">Đã bàn giao</span>';
                deliveryInfo = `
                    <div class="mt-2 p-2 bg-light rounded small border">
                        <p class="mb-1"><strong>Sản phẩm:</strong> <a href="${p.deliveryLink}" target="_blank">Xem link</a></p>
                        <p class="mb-2"><strong>Ghi chú:</strong> ${p.deliveryNote || 'N/A'}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-success flex-grow-1 btn-accept-project" data-id="${p.id}">
                                <i class="bi bi-check-circle me-1"></i> Nghiệm thu & Giải ngân
                            </button>
                            <button class="btn btn-sm btn-outline-warning text-warning btn-request-revision" data-id="${p.id}" data-type="job">
                                <i class="bi bi-arrow-counterclockwise me-1"></i> Sửa lại
                            </button>
                        </div>
                    </div>
                `;
            } else if (p.status === 'revision_requested') {
                statusBadge = '<span class="badge bg-warning text-dark border border-warning">Yêu cầu sửa lại</span>';
                deliveryInfo = `
                    <div class="mt-2 p-2 bg-light rounded small border">
                        <p class="mb-1 text-warning"><strong>Chờ sửa lại:</strong> Freelancer đang sửa đổi sản phẩm.</p>
                        <p class="mb-0"><strong>Yêu cầu chỉnh sửa:</strong> ${p.revisionInstructions || 'N/A'}</p>
                    </div>
                `;
            } else if (p.status === 'disputed') {
                statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Tranh chấp</span>';
                deliveryInfo = `
                    <div class="mt-2 p-2 bg-light rounded small border">
                        <p class="mb-0 text-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i> <strong>Tranh chấp:</strong> Chờ ban trọng tài phân xử.</p>
                    </div>
                `;
            } else if (p.status === 'completed') {
                statusBadge = '<span class="badge bg-secondary">Hoàn tất</span>';
            } else if (p.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
            }

            // Map Freelancer ID to Name/Info
            let freelancerInfo = '<span class="text-muted small">Chưa có</span>';
            if (p.freelancerId) {
                const freelancer = users.find(u => String(u.id) === String(p.freelancerId));
                if (freelancer) {
                    freelancerInfo = `
                        <div class="d-flex align-items-center">
                            <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style="width: 30px; height: 30px; font-size: 13px;">
                                ${freelancer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span class="fw-semibold small d-block text-dark">${Utils.escapeHtml(freelancer.name)}</span>
                                <span class="text-muted d-block" style="font-size: 10px;">${Utils.escapeHtml(freelancer.email || '')}</span>
                            </div>
                        </div>
                    `;
                } else {
                    freelancerInfo = `<span class="text-muted small">Freelancer #${p.freelancerId}</span>`;
                }
            } else if (p.status === 'open' || p.status === 'approved') {
                freelancerInfo = '<span class="badge bg-light text-success border border-success border-opacity-25 small">Đang tuyển</span>';
            }

            let actionHtml = '';
            if (p.status === 'pending' || p.status === 'open' || p.status === 'approved') {
                actionHtml = `
                    <button class="btn btn-sm btn-outline-warning btn-edit-project me-1" data-id="${p.id}" title="Sửa">
                        <i class="bi bi-pencil-square"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-project me-1" data-id="${p.id}" title="Xóa">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                `;
                if (p.status === 'open' || p.status === 'approved') {
                    actionHtml += `
                        <button class="btn btn-sm btn-outline-primary btn-view-bids" data-id="${p.id}" title="Xem Bids">
                            <i class="bi bi-eye"></i> Xem Bids
                        </button>
                    `;
                }
            } else {
                actionHtml = `
                    <button class="btn btn-sm btn-outline-primary btn-view-bids" data-id="${p.id}" title="Xem Bids">
                        <i class="bi bi-eye"></i> Xem Bids
                    </button>
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-medium text-secondary">#${p.id}</td>
                <td class="fw-semibold">
                    ${p.title}
                    ${deliveryInfo}
                </td>
                <td class="text-success fw-bold">${Utils.formatCurrency(p.budget)}</td>
                <td>${freelancerInfo}</td>
                <td class="project-status-cell">${statusBadge}</td>
                <td class="text-end action-cell">
                    ${actionHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Render thanh phân trang
        Utils.renderPagination('clientProjectsPagination', currentProjectsPage, paginateResult.totalPages, function(newPage) {
            currentProjectsPage = newPage;
            renderProjects(projects, users);
        });

        // Gắn sự kiện xem bids
        document.querySelectorAll('.btn-view-bids').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-id');
                loadBidsForProject(projectId);
                
                // Chuyển tab sang Manage Bids
                const triggerEl = document.querySelector('a[href="#manage-bids"]');
                let tab = bootstrap.Tab.getInstance(triggerEl);
                if (!tab) {
                    tab = new bootstrap.Tab(triggerEl);
                }
                tab.show();
                
                // Scroll to top to see results
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Gắn sự kiện sửa dự án
        document.querySelectorAll('.btn-edit-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-id');
                openEditProjectModal(projectId);
            });
        });

        // Gắn sự kiện xóa dự án
        document.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-id');
                Utils.showConfirmDialog(
                    'Xác nhận xóa dự án',
                    'Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác.',
                    () => {
                        api.delete('/jobs/' + projectId)
                            .then(() => {
                                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                                    Utils.logAudit('Xóa dự án', `Khách hàng ${currentUser.name} đã xóa dự án #${projectId}.`);
                                }
                                Utils.showToast('Xóa dự án thành công!', 'success');
                                loadMyProjects();
                            })
                            .catch(err => {
                                console.error(err);
                                Utils.showToast('Có lỗi xảy ra khi xóa dự án: ' + err.message, 'error');
                            });
                    }
                );
            });
        });
    }

    // 3. Tải và hiển thị Bids của 1 hoặc toàn bộ dự án
    function loadBidsForProject(projectId) {
        if (currentBidsProjectId !== projectId) {
            currentBidsProjectId = projectId;
            currentBidsPage = 1;
        }

        const tbody = document.getElementById('clientBidsTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải...</td></tr>';

        // Gọi 3 API song song để lấy thông tin freelancers (cho tên) và bids
        Promise.all([
            api.get('/bids'),
            api.get('/users'),
            api.get('/jobs')
        ]).then(([allBids, allUsers, allJobs]) => {
            const clientJobs = allJobs.filter(j => String(j.clientId) === String(currentUser.id));
            const clientJobIds = clientJobs.map(j => String(j.id));
            
            let projectBids = [];
            let headerText = '';

            let currentProject = null;
            if (projectId) {
                projectBids = allBids.filter(b => String(b.projectId) === String(projectId));
                currentProject = clientJobs.find(p => String(p.id) === String(projectId));
                headerText = `Danh sách Bids cho dự án: ${currentProject ? currentProject.title : `#${projectId}`}`;
            } else {
                projectBids = allBids.filter(b => clientJobIds.includes(String(b.projectId)));
                headerText = 'Tất cả Bids nhận được cho các dự án của bạn';
            }

            tbody.innerHTML = '';
            
            if (projectBids.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state">
                                <i class="bi bi-inbox"></i>
                                <h5>Chưa có báo giá</h5>
                                <p>Chưa có freelancer nào chào giá cho ${projectId ? 'dự án này' : 'các dự án của bạn'}.</p>
                            </div>
                        </td>
                    </tr>`;
                Utils.renderPagination('clientBidsPagination', 1, 1, null);
                return;
            }

            const paginateResult = Utils.paginateArray(projectBids, currentBidsPage, 10);
            currentBidsPage = paginateResult.currentPage;

            // Tiêu đề gợi nhớ đang xem bid của dự án nào
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `<td colspan="5" class="bg-light text-primary fw-bold">${headerText}</td>`;
            tbody.appendChild(headerRow);

            paginateResult.paginatedItems.forEach(bid => {
                const freelancer = allUsers.find(u => u.id === bid.freelancerId) || { name: 'Unknown' };
                const isAccepted = bid.status === 'accepted';
                const isRejected = bid.status === 'rejected';

                let actionHtml = '';
                if (bid.status === 'pending' && currentProject && (currentProject.status === 'approved' || currentProject.status === 'open')) {
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
                    <td class="text-secondary">#${bid.projectId}</td>
                    <td class="text-primary fw-bold">${Utils.formatCurrency(bid.price)}</td>
                    <td class="small text-muted">${bid.message}</td>
                    <td class="text-end action-cell">
                        ${actionHtml}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            Utils.renderPagination('clientBidsPagination', currentBidsPage, paginateResult.totalPages, function(newPage) {
                currentBidsPage = newPage;
                loadBidsForProject(projectId);
            });
        }).catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu.</td></tr>';
        });
    }

    // 4. Nghiệm thu dự án (Task 2) — Hiển thị Payment Modal với breakdown hoa hồng
    $(document).on('click', '.btn-accept-project', function() {
        const projectId = $(this).data('id');
        const projectTitle = $(this).data('title') || 'Dự án';
        const projectBudget = parseFloat($(this).data('budget')) || 0;

        api.get(`/jobs/${projectId}`).then(job => {
            const freelancerId = job.freelancerId;
            if (!freelancerId) {
                Utils.showToast('Không tìm thấy freelancer thực hiện dự án này.', 'error');
                return;
            }

            const escrowAmt = projectBudget || parseFloat(job.budget) || 0;
            const commission = Math.round(escrowAmt * 0.07);
            const freelancerReceives = escrowAmt - commission;

            // Hiển thị breakdown trong payment modal
            document.getElementById('payServiceTitle').textContent = job.title || projectTitle;
            document.getElementById('payAmount').textContent = Utils.formatCurrency(escrowAmt);
            document.getElementById('payCommissionAmount').textContent = '- ' + Utils.formatCurrency(commission);
            document.getElementById('payFreelancerReceives').textContent = Utils.formatCurrency(freelancerReceives);

            // Reset checkbox
            const checkbox = document.getElementById('payAgreeCheckbox');
            if (checkbox) checkbox.checked = false;

            // Gán data vào confirm button — đánh dấu là 'job' để xử lý đúng API
            const confirmBtn = document.getElementById('btnConfirmPayment');
            confirmBtn.dataset.id = projectId;
            confirmBtn.dataset.freelancerId = freelancerId;
            confirmBtn.dataset.type = 'job';

            new bootstrap.Modal(document.getElementById('paymentModal')).show();
        }).catch(err => {
            Utils.showToast('Lỗi tải thông tin dự án: ' + err.message, 'error');
        });
    });


    // 5. Lịch sử hoàn tất (Task 3)
    function loadCompletedProjects() {
        const tbody = document.getElementById('clientCompletedProjectsTableBody');
        if (!tbody) return;

        Promise.all([
            api.get('/jobs'),
            api.get('/users').catch(() => [])
        ])
            .then(([jobs, users]) => {
                const completed = jobs.filter(j => String(j.clientId) === String(currentUser.id) && j.status === 'completed');
                tbody.innerHTML = '';
                
                if (completed.length === 0) {
                    tbody.innerHTML = Utils.renderTableEmptyState(4, 'Chưa có dự án nào hoàn tất.', 'bi-check-circle', 'Tìm freelancer ngay', "window.location.href='index.html#servicesContainer'");
                    Utils.renderPagination('clientCompletedProjectsPagination', 1, 1, null);
                    return;
                }

                const paginateResult = Utils.paginateArray(completed, currentCompletedProjectsPage, 10);
                currentCompletedProjectsPage = paginateResult.currentPage;

                paginateResult.paginatedItems.forEach(j => {
                    const freelancer = users.find(u => String(u.id) === String(j.freelancerId));
                    const freelancerDisplay = freelancer ? freelancer.name : `Freelancer #${j.freelancerId || 'N/A'}`;

                    const reviewBtn = j.isReviewed 
                        ? `<button class="btn btn-sm btn-outline-secondary" disabled><i class="bi bi-star-fill me-1"></i>Đã đánh giá</button>`
                        : `<button class="btn btn-sm btn-warning btn-open-review" data-id="${j.id}" data-freelancer-id="${j.freelancerId}">
                                <i class="bi bi-star me-1"></i>Đánh giá
                           </button>`;

                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-primary">${j.title}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold" style="width: 28px; height: 28px; font-size: 11px;">
                                        ${freelancerDisplay.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span class="fw-semibold small d-block text-dark">${Utils.escapeHtml(freelancerDisplay)}</span>
                                        <span class="text-muted d-block" style="font-size: 9px;">${freelancer && freelancer.email ? Utils.escapeHtml(freelancer.email) : ''}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="text-success fw-bold">${Utils.formatCurrency(j.budget)}</td>
                            <td>${reviewBtn}</td>
                        </tr>
                    `;
                });

                Utils.renderPagination('clientCompletedProjectsPagination', currentCompletedProjectsPage, paginateResult.totalPages, function(newPage) {
                    currentCompletedProjectsPage = newPage;
                    loadCompletedProjects();
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
            const bidPrice = parseFloat(bid.price);
            
            Wallet.getBalance(currentUser.id, 'client').then(clientBal => {
                if (clientBal < bidPrice) {
                    Utils.showToast(`Số dư ví không đủ để nhận bid này (${Utils.formatCurrency(bidPrice)}). Vui lòng nạp thêm tiền vào ví.`, 'warning');
                    return;
                }
                
                Utils.showConfirmDialog(
                    'Chấp nhận Báo giá',
                    `Bạn có chắc chắn muốn chấp nhận bid trị giá ${Utils.formatCurrency(bidPrice)}? Số tiền này sẽ được ký quỹ (tạm giữ) bởi hệ thống.`,
                    () => {
                        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
                        
                        Promise.all([
                            Wallet.withdraw(currentUser.id, bidPrice, 'client'),
                            Wallet.setEscrow(projectId, bidPrice)
                        ]).then(() => {
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
                                            freelancerId: bid.freelancerId,
                                            budget: bidPrice
                                        }),
                                        success: function() {
                                            if (typeof Utils !== 'undefined' && Utils.logAudit) {
                                                Utils.logAudit('Ký quỹ dự án', `Khách hàng ${currentUser.name} đã ký quỹ và chọn Freelancer #${bid.freelancerId} thực hiện dự án #${projectId} với giá ${Utils.formatCurrency(bidPrice)}.`);
                                            }
                                            $btn.parent('.action-cell').html('<span class="badge bg-success">Đã nhận</span>');
                                            $(`.bid-row-${projectId}`).not(`#bid-row-${bidId}`).fadeOut(500, function() {
                                                $(this).remove();
                                            });
                                            loadMyProjects();
                                            updateWalletUI();
                                        }
                                    });
                                }
                            });
                        }).catch(err => {
                            Utils.showToast("Lỗi ký quỹ giao dịch: " + err.message, "error");
                            $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Nhận');
                        });
                    }
                );
            }).catch(err => {
                console.error("Lỗi lấy số dư ví:", err);
            });
        }).catch(err => {
            console.error("Error accepting bid:", err);
            Utils.showToast("Lỗi khi tải thông tin bid.", 'error');
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
            window.__clientRequests = myRequests;
            renderServiceRequests(myRequests, services || [], users || []);
            renderClientCharts();
        }).catch(err => {
            console.error("Lỗi tải Service Requests:", err);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi kết nối API. Hãy kiểm tra MockAPI!</td></tr>';
        });
    };

    function renderServiceRequests(requests, services, users) {
        const tbody = document.getElementById('clientRequestsTableBody');
        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = Utils.renderTableEmptyState(6, 'Bạn chưa thuê dịch vụ nào.', 'bi-cart-x', 'Khám phá dịch vụ', "window.location.href='index.html#servicesContainer'");
            Utils.renderPagination('clientRequestsPagination', 1, 1, null);
            return;
        }

        const sortedRequests = [...requests].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        const paginateResult = Utils.paginateArray(sortedRequests, currentRequestsPage, 10);
        currentRequestsPage = paginateResult.currentPage;

        paginateResult.paginatedItems.forEach(req => {
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
                actionBtn = `
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-success btn-pay-request" data-id="${req.id}" data-title="${serviceTitle}" data-amount="${req.proposedBudget}" data-freelancer-id="${service ? service.freelancerId : ''}">
                            <i class="bi bi-cash-coin me-1"></i> Nghiệm thu
                        </button>
                        <button class="btn btn-sm btn-outline-warning text-warning btn-request-revision" data-id="${req.id}" data-type="request">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> Sửa lại
                        </button>
                    </div>
                `;
            } else if (req.status === 'revision_requested') {
                statusBadge = '<span class="badge bg-warning text-dark border border-warning">Yêu cầu sửa lại</span>';
                actionBtn = '<span class="text-muted small">Đang sửa đổi</span>';
            } else if (req.status === 'disputed') {
                statusBadge = '<span class="badge bg-danger text-dark border border-danger">Tranh chấp</span>';
                actionBtn = '<span class="text-muted small">Chờ Admin xử lý</span>';
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

        Utils.renderPagination('clientRequestsPagination', currentRequestsPage, paginateResult.totalPages, function(newPage) {
            currentRequestsPage = newPage;
            renderServiceRequests(requests, services, users);
        });

        // Gắn sự kiện thanh toán
        tbody.querySelectorAll('.btn-pay-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const { id, title, amount, freelancerId } = btn.dataset;
                const escrowAmt = parseFloat(amount) || 0;
                const commission = Math.round(escrowAmt * 0.07);
                const freelancerReceives = escrowAmt - commission;

                // Cập nhật breakdown
                document.getElementById('payServiceTitle').textContent = title;
                document.getElementById('payAmount').textContent = Utils.formatCurrency(escrowAmt);
                document.getElementById('payCommissionAmount').textContent = '- ' + Utils.formatCurrency(commission);
                document.getElementById('payFreelancerReceives').textContent = Utils.formatCurrency(freelancerReceives);

                // Reset checkbox
                const checkbox = document.getElementById('payAgreeCheckbox');
                if (checkbox) checkbox.checked = false;
                
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
            // Kiểm tra checkbox xác nhận
            const agreeCheckbox = document.getElementById('payAgreeCheckbox');
            if (agreeCheckbox && !agreeCheckbox.checked) {
                agreeCheckbox.closest('.form-check').style.boxShadow = '0 0 0 2px #ef4444';
                agreeCheckbox.closest('.form-check').style.borderColor = '#ef4444';
                setTimeout(() => {
                    agreeCheckbox.closest('.form-check').style.boxShadow = '';
                    agreeCheckbox.closest('.form-check').style.borderColor = '';
                }, 2000);
                return;
            }

            const id = this.dataset.id;
            const freelancerId = this.dataset.freelancerId;
            const payType = this.dataset.type || 'request'; // 'job' or 'request'

            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';

            const endpoint = payType === 'job' ? `/jobs/${id}` : `/requests/${id}`;

            api.put(endpoint, {
                status: 'completed',
                completedAt: new Date().toISOString()
            })
                .then(() => {
                    // Giải ngân escrow (đã trừ 7% hoa hồng bên trong Wallet.releaseEscrow)
                    return Wallet.releaseEscrow(id, freelancerId);
                })
                .then(() => {
                    if (typeof Utils !== 'undefined' && Utils.logAudit) {
                        Utils.logAudit('Hoàn thành & Giải ngân', `Khách hàng ${currentUser.name} đã xác nhận hoàn thành dự án/yêu cầu #${id} và giải ngân cho Freelancer #${freelancerId}.`);
                    }
                    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();

                    // Mở modal đánh giá
                    document.getElementById('reviewProjectId').value = id;
                    document.getElementById('reviewProjectId').dataset.type = payType;
                    document.getElementById('reviewFreelancerId').value = freelancerId;
                    resetStarRating();
                    new bootstrap.Modal(document.getElementById('reviewModal')).show();

                    // Refresh data
                    if (payType === 'job') {
                        loadMyProjects();
                        loadCompletedProjects();
                    } else {
                        loadServiceRequests();
                    }
                    updateWalletUI();
                })
                .catch(err => Utils.showToast('Lỗi thanh toán: ' + err.message, 'error'))
                .finally(() => {
                    this.disabled = false;
                    this.innerHTML = '<i class="bi bi-check-circle me-2"></i>Xác nhận giải ngân & Hoàn tất';
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
                    Utils.showToast('Cảm ơn bạn đã gửi đánh giá!', 'success');
                    if (type === 'request') loadServiceRequests();
                    else loadCompletedProjects();
                    reviewForm.reset();
                    resetStarRating();
                })
                .catch(err => Utils.showToast('Lỗi: ' + err.message, 'error'))
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



    // Wallet UI updating function
    function updateWalletUI() {
        Wallet.getBalance(currentUser.id, 'client')
            .then(bal => {
                $('#clientWalletBalance').text(Utils.formatCurrency(bal));
            })
            .catch(err => console.warn('Lỗi tải số dư ví client:', err));

        let totalEscrow = 0;
        Promise.all([
            api.get('/jobs'),
            api.get('/requests')
        ]).then(([jobs, requests]) => {
            const myJobs = Array.isArray(jobs) ? jobs.filter(j => String(j.clientId) === String(currentUser.id)) : [];
            const myRequests = Array.isArray(requests) ? requests.filter(r => String(r.clientId) === String(currentUser.id)) : [];
            
            // Tính tổng Escrow bằng Promise.all
            const jobEscrowPromises = myJobs.map(j => Wallet.getEscrow(j.id));
            const reqEscrowPromises = myRequests.map(r => Wallet.getEscrow(r.id));
            
            Promise.all([...jobEscrowPromises, ...reqEscrowPromises])
                .then(escrows => {
                    totalEscrow = escrows.reduce((sum, val) => sum + val, 0);
                    $('#clientEscrowBalance').text(Utils.formatCurrency(totalEscrow));
                })
                .catch(err => console.warn('Lỗi tính toán tổng Escrow:', err));
            
            const activeCount = myJobs.filter(j => j.status === 'in-progress' || j.status === 'delivered' || j.status === 'revision_requested' || j.status === 'disputed').length + 
                               myRequests.filter(r => r.status === 'accepted' || r.status === 'delivered' || r.status === 'revision_requested' || r.status === 'disputed').length;
            $('#clientActiveCount').text(activeCount);
        }).catch(err => {
            console.error("Error calculating escrow balance:", err);
        });
    }

    // Event listeners for wallet and escrow updates
    window.addEventListener('walletUpdate', (e) => {
        if (String(e.detail.userId) === String(currentUser.id)) {
            updateWalletUI();
        }
    });
    window.addEventListener('escrowUpdate', (e) => {
        updateWalletUI();
    });

    // Simulated Deposit Form Submission
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amountInput = document.getElementById('depositAmount');
            amountInput.classList.remove('is-invalid');
            
            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount < 100000) {
                amountInput.classList.add('is-invalid');
                return;
            }
            
            const btn = document.getElementById('btnConfirmDeposit');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang nạp...';
            
            Wallet.deposit(currentUser.id, amount, 'client')
                .then(() => {
                    Utils.showToast(`Nạp tiền thành công! Đã nạp ${Utils.formatCurrency(amount)} vào ví.`, 'success');
                    depositForm.reset();
                    btn.disabled = false;
                    btn.innerHTML = 'Xác nhận nạp tiền';
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('depositModal'));
                    if (modal) modal.hide();
                    
                    updateWalletUI();
                })
                .catch(err => {
                    console.error(err);
                    Utils.showToast("Lỗi nạp tiền ví: " + err.message, "error");
                    btn.disabled = false;
                    btn.innerHTML = 'Xác nhận nạp tiền';
                });
        });
    }

    // Revision Form Submission
    const revisionForm = document.getElementById('revisionForm');
    if (revisionForm) {
        revisionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemId = document.getElementById('revisionItemId').value;
            const itemType = document.getElementById('revisionItemType').value;
            const instructionsInput = document.getElementById('revisionInstructions');
            
            instructionsInput.classList.remove('is-invalid');
            if (!instructionsInput.value.trim()) {
                instructionsInput.classList.add('is-invalid');
                return;
            }
            
            const btn = document.getElementById('btnConfirmRevision');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';
            
            const payload = {
                status: 'revision_requested',
                revisionInstructions: instructionsInput.value.trim()
            };
            
            const endpoint = itemType === 'request' ? `/requests/${itemId}` : `/jobs/${itemId}`;
            
            api.put(endpoint, payload)
                .then(() => {
                    Utils.showToast('Đã gửi yêu cầu sửa đổi sản phẩm thành công!', 'success');
                    revisionForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('revisionModal')).hide();
                    if (itemType === 'request') {
                        loadServiceRequests();
                    } else {
                        loadMyProjects();
                    }
                })
                .catch(err => {
                    console.error("Error submitting revision:", err);
                    Utils.showToast("Có lỗi xảy ra: " + err.message, 'error');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi yêu cầu sửa đổi';
                });
        });
    }

    // Bind event for revision request button
    $(document).on('click', '.btn-request-revision', function() {
        const itemId = $(this).data('id');
        const itemType = $(this).data('type');
        
        $('#revisionItemId').val(itemId);
        $('#revisionItemType').val(itemType);
        $('#revisionInstructions').val('');
        
        const modal = new bootstrap.Modal(document.getElementById('revisionModal'));
        modal.show();
    });

    // Tải dữ liệu ban đầu
    loadMyProjects();
    loadCompletedProjects();
    loadServiceRequests();
    updateWalletUI();
    renderClientCharts();

    // Khởi tạo Notification Center
    if (currentUser) {
        if (Utils.notifications.getUnreadCount(currentUser.id) === 0) {
            Utils.notifications.add(currentUser.id, 'Chào mừng bạn đến với Client Dashboard!', 'info');
            Utils.notifications.add(currentUser.id, 'Hãy đăng dự án đầu tiên để tìm Freelancer phù hợp.', 'success', 'register.html');
        }
        Utils.notifications.renderDropdown(currentUser.id);
        Utils.notifications.updateBadge(currentUser.id);
        window.addEventListener('notificationUpdate', (e) => {
            if (String(e.detail.userId) === String(currentUser.id)) {
                Utils.notifications.renderDropdown(currentUser.id);
                Utils.notifications.updateBadge(currentUser.id);
            }
        });
    }
});

function renderClientCharts() {
    const myJobs = window.__clientJobs || [];
    const myRequests = window.__clientRequests || [];

    // Destroy old charts if they exist
    try {
        ['clientChartSpending', 'clientChartStatus'].forEach(function(id) {
            var canvas = document.getElementById(id);
            if (canvas) {
                var existing = Chart.getChart(canvas);
                if (existing) existing.destroy();
            }
        });
    } catch (e) {
        console.warn('Lỗi khi hủy biểu đồ cũ:', e);
    }

    // Bar Chart — Spending & Activity
    const spendEl = document.getElementById('clientChartSpending');
    if (spendEl) {
        const activeJobs = myJobs.filter(j => j.status === 'in-progress' || j.status === 'delivered' || j.status === 'revision_requested' || j.status === 'disputed').length;
        const completedJobs = myJobs.filter(j => j.status === 'completed').length;
        const pendingJobs = myJobs.filter(j => j.status === 'pending' || j.status === 'approved').length;
        const activeReqs = myRequests.filter(r => r.status === 'accepted' || r.status === 'delivered' || r.status === 'revision_requested' || r.status === 'disputed').length;
        const completedReqs = myRequests.filter(r => r.status === 'completed').length;
        const pendingReqs = myRequests.filter(r => r.status === 'pending').length;

        const ctx = spendEl.getContext('2d');
        const gradProject = ctx.createLinearGradient(0, 0, 0, 200);
        gradProject.addColorStop(0, '#6366f1');
        gradProject.addColorStop(1, 'rgba(99, 102, 241, 0.4)');

        const gradService = ctx.createLinearGradient(0, 0, 0, 200);
        gradService.addColorStop(0, '#3b82f6');
        gradService.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

        new Chart(spendEl, {
            type: 'bar',
            data: {
                labels: ['Đang làm', 'Hoàn thành', 'Chờ duyệt'],
                datasets: [
                    { label: 'Dự Án', data: [activeJobs, completedJobs, pendingJobs], backgroundColor: gradProject, borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6 },
                    { label: 'Dịch Vụ', data: [activeReqs, completedReqs, pendingReqs], backgroundColor: gradService, borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 6 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' } } } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
            }
        });
    }

    // Doughnut Chart — Project Status
    const statusEl = document.getElementById('clientChartStatus');
    if (statusEl) {
        const totalJobs = myJobs.length;
        const totalReqs = myRequests.length;

        const ctx = statusEl.getContext('2d');
        const gradProjectDoughnut = ctx.createLinearGradient(0, 0, 0, 200);
        gradProjectDoughnut.addColorStop(0, '#6366f1');
        gradProjectDoughnut.addColorStop(1, '#4f46e5');

        const gradServiceDoughnut = ctx.createLinearGradient(0, 0, 0, 200);
        gradServiceDoughnut.addColorStop(0, '#3b82f6');
        gradServiceDoughnut.addColorStop(1, '#1d4ed8');

        new Chart(statusEl, {
            type: 'doughnut',
            data: {
                labels: ['Dự Án', 'Dịch Vụ'],
                datasets: [{
                    data: [totalJobs, totalReqs],
                    backgroundColor: [gradProjectDoughnut, gradServiceDoughnut],
                    borderWidth: 3, borderColor: '#ffffff', hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11, family: 'Inter' } } } }
            }
        });
    }
}
