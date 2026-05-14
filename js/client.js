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

            const newProject = {
                clientId: currentUser.id,
                title: document.getElementById('projectTitle').value.trim(),
                description: document.getElementById('projectDesc').value.trim(),
                budget: document.getElementById('projectBudget').value,
                requiredSkills: document.getElementById('projectSkills').value.trim(),
                status: 'open'
            };

            // Dùng Vanilla JS Fetch
            api.post('/projects', newProject)
                .then(project => {
                    alert('Đăng dự án thành công!');
                    postProjectForm.reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('postProjectModal'));
                    modal.hide();
                    loadMyProjects(); // Reload list
                })
                .catch(err => {
                    console.error('Lỗi khi đăng dự án:', err);
                    alert('Đã xảy ra lỗi khi đăng dự án.');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Đăng Dự Án';
                });
        });
    }

    // 2. Hiển thị danh sách dự án (Task 1)
    function loadMyProjects() {
        api.get('/projects')
            .then(projects => {
                // Lọc dự án của client hiện tại
                clientProjects = projects.filter(p => p.clientId === currentUser.id);
                renderProjects(clientProjects);
            })
            .catch(err => console.error('Lỗi tải dự án:', err));
    }

    function renderProjects(projects) {
        const tbody = document.getElementById('clientProjectsTableBody');
        tbody.innerHTML = '';

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Bạn chưa đăng dự án nào.</td></tr>';
            return;
        }

        projects.forEach(p => {
            let statusBadge = '';
            if (p.status === 'open') statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Open</span>';
            else if (p.status === 'in-progress') statusBadge = '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">In-Progress</span>';
            else statusBadge = '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">Completed</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-medium text-muted">#${p.id}</td>
                <td class="fw-semibold">${p.title}</td>
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
            api.get(`/projects`)
        ]).then(([allBids, allUsers, allProjects]) => {
            const projectBids = allBids.filter(b => String(b.projectId) === String(projectId));
            const project = allProjects.find(p => String(p.id) === String(projectId));

            tbody.innerHTML = '';
            
            if (projectBids.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Chưa có ai chào giá cho dự án <b>${project ? project.title : ''}</b>.</td></tr>`;
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
                if (bid.status === 'pending' && project && project.status === 'open') {
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

    // Task 3: Client Managing Bids - YÊU CẦU DÙNG jQuery
    // Sử dụng Event Delegation của jQuery cho nút Accept
    $(document).on('click', '.btn-accept-bid', function() {
        const $btn = $(this);
        const bidId = $btn.data('bid-id');
        const projectId = $btn.data('project-id');
        
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        // YÊU CẦU: Dùng $.ajax (PUT) để cập nhật Bid
        $.ajax({
            url: api.getUrl(`/bids/${bidId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'accepted' }),
            success: function() {
                // Tiếp tục dùng $.ajax cập nhật Project
                $.ajax({
                    url: api.getUrl(`/projects/${projectId}`),
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: 'in-progress' }),
                    success: function() {
                        // 1. Thay đổi UI của nút Accept thành badge
                        $btn.parent('.action-cell').html('<span class="badge bg-success">Đã nhận</span>');
                        
                        // 2. YÊU CẦU: Dùng jQuery .fadeOut() để ẩn các bid khác
                        $(`.bid-row-${projectId}`).not(`#bid-row-${bidId}`).fadeOut(500, function() {
                            $(this).remove(); // Xóa khỏi DOM sau khi fadeOut
                        });

                        // Cập nhật lại UI bảng Project
                        loadMyProjects();
                    },
                    error: function(err) {
                        alert('Lỗi khi cập nhật Project status!');
                        $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Nhận');
                    }
                });
            },
            error: function(err) {
                alert('Lỗi khi chấp nhận Bid!');
                $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Nhận');
            }
        });
    });

    // Tải dữ liệu ban đầu
    loadMyProjects();
});
