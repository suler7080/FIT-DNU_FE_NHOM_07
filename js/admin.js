/**
 * ADMIN.JS - Logic cho trang quản trị viên (admin.html)
 * BẮT BUỘC SỬ DỤNG JQUERY THEO YÊU CẦU ĐỀ BÀI
 */

$(document).ready(function() {
    
    // Kiểm tra quyền Admin (Route Protection mô phỏng bằng Front-end)
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
        alert("Bạn không có quyền truy cập trang này. Đang chuyển hướng đến trang đăng nhập...");
        window.location.href = 'login.html';
        return;
    }

    // Hiển thị thông tin Admin lên sidebar (Task: Sidebar Redesign)
    const adminUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    if (adminUser) {
        const initial = adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A';
        $('#sidebarAdminInitial').text(initial);
        $('#sidebarAdminName').text(adminUser.name || 'Admin');
    }

    // Cache dữ liệu để Search Client-side (Task: Real-time Search)
    let cachedServices = [];
    let cachedProjects = [];
    let cachedRequests = [];
    let cachedFreelancers = [];
    let cachedCategories = [];
    let cachedReviews = [];
    let cachedTickets = [];
    let cachedAllUsers = []; // Để map tên người dùng trong review/ticket
    
    // Hàm tải danh sách dịch vụ chờ duyệt
    function loadAdminServices() {
        api.get('/services')
            .then(data => {
                cachedServices = data; // Lưu cache
                // Lọc các dịch vụ đang chờ duyệt (pending)
                const pendingServices = data.filter(s => s.status === 'pending');
                renderTable(pendingServices);
            })
            .catch(err => {
                console.warn('API không khả dụng, load mock data cho admin', err);
                const mockServices = [
                    { id: '1', title: 'Thiết kế Web E-commerce', freelancerId: '777', price: '5000000', status: 'pending' },
                    { id: '2', title: 'Viết bài chuẩn SEO', freelancerId: '888', price: '300000', status: 'pending' }
                ];
                cachedServices = mockServices;
                renderTable(mockServices);
            });
    }

    // jQuery: Render bảng và thêm hiệu ứng
    function renderTable(services) {
        const $tbody = $('#servicesTableBody'); // jQuery selector
        $tbody.empty(); // jQuery DOM manipulation

        if (services.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted">Không có dịch vụ nào đang chờ duyệt</td></tr>');
            return;
        }

        services.forEach(srv => {
            const price = parseFloat(srv.price) || 0;
            // Xây dựng tr ẩn đi ban đầu để dùng hiệu ứng fadeIn
            const trHTML = `
                <tr id="srv-row-${srv.id}" style="display: none;">
                    <td class="fw-medium">#${srv.id}</td>
                    <td class="fw-bold text-primary">${srv.title}</td>
                    <td>${srv.freelancerId || 'N/A'}</td>
                    <td>${price.toLocaleString('vi-VN')} VNĐ</td>
                    <td><span class="badge bg-warning status-badge text-dark border border-warning">Đang chờ</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-success btn-approve" data-id="${srv.id}">
                            <i class="bi bi-check2"></i> Duyệt
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-reject" data-id="${srv.id}">
                            <i class="bi bi-x"></i> Từ chối
                        </button>
                    </td>
                </tr>
            `;
            
            const $tr = $(trHTML);
            $tbody.append($tr); // jQuery manipulation
            
            // Yêu cầu: Hiệu ứng jQuery (fadeIn)
            $tr.fadeIn(400); 
        });
    }

    // Load dữ liệu lần đầu
    loadAdminServices();
    loadDashboardStats();
    loadCategories();
    loadAdminReviews();
    loadAdminTickets();
    updateSidebarBadges();

    /**
     * CẬP NHẬT BADGE TRÊN SIDEBAR (Task: Pending Badges)
     */
    function updateSidebarBadges() {
        Promise.all([
            api.get('/services'),
            api.get('/jobs'),
            api.get('/tickets')
        ]).then(([services, jobs, tickets]) => {
            const pendingServices = services.filter(s => s.status === 'pending').length;
            const pendingJobs = jobs.filter(j => j.status === 'pending').length;
            const openTickets = (tickets || []).filter(t => t.status === 'open').length;

            const setBadge = (id, count) => {
                const $el = $('#' + id);
                if (count > 0) {
                    $el.text(count > 99 ? '99+' : count).show();
                } else {
                    $el.hide();
                }
            };

            setBadge('badge-services', pendingServices);
            setBadge('badge-projects', pendingJobs);
            setBadge('badge-tickets', openTickets);
        }).catch(err => console.warn("Lỗi cập nhật badge sidebar", err));
    }

    // ==========================================
    // TASK 1: ADMIN ANALYTICS DASHBOARD (Redesigned)
    // ==========================================
    function loadDashboardStats() {
        Promise.all([
            api.get('/users'),
            api.get('/jobs'),
            api.get('/requests')
        ]).then(([users, projects, requests]) => {
            const totalUsers = users.length;
            const activeFreelancers = users.filter(u => u.role === 'freelancer').length;
            const openProjects = projects.filter(p => p.status !== 'rejected' && p.status !== 'completed').length;
            const newRequests = requests.filter(r => r.status === 'pending').length;

            // Inject numbers (Task: Redesign Stat Cards)
            $('#stat-total-users').text(totalUsers.toLocaleString());
            $('#stat-active-freelancers').text(activeFreelancers.toLocaleString());
            $('#stat-open-projects').text(openProjects.toLocaleString());
            $('#stat-new-requests').text(newRequests.toLocaleString());

            // Render Charts (Task: Redesign Charts)
            renderDashboardCharts(projects, users);

        }).catch(err => {
            console.error("Lỗi khi tải thống kê Dashboard:", err);
        });
    }

    /**
     * RENDER DASHBOARD CHARTS (TASK: Redesign Charts)
     */
    function renderDashboardCharts(jobs, users) {
        // Hủy biểu đồ cũ nếu tồn tại (tránh lỗi Canvas is already in use)
        ['chartProjectStatus', 'chartUserRoles'].forEach(id => {
            const existing = Chart.getChart(id);
            if (existing) existing.destroy();
        });

        // 1. Bar Chart — Tình trạng Dự Án
        const statusLabels = ['Chờ duyệt', 'Đã duyệt', 'Đang làm', 'Hoàn tất', 'Từ chối'];
        const statusKeys = ['pending', 'approved', 'in-progress', 'completed', 'rejected'];
        const statusColors = ['#F59E0B', '#0D9488', '#3B82F6', '#10B981', '#EF4444'];
        const statusCounts = statusKeys.map(s => jobs.filter(j => j.status === s).length);

        const ctxStatus = document.getElementById('chartProjectStatus');
        if (ctxStatus) {
            new Chart(ctxStatus, {
                type: 'bar',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusCounts,
                        backgroundColor: statusColors.map(c => c + '22'),
                        borderColor: statusColors,
                        borderWidth: 2,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            ticks: { stepSize: 1 },
                            grid: { color: '#F1F5F9' } 
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Doughnut Chart — Cơ cấu Người Dùng
        const clients = users.filter(u => u.role === 'client').length;
        const freelancers = users.filter(u => u.role === 'freelancer').length;
        const admins = users.filter(u => u.role === 'admin').length;

        const ctxRoles = document.getElementById('chartUserRoles');
        if (ctxRoles) {
            new Chart(ctxRoles, {
                type: 'doughnut',
                data: {
                    labels: ['Khách hàng', 'Freelancer', 'Admin'],
                    datasets: [{
                        data: [clients, freelancers, admins],
                        backgroundColor: ['#3B82F6', '#0D9488', '#F59E0B'],
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
                    }
                }
            });
        }
    }

    // jQuery event 1: Nút làm mới dữ liệu
    $('#btnRefresh').on('click', function() {
        const $btn = $(this);
        $btn.prop('disabled', true).text('Đang tải...');
        
        // Tạo hiệu ứng mờ bảng đi (jQuery Effect)
        $('#servicesTableBody').fadeOut(300, function() {
            loadAdminServices();
            $btn.prop('disabled', false).text('Làm mới dữ liệu');
            $(this).show(); // Đảm bảo tbody hiện lại để tr bên trong có thể fadeIn
        });
    });

    // jQuery event 2: Nút Duyệt dịch vụ (Sử dụng $.ajax DUY NHẤT 1 LẦN CỤ THỂ theo đề bài)
    $(document).on('click', '.btn-approve', function() {
        const srvId = $(this).data('id');
        const $row = $(`#srv-row-${srvId}`);
        const $btn = $(this);

        // Đổi trạng thái UI tạm thời
        $btn.prop('disabled', true).text('...');

        // CRUCIAL YÊU CẦU: Dùng chính xác $.ajax() (PUT)
        $.ajax({
            url: api.getUrl(`/services/${srvId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'approved' }),
            success: function(response) {
                // UI EFFECT: Loại bỏ row mượt mà với fadeOut
                $row.fadeOut(400, function() {
                    $(this).remove();
                    if ($('#servicesTableBody tr').length === 0) {
                        $('#servicesTableBody').append('<tr style="display:none;"><td colspan="6" class="text-center text-muted">Không có dịch vụ nào đang chờ duyệt</td></tr>').find('tr').fadeIn();
                    }
                    updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
                });
            },
            error: function(err) {
                console.error("Lỗi AJAX:", err);
                alert("Lỗi khi duyệt dịch vụ!");
                $btn.prop('disabled', false).html('<i class="bi bi-check2"></i> Duyệt');
            }
        });
    });

    // jQuery event 3: Nút Từ chối dịch vụ (Hiệu ứng jQuery slideUp)
    $(document).on('click', '.btn-reject', function() {
        const srvId = $(this).data('id');
        const $row = $(`#srv-row-${srvId}`);
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn từ chối dịch vụ này?")) {
            $btn.prop('disabled', true).text('...');

            $.ajax({
                url: api.getUrl(`/services/${srvId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'rejected' }),
                success: function(response) {
                    // UI EFFECT: Loại bỏ row mượt mà với slideUp
                    $row.slideUp(400, function() {
                        $(this).remove();
                        if ($('#servicesTableBody tr').length === 0) {
                            $('#servicesTableBody').append('<tr style="display:none;"><td colspan="6" class="text-center text-muted">Không có dịch vụ nào đang chờ duyệt</td></tr>').find('tr').fadeIn();
                        }
                        updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
                    });
                },
                error: function(err) {
                    alert("Lỗi khi từ chối dịch vụ!");
                    $btn.prop('disabled', false).html('<i class="bi bi-x"></i> Từ chối');
                }
            });
        }
    });

    // ==========================================
    // DUYỆT DỰ ÁN KHÁCH HÀNG (Task 3)
    // ==========================================
    function loadAdminProjects() {
        // Lấy từ /jobs (theo luồng mới đã thống nhất)
        api.get('/jobs')
            .then(jobs => {
                cachedProjects = jobs; // Lưu cache
                const pendingProjects = jobs.filter(j => j.status === 'pending');
                renderProjectsTable(pendingProjects);
            })
            .catch(err => {
                console.error("Lỗi tải dự án:", err);
                $('#projectsTableBody').html('<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
            });
    }

    function renderProjectsTable(projects) {
        const $tbody = $('#projectsTableBody');
        $tbody.empty();

        if (projects.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted">Không có dự án nào đang chờ duyệt</td></tr>');
            return;
        }

        projects.forEach(p => {
            const trHTML = `
                <tr id="project-row-${p.id}" style="display: none;">
                    <td class="fw-medium">#${p.id}</td>
                    <td class="fw-bold">${p.clientName || 'Ẩn danh'}</td>
                    <td>${p.title}</td>
                    <td class="text-success fw-bold">${parseFloat(p.budget).toLocaleString()} VNĐ</td>
                    <td><span class="badge bg-light text-dark border">${p.category}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-success btn-approve-project" data-id="${p.id}">
                            <i class="bi bi-check-lg"></i> Duyệt
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-reject-project" data-id="${p.id}">
                            <i class="bi bi-x-lg"></i> Từ chối
                        </button>
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(400);
        });
    }

    // Load khi mở trang
    loadAdminProjects();

    // Nút Refresh
    $('#btnRefreshProjects').on('click', function() {
        loadAdminProjects();
    });

    // jQuery AJAX: Duyệt Dự Án (Approved)
    $(document).on('click', '.btn-approve-project', function() {
        const projectId = $(this).data('id');
        const $row = $(`#project-row-${projectId}`);
        const $btn = $(this);

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/jobs/${projectId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'approved' }),
            success: function() {
                // UI EFFECT: FadeOut mượt mà sau khi thành công
                $row.fadeOut(600, function() {
                    $(this).remove();
                    if ($('#projectsTableBody tr').length === 0) {
                        $('#projectsTableBody').append('<tr><td colspan="6" class="text-center text-muted">Hết dự án cần duyệt</td></tr>');
                    }
                    updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
                });
            },
            error: function() {
                alert("Có lỗi xảy ra khi duyệt dự án.");
                $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Duyệt');
            }
        });
    });

    // jQuery AJAX: Từ chối Dự Án (Rejected)
    $(document).on('click', '.btn-reject-project', function() {
        const projectId = $(this).data('id');
        const $row = $(`#project-row-${projectId}`);
        
        if (confirm("Bạn có chắc chắn muốn từ chối dự án này?")) {
            $.ajax({
                url: api.getUrl(`/jobs/${projectId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'rejected' }),
                success: function() {
                    $row.fadeOut(600, function() {
                        $(this).remove();
                        if ($('#projectsTableBody tr').length === 0) {
                            $('#projectsTableBody').append('<tr><td colspan="6" class="text-center text-muted">Hết dự án cần duyệt</td></tr>');
                        }
                        updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
                    });
                }
            });
        }
    });

    // ==========================================
    // QUẢN LÝ YÊU CẦU THUÊ DỊCH VỤ (Task: Admin see requests)
    // ==========================================
    function loadAdminRequests() {
        Promise.all([
            api.get('/requests'),
            api.get('/services')
        ]).then(([requests, services]) => {
            cachedRequests = requests; // Lưu cache
            cachedServices = services; // Update cache
            renderRequestsTable(requests, services);
        }).catch(err => {
            console.error("Lỗi tải yêu cầu:", err);
            $('#requestsTableBody').html('<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        });
    }

    function renderRequestsTable(requests, services) {
        const $tbody = $('#requestsTableBody');
        $tbody.empty();

        if (requests.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted">Không có yêu cầu thuê nào</td></tr>');
            return;
        }

        requests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(req => {
            const service = services.find(s => String(s.id) === String(req.serviceId));
            const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;
            
            let statusBadge = '';
            if (req.status === 'pending') statusBadge = '<span class="badge bg-warning text-dark border border-warning">Chờ Freelancer</span>';
            else if (req.status === 'accepted') statusBadge = '<span class="badge bg-success border border-success">Đã nhận</span>';
            else if (req.status === 'rejected') statusBadge = '<span class="badge bg-danger border border-danger">Từ chối</span>';

            const trHTML = `
                <tr id="req-row-${req.id}" style="display: none;">
                    <td class="fw-medium">#${req.id}</td>
                    <td class="fw-bold">${req.clientName || 'Ẩn danh'}</td>
                    <td>${serviceTitle}</td>
                    <td class="text-primary fw-bold">${parseFloat(req.proposedBudget || 0).toLocaleString()} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger btn-delete-request" data-id="${req.id}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(400);
        });
    }

    loadAdminRequests();

    $('#btnRefreshRequests').on('click', function() {
        loadAdminRequests();
    });

    $(document).on('click', '.btn-delete-request', function() {
        const reqId = $(this).data('id');
        const $row = $(`#req-row-${reqId}`);
        if (confirm("Xóa yêu cầu này khỏi hệ thống?")) {
            $.ajax({
                url: api.getUrl(`/requests/${reqId}`),
                method: 'DELETE',
                success: function() {
                    $row.fadeOut(400, function() { $(this).remove(); });
                }
            });
        }
    });

    // ==========================================
    // QUẢN LÝ FREELANCERS (Task 2)
    // ==========================================
    
    function loadAdminFreelancers() {
        const filter = $('#userRoleFilter').val() || 'freelancer';
        api.get('/users')
            .then(users => {
                cachedAllUsers = users; // Cache all users for name mapping
                cachedFreelancers = users; // Cache for the users tab
                
                let filtered = users;
                if (filter !== 'all') {
                    filtered = users.filter(u => u.role === filter);
                } else {
                    // All except admin
                    filtered = users.filter(u => u.role !== 'admin');
                }
                renderFreelancersTable(filtered);
            })
            .catch(err => {
                console.error("Lỗi tải users:", err);
                $('#freelancersTableBody').html('<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
            });
    }

    function renderFreelancersTable(users) {
        const $tbody = $('#freelancersTableBody');
        $tbody.empty();

        if (users.length === 0) {
            $tbody.append('<tr><td colspan="5" class="text-center text-muted">Không có người dùng nào trong hệ thống</td></tr>');
            return;
        }

        users.forEach(f => {
            const isBanned = f.status === 'banned';
            const statusBadge = isBanned 
                ? '<span class="badge bg-danger ms-2">Đã khóa</span>' 
                : '<span class="badge bg-success ms-2">Hoạt động</span>';
            
            const actionBtn = isBanned
                ? `<button class="btn btn-sm btn-success btn-unban-user" data-id="${f.id}"><i class="bi bi-unlock"></i> Mở khóa</button>`
                : `<button class="btn btn-sm btn-outline-danger btn-ban-user" data-id="${f.id}"><i class="bi bi-slash-circle"></i> Khóa TK</button>`;

            const trHTML = `
                <tr id="fl-row-${f.id}" style="display: none;">
                    <td class="fw-medium">#${f.id}</td>
                    <td>
                        <div class="fw-bold">${f.name} ${statusBadge}</div>
                        <div class="small text-muted">${f.email}</div>
                    </td>
                    <td>${f.email}</td>
                    <td><span class="badge bg-info text-dark border border-info">${f.role}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-view-freelancer me-1" data-id="${f.id}"><i class="bi bi-eye"></i> Xem</button>
                        ${actionBtn}
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(400); // Hiệu ứng jQuery
        });
    }

    // Load dữ liệu tab freelancers
    loadAdminFreelancers();

    // Nút refresh freelancers
    $('#btnRefreshFreelancers').on('click', function() {
        loadAdminFreelancers();
    });

    // Lọc theo role
    $('#userRoleFilter').on('change', function() {
        loadAdminFreelancers();
    });

    // Sự kiện Khóa/Mở khóa tài khoản (Task: Ban/Unban)
    $(document).on('click', '.btn-ban-user', function() {
        const id = $(this).data('id');
        if (confirm('Khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống.')) {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
            
            $.ajax({
                url: api.getUrl(`/users/${id}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'banned' }),
                success: () => {
                    loadAdminFreelancers();
                    showAdminToast('Đã khóa tài khoản thành công!', 'bg-warning');
                },
                error: () => {
                    alert('Lỗi khi khóa tài khoản.');
                    $btn.prop('disabled', false).html('<i class="bi bi-slash-circle"></i> Khóa TK');
                }
            });
        }
    });

    $(document).on('click', '.btn-unban-user', function() {
        const id = $(this).data('id');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/users/${id}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'active' }),
            success: () => {
                loadAdminFreelancers();
                showAdminToast('Đã mở khóa tài khoản thành công!', 'bg-success');
            },
            error: () => {
                alert('Lỗi khi mở khóa tài khoản.');
                $btn.prop('disabled', false).html('<i class="bi bi-unlock"></i> Mở khóa');
            }
        });
    });

    // jQuery event: Nút Xóa Freelancer (Dùng $.ajax DELETE)
    $(document).on('click', '.btn-delete-freelancer', function() {
        const flId = $(this).data('id');
        const $row = $(`#fl-row-${flId}`);
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn xóa Freelancer này khỏi hệ thống?")) {
            $btn.prop('disabled', true).text('...');

            $.ajax({
                url: api.getUrl(`/users/${flId}`),
                method: 'DELETE',
                success: function() {
                    // UI EFFECT: Loại bỏ row mượt mà với fadeOut
                    $row.fadeOut(400, function() {
                        $(this).remove();
                        if ($('#freelancersTableBody tr').length === 0) {
                            $('#freelancersTableBody').append('<tr style="display:none;"><td colspan="5" class="text-center text-muted">Không có Freelancer nào trong hệ thống</td></tr>').find('tr').fadeIn();
                        }
                    });
                },
                error: function(err) {
                    console.error("Lỗi xóa freelancer:", err);
                    alert("Lỗi khi xóa Freelancer!");
                    $btn.prop('disabled', false).html('<i class="bi bi-trash"></i> Xóa/Ban');
                }
            });
        }
    });

    // ==========================================
    // TASK 2: DYNAMIC CATEGORY MANAGEMENT (CRUD)
    // ==========================================
    function loadCategories() {
        api.get('/categories')
            .then(categories => {
                cachedCategories = categories; // Lưu cache
                renderCategoriesTable(categories);
            })
            .catch(err => {
                console.warn("Chưa có endpoint /categories, tạo dữ liệu mẫu", err);
                const mockCats = [
                    { id: '1', name: 'Web Development' },
                    { id: '2', name: 'Graphic Design' }
                ];
                cachedCategories = mockCats;
                renderCategoriesTable(mockCats);
            });
    }

    function renderCategoriesTable(categories) {
        const $tbody = $('#categoriesTableBody');
        $tbody.empty();

        if (categories.length === 0) {
            $tbody.append('<tr><td colspan="3" class="text-center text-muted">Chưa có danh mục nào</td></tr>');
            return;
        }

        categories.forEach(cat => {
            const trHTML = `
                <tr id="cat-row-${cat.id}" style="display: none;">
                    <td class="fw-medium">#${cat.id}</td>
                    <td class="fw-bold">${cat.name}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-edit-category" data-id="${cat.id}" data-name="${cat.name}">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-category" data-id="${cat.id}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(300);
        });
    }

    // Mở modal thêm mới
    $('#btnAddCategory').on('click', function() {
        $('#categoryModalLabel').text('Thêm Danh Mục Mới');
        $('#categoryId').val('');
        $('#categoryName').val('');
    });

    // Mở modal sửa
    $(document).on('click', '.btn-edit-category', function() {
        const id = $(this).data('id');
        const name = $(this).data('name');
        
        $('#categoryModalLabel').text('Chỉnh Sửa Danh Mục');
        $('#categoryId').val(id);
        $('#categoryName').val(name);
        $('#categoryModal').modal('show');
    });

    // Xử lý Lưu (Add/Edit) dùng jQuery $.ajax
    $('#categoryForm').on('submit', function(e) {
        e.preventDefault();
        const id = $('#categoryId').val();
        const name = $('#categoryName').val();
        const isEdit = id !== '';

        const url = isEdit ? api.getUrl(`/categories/${id}`) : api.getUrl('/categories');
        const method = isEdit ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify({ name: name }),
            success: function() {
                $('#categoryModal').modal('hide');
                loadCategories(); // Tải lại danh sách
                // Nếu là thêm mới, có thể reset stats nếu cần (thực tế stats ko đổi ở đây)
            },
            error: function() {
                alert("Lỗi khi lưu danh mục!");
            }
        });
    });

    // Xóa danh mục dùng jQuery $.fadeOut
    $(document).on('click', '.btn-delete-category', function() {
        const id = $(this).data('id');
        const $row = $(`#cat-row-${id}`);

        if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            $.ajax({
                url: api.getUrl(`/categories/${id}`),
                method: 'DELETE',
                success: function() {
                    $row.fadeOut(500, function() {
                        $(this).remove();
                        if ($('#categoriesTableBody tr').length === 0) {
                            $('#categoriesTableBody').append('<tr><td colspan="3" class="text-center text-muted">Chưa có danh mục nào</td></tr>');
                        }
                    });
                }
            });
        }
    });

    // ==========================================
    // TASK 1-4: REVIEW MODERATION & RATING CORRECTION
    // ==========================================

    function loadAdminReviews() {
        $('#reviewsTableBody').html('<tr><td colspan="7" class="text-center text-muted">Đang tải...</td></tr>');
        
        Promise.all([
            api.get('/reviews'),
            api.get('/users')
        ]).then(([reviews, users]) => {
            cachedReviews = reviews; // Lưu cache
            cachedAllUsers = users; // Cache all for mapping
            renderReviewsTable(reviews, users);
        }).catch(err => {
            console.error("Lỗi tải reviews:", err);
            $('#reviewsTableBody').html('<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu đánh giá</td></tr>');
        });
    }

    function renderReviewsTable(reviews, users) {
        const $tbody = $('#reviewsTableBody');
        $tbody.empty();

        if (reviews.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center text-muted">Chưa có đánh giá nào trên hệ thống</td></tr>');
            return;
        }

        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(rev => {
            const stars = parseInt(rev.rating) || 0;
            const date = new Date(rev.createdAt).toLocaleDateString('vi-VN');
            
            // Map IDs to Names
            const client = users.find(u => String(u.id) === String(rev.clientId));
            const freelancer = users.find(u => String(u.id) === String(rev.freelancerId));
            
            const clientName = client ? client.name : `ID: ${rev.clientId}`;
            const freelancerName = freelancer ? freelancer.name : `ID: ${rev.freelancerId}`;

            const trHTML = `
                <tr id="rev-row-${rev.id}" style="display: none;">
                    <td class="fw-medium">#${rev.id}</td>
                    <td>
                        <div class="fw-bold text-dark">${clientName}</div>
                        <div class="small text-muted">ID: ${rev.clientId}</div>
                    </td>
                    <td>
                        <div class="fw-bold text-primary">${freelancerName}</div>
                        <div class="small text-muted">ID: ${rev.freelancerId}</div>
                    </td>
                    <td>
                        <span class="badge bg-warning text-dark border border-warning">
                            ${stars} <i class="bi bi-star-fill"></i>
                        </span>
                    </td>
                    <td class="small" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rev.comment}">
                        ${rev.comment}
                    </td>
                    <td>${date}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger btn-delete-review" data-id="${rev.id}" data-flid="${rev.freelancerId}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(300);
        });
    }

    // Refresh Reviews
    $('#btnRefreshReviews').on('click', function() {
        loadAdminReviews();
    });

    // Tải lại khi chuyển tab (Bootstrap 5 event)
    $('#reviews-tab').on('shown.bs.tab', function() {
        loadAdminReviews();
    });

    // Delete + Recalculate Rating (CRITICAL)
    $(document).on('click', '.btn-delete-review', function() {
        const revId = $(this).data('id');
        const flid = $(this).data('flid');
        const $row = $(`#rev-row-${revId}`);

        if (confirm("Bạn có chắc chắn muốn xóa đánh giá này? Hệ thống sẽ tự động tính toán lại điểm rating cho Freelancer.")) {
            // 1. DELETE Review
            $.ajax({
                url: api.getUrl(`/reviews/${revId}`),
                method: 'DELETE',
                success: function() {
                    // 2. FadeOut UI
                    $row.fadeOut(400, function() {
                        $(this).remove();
                        // 3. GET remaining reviews for this freelancer to recalculate
                        api.get(`/reviews?freelancerId=${flid}`)
                            .then(remainingReviews => {
                                // 4. Recalculate
                                let avg = 0;
                                if (remainingReviews.length > 0) {
                                    const totalStars = remainingReviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0);
                                    avg = totalStars / remainingReviews.length;
                                }
                                
                                // 5. PUT /users/:id { rating: avg }
                                return api.put(`/users/${flid}`, { rating: parseFloat(avg.toFixed(1)) });
                            })
                            .then(() => {
                                console.log(`Đã cập nhật rating mới cho Freelancer #${flid}`);
                                loadDashboardStats(); // Cập nhật lại stats nếu cần
                            })
                            .catch(err => {
                                // 6. If PUT fails: show Bootstrap toast warning
                                showAdminToast("Lỗi: Không thể cập nhật lại điểm Rating của Freelancer!", "bg-warning");
                                console.error("Lỗi cập nhật rating:", err);
                            });
                    });
                },
                error: function() {
                    showAdminToast("Lỗi: Không thể xóa đánh giá này!", "bg-danger");
                }
            });
        }
    });

    // ==========================================
    // QUẢN LÝ SUPPORT TICKETS (TASK: Support Tickets)
    // ==========================================

    function loadAdminTickets() {
        const filterStatus = $('#ticketStatusFilter').val();
        api.get('/tickets')
            .then(tickets => {
                cachedTickets = tickets; // Lưu cache
                
                // Filter logic
                const filtered = filterStatus ? tickets.filter(t => t.status === filterStatus) : tickets;
                
                // Update Sidebar Badge (Open count)
                const openCount = tickets.filter(t => t.status === 'open').length;
                if (openCount > 0) {
                    $('#ticketBadge').text(openCount).show();
                } else {
                    $('#ticketBadge').hide();
                }

                renderTicketsTable(filtered);
            })
            .catch(err => {
                console.error("Lỗi tải tickets:", err);
                $('#ticketsTableBody').html('<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu ticket</td></tr>');
            });
    }

    function renderTicketsTable(tickets) {
        const $tbody = $('#ticketsTableBody');
        $tbody.empty();

        if (tickets.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center text-muted p-4">Không có ticket nào trong hệ thống</td></tr>');
            return;
        }

        // Sort: Newest first
        tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(t => {
            const isOpen = t.status === 'open';
            const statusBadge = isOpen 
                ? '<span class="badge bg-warning text-dark border border-warning">Chưa xử lý</span>' 
                : '<span class="badge bg-success border border-success">Đã giải quyết</span>';
            
            const actionBtn = isOpen
                ? `<button class="btn btn-sm btn-success btn-resolve-ticket" data-id="${t.id}"><i class="bi bi-check-circle"></i> Đánh dấu xong</button>`
                : `<button class="btn btn-sm btn-outline-secondary btn-reopen-ticket" data-id="${t.id}"><i class="bi bi-arrow-counterclockwise"></i> Mở lại</button>`;

            const trHTML = `
                <tr id="ticket-row-${t.id}" style="display: none;">
                    <td class="fw-medium">#${t.id}</td>
                    <td class="fw-bold">${t.userName || 'Khách'}</td>
                    <td class="small text-muted">${t.userEmail || t.email || 'N/A'}</td>
                    <td class="fw-semibold">${t.subject}</td>
                    <td class="small" style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${t.description || t.message}">${t.description || t.message || 'N/A'}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">${actionBtn}</td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(300);
        });
    }

    // Sự kiện Tab
    $('#tickets-tab').on('shown.bs.tab', function() {
        loadAdminTickets();
    });

    $('#btnRefreshTickets').on('click', function() {
        loadAdminTickets();
    });

    $('#ticketStatusFilter').on('change', function() {
        loadAdminTickets();
    });

    // Thao tác với ticket
    $(document).on('click', '.btn-resolve-ticket', function() {
        const id = $(this).data('id');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/tickets/${id}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'resolved' }),
            success: () => {
                loadAdminTickets();
                updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
                showAdminToast('Ticket đã được giải quyết!', 'bg-success');
            },
            error: () => {
                alert('Lỗi khi cập nhật ticket.');
                $btn.prop('disabled', false).html('<i class="bi bi-check-circle"></i> Đánh dấu xong');
            }
        });
    });

    $(document).on('click', '.btn-reopen-ticket', function() {
        const id = $(this).data('id');
        $.ajax({
            url: api.getUrl(`/tickets/${id}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'open' }),
            success: () => {
                loadAdminTickets();
                updateSidebarBadges(); // Cập nhật badge (Task: Pending Badges)
            }
        });
    });

    // ==========================================
    // REAL-TIME CLIENT-SIDE SEARCH (TASK: Real-time Search)
    // ==========================================

    // 1. Search Services
    $('#searchServices').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filtered = cachedServices.filter(s => 
            s.title.toLowerCase().includes(q) || 
            String(s.freelancerId).includes(q) || 
            String(s.id).includes(q)
        );
        renderTable(filtered.filter(s => s.status === 'pending')); // Chỉ hiển thị pending như logic gốc
    });

    // 2. Search Projects
    $('#searchProjects').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filtered = cachedProjects.filter(p => 
            p.title.toLowerCase().includes(q) || 
            String(p.id).includes(q)
        );
        renderProjectsTable(filtered.filter(p => p.status === 'pending'));
    });

    // 3. Search Requests
    $('#searchRequests').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filtered = cachedRequests.filter(r => 
            String(r.id).includes(q) || 
            String(r.clientId).includes(q) || 
            String(r.serviceId).includes(q) ||
            r.status.toLowerCase().includes(q)
        );
        renderRequestsTable(filtered, cachedServices);
    });

    // 4. Search Freelancers/Users
    $('#searchFreelancers').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filter = $('#userRoleFilter').val() || 'freelancer';
        
        let baseUsers = cachedFreelancers;
        if (filter !== 'all') {
            baseUsers = cachedFreelancers.filter(u => u.role === filter);
        } else {
            baseUsers = cachedFreelancers.filter(u => u.role !== 'admin');
        }

        const filtered = baseUsers.filter(u => 
            u.name.toLowerCase().includes(q) || 
            u.email.toLowerCase().includes(q) || 
            String(u.id).includes(q)
        );
        renderFreelancersTable(filtered);
    });

    // 5. Search Categories
    $('#searchCategories').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filtered = cachedCategories.filter(c => 
            c.name.toLowerCase().includes(q) || 
            String(c.id).includes(q)
        );
        renderCategoriesTable(filtered);
    });

    // 6. Search Reviews
    $('#searchReviews').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filtered = cachedReviews.filter(r => 
            r.comment.toLowerCase().includes(q) || 
            String(r.clientId).includes(q) || 
            String(r.freelancerId).includes(q) ||
            String(r.id).includes(q)
        );
        renderReviewsTable(filtered, cachedAllUsers);
    });

    // 7. Search Tickets
    $('#searchTickets').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        const filterStatus = $('#ticketStatusFilter').val();
        
        let baseTickets = cachedTickets;
        if (filterStatus) {
            baseTickets = cachedTickets.filter(t => t.status === filterStatus);
        }

        const filtered = baseTickets.filter(t => 
            t.subject.toLowerCase().includes(q) || 
            (t.userName && t.userName.toLowerCase().includes(q)) || 
            (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
            (t.email && t.email.toLowerCase().includes(q)) ||
            String(t.id).includes(q)
        );
        renderTicketsTable(filtered);
    });

    // Sự kiện Xem Hồ Sơ Freelancer (Task: Freelancer Profile Modal)
    $(document).on('click', '.btn-view-freelancer', function() {
        const id = $(this).data('id');
        $('#adminFreelancerModal').modal('show');
        
        // Reset body to loading spinner
        $('#flModalBody').html(`
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>
        `);

        Promise.all([
            api.get(`/users/${id}`),
            api.get('/services'),
            api.get('/reviews')
        ]).then(([user, services, reviews]) => {
            const myServices = services.filter(s => String(s.freelancerId) === String(id));
            const myReviews = reviews.filter(r => String(r.freelancerId) === String(id));
            const avgRating = myReviews.length
                ? (myReviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / myReviews.length).toFixed(1)
                : 'Chưa có';

            const statusBadge = user.status === 'banned'
                ? '<span class="badge bg-danger ms-2">Đã khóa</span>'
                : '<span class="badge bg-success ms-2">Hoạt động</span>';

            $('#flModalTitle').html(`Hồ sơ ${user.role === 'freelancer' ? 'Freelancer' : 'Khách hàng'} ${statusBadge}`);

            // Render reviews (max 3)
            const reviewsHtml = myReviews.length > 0
                ? myReviews.slice(0, 3).map(r => `
                    <div class="card mb-2 border-0 bg-light">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span class="fw-bold small">${r.clientName || 'Khách hàng'}</span>
                                <span class="text-warning small">${'★'.repeat(parseInt(r.rating) || 0)}</span>
                            </div>
                            <p class="mb-0 small text-muted fst-italic">"${r.comment || 'Không có nhận xét'}"</p>
                        </div>
                    </div>
                `).join('')
                : '<p class="text-muted small">Chưa có đánh giá nào.</p>';

            $('#flModalBody').html(`
                <div class="row align-items-center mb-4">
                    <div class="col-auto">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 80px; height: 80px; font-size: 32px;">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div class="col">
                        <h4 class="fw-bold mb-1">${user.name}</h4>
                        <p class="text-muted mb-0"><i class="bi bi-envelope me-1"></i>${user.email}</p>
                        <p class="text-muted mb-0"><i class="bi bi-person-badge me-1"></i>Vai trò: <span class="text-primary fw-semibold">${user.role}</span></p>
                    </div>
                </div>

                <div class="row g-3 mb-4 text-center">
                    <div class="col-4">
                        <div class="p-3 border rounded-3 bg-white shadow-sm">
                            <div class="h4 fw-bold text-warning mb-0">${avgRating}</div>
                            <div class="small text-muted">Đánh giá</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 border rounded-3 bg-white shadow-sm">
                            <div class="h4 fw-bold text-primary mb-0">${myServices.length}</div>
                            <div class="small text-muted">Dịch vụ</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 border rounded-3 bg-white shadow-sm">
                            <div class="h4 fw-bold text-success mb-0">${myReviews.length}</div>
                            <div class="small text-muted">Tổng Review</div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h6 class="fw-bold mb-2">Kỹ năng / Giới thiệu</h6>
                    <div class="p-3 bg-light rounded-3 small">
                        ${user.skills || user.bio || 'Người dùng chưa cập nhật thông tin giới thiệu.'}
                    </div>
                </div>

                <div>
                    <h6 class="fw-bold mb-2">Đánh giá gần đây</h6>
                    ${reviewsHtml}
                </div>
            `);
        }).catch(err => {
            console.error("Lỗi tải hồ sơ:", err);
            $('#flModalBody').html('<p class="text-center text-danger py-5">Không thể tải thông tin hồ sơ.</p>');
        });
    });

    // Helper: Show Admin Toast
    function showAdminToast(message, bgColor = "bg-danger") {
        const $toast = $('#adminToast');
        $toast.removeClass('bg-danger bg-warning bg-success').addClass(bgColor);
        $toast.find('.toast-body').text(message);
        const toast = new bootstrap.Toast($toast[0]);
        toast.show();
    }

    // Đăng xuất Admin
    $('#adminLogoutBtn').on('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });

});
