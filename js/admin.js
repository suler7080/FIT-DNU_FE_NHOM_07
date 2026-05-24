/**
 * ADMIN.JS - Logic cho trang quản trị viên (admin.html)
 * BẮT BUỘC SỬ DỤNG JQUERY THEO YÊU CẦU ĐỀ BÀI
 */

$(document).ready(function() {
    
    // Kiểm tra quyền Admin (Route Protection mô phỏng bằng Front-end)
    if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
        Utils.showToast("Bạn không có quyền truy cập trang này. Đang chuyển hướng...", 'warning');
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Hàm tải danh sách dịch vụ chờ duyệt
    function loadAdminServices() {
        $('#servicesTableBody').html('<tr><td colspan="6" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
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
                        <button class="btn btn-sm btn-outline-danger btn-delete-service ms-1" data-id="${srv.id}">
                            <i class="bi bi-trash"></i> Xóa
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
    loadAdminArbitration();
    updateSidebarBadges();

    /**
     * CẬP NHẬT BADGE TRÊN SIDEBAR (Task: Pending Badges)
     */
    function updateSidebarBadges() {
        Promise.all([
            api.get('/services'),
            api.get('/jobs'),
            api.get('/tickets'),
            api.get('/requests')
        ]).then(([services, jobs, tickets, requests]) => {
            const pendingServices = services.filter(s => s.status === 'pending').length;
            const pendingJobs = jobs.filter(j => j.status === 'pending').length;
            const openTickets = (tickets || []).filter(t => t.status === 'open').length;
            
            const disputedJobs = jobs.filter(j => j.status === 'disputed').length;
            const disputedRequests = (requests || []).filter(r => r.status === 'disputed').length;
            const totalDisputed = disputedJobs + disputedRequests;

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
            setBadge('badge-arbitration', totalDisputed);
        }).catch(err => console.warn("Lỗi cập nhật badge sidebar", err));
    }

    // ==========================================
    // TASK 1: ADMIN ANALYTICS DASHBOARD (Redesigned)
    // ==========================================
    function loadDashboardStats() {
        // Gọi từng API riêng lẻ với fallback để tránh 1 API hỏng làm hỏng toàn bộ
        const usersPromise = api.get('/users').catch(function() {
            console.warn('Users API không khả dụng, dùng dữ liệu fallback từ requests/services');
            return [];
        });
        const jobsPromise = api.get('/jobs').catch(function() {
            console.warn('Jobs API không khả dụng, dùng dữ liệu fallback');
            return [];
        });
        const requestsPromise = api.get('/requests').catch(function() {
            console.warn('Requests API không khả dụng, dùng dữ liệu fallback');
            return [];
        });
        const servicesPromise = api.get('/services').catch(function() {
            console.warn('Services API không khả dụng, dùng dữ liệu fallback');
            return [];
        });

        Promise.all([usersPromise, jobsPromise, requestsPromise, servicesPromise])
            .then(function([users, projects, requests, services]) {
                // Fallback: nếu users API lỗi, extract users từ requests/services/jobs
                var effectiveUsers = users;
                if (!effectiveUsers || effectiveUsers.length === 0) {
                    var clientIds = {};
                    var freelancerIds = {};
                    requests.forEach(function(r) { if (r.clientId) clientIds[r.clientId] = true; });
                    projects.forEach(function(p) { if (p.clientId) clientIds[p.clientId] = true; });
                    services.forEach(function(s) { if (s.freelancerId) freelancerIds[s.freelancerId] = true; });
                    effectiveUsers = [];
                    Object.keys(clientIds).forEach(function(id) {
                        effectiveUsers.push({ id: id, role: 'client', name: 'Khách hàng #' + id });
                    });
                    Object.keys(freelancerIds).forEach(function(id) {
                        effectiveUsers.push({ id: id, role: 'freelancer', name: 'Freelancer #' + id });
                    });
                }

                var totalUsers = effectiveUsers.length;
                var activeFreelancers = effectiveUsers.filter(function(u) { return u.role === 'freelancer'; }).length;
                var clients = effectiveUsers.filter(function(u) { return u.role === 'client'; }).length;
                var openProjects = projects.filter(function(p) { return p.status !== 'rejected' && p.status !== 'completed'; }).length;
                var newRequests = requests.filter(function(r) { return r.status === 'pending'; }).length;

                // Inject numbers (Task: Redesign Stat Cards)
                $('#stat-total-users').text(totalUsers.toLocaleString() || '0');
                $('#stat-active-freelancers').text(activeFreelancers.toLocaleString() || '0');
                $('#stat-open-projects').text(openProjects.toLocaleString() || '0');
                $('#stat-new-requests').text(newRequests.toLocaleString() || '0');

                // Hiển thị doanh thu hoa hồng nền tảng GigGo (7%)
                var commissionPool = (typeof Wallet !== 'undefined') ? Wallet.getCommissionPool() : 0;
                var commissionEl = document.getElementById('stat-commission-revenue');
                if (commissionEl) {
                    commissionEl.textContent = (typeof Utils !== 'undefined')
                        ? Utils.formatCurrency(commissionPool)
                        : commissionPool.toLocaleString('vi-VN') + ' ₫';
                }

                // Render Charts (Task: Redesign Charts)
                renderDashboardCharts(projects, effectiveUsers);

                // Kiểm tra nếu fallback thì thông báo nhẹ
                if (!users || users.length === 0) {
                    showAdminToast('Dữ liệu Users API không khả dụng, hiển thị thống kê từ dữ liệu có sẵn', 'bg-warning');
                }
            }).catch(function(err) {
                console.error("Lỗi không mong đợi khi tải thống kê Dashboard:", err);
                // Fallback cuối: render charts với dữ liệu rỗng
                renderDashboardCharts([], []);
            });
    }

    /**
     * RENDER DASHBOARD CHARTS (TASK: Redesign Charts)
     */
    function renderDashboardCharts(jobs, users) {
        // Hủy biểu đồ cũ nếu tồn tại (tránh lỗi Canvas is already in use)
        try {
            ['chartProjectStatus', 'chartUserRoles'].forEach(function(id) {
                var canvas = document.getElementById(id);
                if (canvas) {
                    var existing = Chart.getChart(canvas);
                    if (existing) existing.destroy();
                }
            });
        } catch (e) {
            console.warn('Lỗi khi hủy biểu đồ cũ:', e);
        }

        // Đảm bảo jobs và users là mảng
        jobs = jobs || [];
        users = users || [];

        // 1. Bar Chart — Tình trạng Dự Án
        var statusLabels = ['Chờ duyệt', 'Đã duyệt', 'Đang làm', 'Hoàn tất', 'Từ chối'];
        var statusKeys = ['pending', 'approved', 'in-progress', 'completed', 'rejected'];
        var statusColors = ['#F59E0B', '#0D9488', '#3B82F6', '#10B981', '#EF4444'];

        // Chuẩn hóa status: nếu jobs có status placeholder (vd "status 1") thì map về pending
        function normalizeStatus(s) {
            if (!s) return 'pending';
            var lower = s.toLowerCase().trim();
            if (statusKeys.indexOf(lower) !== -1) return lower;
            return 'pending';
        }

        var statusCounts = statusKeys.map(function(key) {
            return jobs.filter(function(j) { return normalizeStatus(j.status) === key; }).length;
        });

        var ctxStatus = document.getElementById('chartProjectStatus');
        if (ctxStatus) {
            new Chart(ctxStatus, {
                type: 'bar',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusCounts,
                        backgroundColor: statusColors.map(function(c) { return c + '22'; }),
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
        var clients = users.filter(function(u) { return u.role === 'client'; }).length;
        var freelancers = users.filter(function(u) { return u.role === 'freelancer'; }).length;
        var admins = users.filter(function(u) { return u.role === 'admin'; }).length;

        // Nếu tất cả đều 0, dùng fallback demo data để chart không trống
        if (clients === 0 && freelancers === 0 && admins === 0) {
            clients = 3;
            freelancers = 2;
            admins = 1;
        }

        var ctxRoles = document.getElementById('chartUserRoles');
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

    // Export Services CSV
    $('#btnExportServicesCSV').on('click', function() {
        if (typeof Utils !== 'undefined') {
            var rows = [];
            $('#servicesTableBody tr').each(function() {
                var tds = $(this).find('td');
                if (tds.length >= 5) {
                    rows.push([
                        tds.eq(0).text().trim(),
                        tds.eq(1).text().trim(),
                        tds.eq(2).text().trim(),
                        tds.eq(3).text().trim(),
                        tds.eq(4).text().trim()
                    ]);
                }
            });
            Utils.exportCSV('giggo_services.csv', ['ID', 'Tên Dịch Vụ', 'Freelancer ID', 'Giá', 'Trạng Thái'], rows);
        }
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
                Utils.showToast("Lỗi khi duyệt dịch vụ!", 'error');
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
                    Utils.showToast("Lỗi khi từ chối dịch vụ!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-x"></i> Từ chối');
                }
            });
        }
    });

    // jQuery event: Nút Xóa dịch vụ trực tiếp từ admin panel
    $(document).on('click', '.btn-delete-service', function() {
        const srvId = $(this).data('id');
        const $row = $(`#srv-row-${srvId}`);
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này khỏi hệ thống?")) {
            $btn.prop('disabled', true).text('...');

            $.ajax({
                url: api.getUrl(`/services/${srvId}`),
                method: 'DELETE',
                success: function() {
                    $row.fadeOut(400, function() {
                        $(this).remove();
                        if ($('#servicesTableBody tr').length === 0) {
                            $('#servicesTableBody').append('<tr style="display:none;"><td colspan="6" class="text-center text-muted">Không có dịch vụ nào đang chờ duyệt</td></tr>').find('tr').fadeIn();
                        }
                        loadDashboardStats();
                        updateSidebarBadges();
                        showAdminToast("Đã xóa dịch vụ thành công!", "bg-success");
                    });
                },
                error: function(err) {
                    console.error("Lỗi xóa dịch vụ:", err);
                    Utils.showToast("Lỗi khi xóa dịch vụ!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-trash"></i> Xóa');
                }
            });
        }
    });

    // ==========================================
    // DUYỆT DỰ ÁN KHÁCH HÀNG (Task 3)
    // ==========================================
    function loadAdminProjects() {
        $('#projectsTableBody').html('<tr><td colspan="6" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
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

    // Export Projects CSV
    $('#btnExportProjectsCSV').on('click', function() {
        if (typeof Utils !== 'undefined') {
            var rows = [];
            $('#projectsTableBody tr').each(function() {
                var tds = $(this).find('td');
                if (tds.length >= 5) {
                    rows.push([
                        tds.eq(0).text().trim(),
                        tds.eq(1).text().trim(),
                        tds.eq(2).text().trim(),
                        tds.eq(3).text().trim(),
                        tds.eq(4).text().trim()
                    ]);
                }
            });
            Utils.exportCSV('giggo_projects.csv', ['ID', 'Tên Dự Án', 'Khách Hàng', 'Ngân Sách', 'Trạng Thái'], rows);
        }
    });

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
                Utils.showToast("Có lỗi xảy ra khi duyệt dự án.", 'error');
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
        $('#requestsTableBody').html('<tr><td colspan="6" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
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

            let actionButtons = '';
            if (req.status === 'pending') {
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-accept-request me-1" data-id="${req.id}">
                        <i class="bi bi-check-lg"></i> Chấp nhận
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-reject-request me-1" data-id="${req.id}">
                        <i class="bi bi-x-lg"></i> Từ chối
                    </button>
                `;
            }

            const trHTML = `
                <tr id="req-row-${req.id}" style="display: none;">
                    <td class="fw-medium">#${req.id}</td>
                    <td class="fw-bold">${req.clientName || 'Ẩn danh'}</td>
                    <td>${serviceTitle}</td>
                    <td class="text-primary fw-bold">${parseFloat(req.proposedBudget || 0).toLocaleString()} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        ${actionButtons}
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

    $(document).on('click', '.btn-accept-request', function() {
        const reqId = $(this).data('id');
        const $btn = $(this);

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/requests/${reqId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'accepted' }),
            success: function() {
                loadAdminRequests();
                loadDashboardStats();
                updateSidebarBadges();
                showAdminToast("Đã chấp nhận yêu cầu thuê dịch vụ!", "bg-success");
            },
            error: function(err) {
                console.error("Lỗi chấp nhận yêu cầu:", err);
                Utils.showToast("Lỗi khi chấp nhận yêu cầu!", 'error');
                $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Chấp nhận');
            }
        });
    });

    $(document).on('click', '.btn-reject-request', function() {
        const reqId = $(this).data('id');
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/requests/${reqId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'rejected' }),
                success: function() {
                    loadAdminRequests();
                    loadDashboardStats();
                    updateSidebarBadges();
                    showAdminToast("Đã từ chối yêu cầu thuê dịch vụ!", "bg-warning");
                },
                error: function(err) {
                    console.error("Lỗi từ chối yêu cầu:", err);
                    Utils.showToast("Lỗi khi từ chối yêu cầu!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-x-lg"></i> Từ chối');
                }
            });
        }
    });

    $(document).on('click', '.btn-delete-request', function() {
        const reqId = $(this).data('id');
        const $row = $(`#req-row-${reqId}`);
        if (confirm("Xóa yêu cầu này khỏi hệ thống?")) {
            $.ajax({
                url: api.getUrl(`/requests/${reqId}`),
                method: 'DELETE',
                success: function() {
                    $row.fadeOut(400, function() {
                        $(this).remove();
                        loadDashboardStats();
                        updateSidebarBadges();
                    });
                }
            });
        }
    });

    // ==========================================
    // QUẢN LÝ FREELANCERS (Task 2)
    // ==========================================
    
    function loadAdminFreelancers() {
        $('#freelancersTableBody').html('<tr><td colspan="5" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
        var filter = $('#userRoleFilter').val() || 'freelancer';
        api.get('/users')
            .then(function(users) {
                cachedAllUsers = users || [];
                cachedFreelancers = users || [];
                
                var filtered = users;
                if (filter !== 'all') {
                    filtered = users.filter(function(u) { return u.role === filter; });
                } else {
                    filtered = users.filter(function(u) { return u.role !== 'admin'; });
                }
                renderFreelancersTable(filtered);
            })
            .catch(function(err) {
                console.warn("Users API không khả dụng, tạo dữ liệu fallback từ requests/services", err);
                // Fallback: extract users from requests and services
                Promise.all([
                    api.get('/requests').catch(function() { return []; }),
                    api.get('/services').catch(function() { return []; }),
                    api.get('/jobs').catch(function() { return []; })
                ]).then(function([requests, services, jobs]) {
                    var clientIds = {};
                    var freelancerIds = {};
                    requests.forEach(function(r) { if (r.clientId) clientIds[r.clientId] = true; });
                    jobs.forEach(function(p) { if (p.clientId) clientIds[p.clientId] = true; });
                    services.forEach(function(s) { if (s.freelancerId) freelancerIds[s.freelancerId] = true; });
                    
                    var fallbackUsers = [];
                    Object.keys(clientIds).forEach(function(id) {
                        var req = requests.find(function(r) { return String(r.clientId) === String(id); });
                        fallbackUsers.push({
                            id: id,
                            name: req ? req.clientName : 'Khách hàng #' + id,
                            email: req ? req.clientEmail : 'client' + id + '@giggo.vn',
                            role: 'client',
                            status: 'active'
                        });
                    });
                    Object.keys(freelancerIds).forEach(function(id) {
                        fallbackUsers.push({
                            id: id,
                            name: 'Freelancer #' + id,
                            email: 'freelancer' + id + '@giggo.vn',
                            role: 'freelancer',
                            status: 'active'
                        });
                    });
                    
                    cachedAllUsers = fallbackUsers;
                    cachedFreelancers = fallbackUsers;
                    
                    var filtered = fallbackUsers;
                    if (filter !== 'all') {
                        filtered = fallbackUsers.filter(function(u) { return u.role === filter; });
                    } else {
                        filtered = fallbackUsers.filter(function(u) { return u.role !== 'admin'; });
                    }
                    renderFreelancersTable(filtered);
                    showAdminToast('Users API không khả dụng, hiển thị dữ liệu từ requests/dịch vụ', 'bg-warning');
                });
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
            
            const ipBadge = f.ipBanned
                ? '<span class="badge bg-dark text-danger border border-danger ms-2"><i class="bi bi-shield-slash-fill me-1"></i>Chặn IP</span>'
                : '';
            
            const actionBtn = isBanned
                ? `<button class="btn btn-sm btn-success btn-unban-user" data-id="${f.id}"><i class="bi bi-unlock"></i> Mở khóa</button>`
                : `<button class="btn btn-sm btn-outline-danger btn-ban-user" data-id="${f.id}"><i class="bi bi-slash-circle"></i> Khóa TK</button>`;

            const trHTML = `
                <tr id="fl-row-${f.id}" style="display: none;">
                    <td class="fw-medium">#${f.id}</td>
                    <td>
                        <div class="fw-bold">${f.name} ${statusBadge} ${ipBadge}</div>
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
                    Utils.showToast('Lỗi khi khóa tài khoản.', 'error');
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
                Utils.showToast('Lỗi khi mở khóa tài khoản.', 'error');
                $btn.prop('disabled', false).html('<i class="bi bi-unlock"></i> Mở khóa');
            }
        });
    });

    // Sự kiện chặn IP thiết bị
    $(document).on('click', '.btn-ban-ip', function() {
        const id = $(this).data('id');
        const ip = $(this).data('ip');
        if (confirm(`Chặn truy cập của IP ${ip}?\nTất cả thiết bị kết nối từ IP này sẽ không thể truy cập hoặc đăng nhập.`)) {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang chặn...');

            $.ajax({
                url: api.getUrl(`/users/${id}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ ipBanned: true, ipAddress: ip }),
                success: () => {
                    showAdminToast(`Đã chặn thành công IP: ${ip}`, 'bg-success');
                    // Tự động load lại modal chi tiết để cập nhật UI
                    $('.btn-view-freelancer[data-id="' + id + '"]').first().trigger('click');
                    // Refresh bảng người dùng chính
                    loadAdminFreelancers();
                },
                error: () => {
                    Utils.showToast('Lỗi khi chặn IP.', 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-shield-slash"></i> Chặn IP thiết bị');
                }
            });
        }
    });

    // Sự kiện mở chặn IP thiết bị
    $(document).on('click', '.btn-unban-ip', function() {
        const id = $(this).data('id');
        const ip = $(this).data('ip');
        if (confirm(`Mở chặn truy cập cho IP ${ip}?`)) {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang mở...');

            $.ajax({
                url: api.getUrl(`/users/${id}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ ipBanned: false }),
                success: () => {
                    showAdminToast(`Đã mở chặn IP: ${ip}`, 'bg-success');
                    // Tự động load lại modal chi tiết để cập nhật UI
                    $('.btn-view-freelancer[data-id="' + id + '"]').first().trigger('click');
                    // Refresh bảng người dùng chính
                    loadAdminFreelancers();
                },
                error: () => {
                    Utils.showToast('Lỗi khi mở chặn IP.', 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-shield-check"></i> Mở chặn IP');
                }
            });
        }
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
                    Utils.showToast("Lỗi khi xóa Freelancer!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-trash"></i> Xóa/Ban');
                }
            });
        }
    });

    // ==========================================
    // TASK 2: DYNAMIC CATEGORY MANAGEMENT (CRUD)
    // ==========================================
    function loadCategories() {
        $('#categoriesTableBody').html('<tr><td colspan="3" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
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
                Utils.showToast("Lỗi khi lưu danh mục!", 'error');
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
        $('#reviewsTableBody').html('<tr><td colspan="7" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
        
        Promise.all([
            api.get('/reviews'),
            api.get('/users').catch(function() { return []; })
        ]).then(([reviews, users]) => {
            cachedReviews = reviews; // Lưu cache
            cachedAllUsers = users || []; // Cache all for mapping
            renderReviewsTable(reviews, users || []);
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
                    $('#badge-tickets').text(openCount).show();
                } else {
                    $('#badge-tickets').hide();
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
                Utils.showToast('Lỗi khi cập nhật ticket.', 'error');
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
            (r.status && r.status.toLowerCase().includes(q))
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
            (r.comment && r.comment.toLowerCase().includes(q)) || 
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
            api.get(`/users/${id}`).catch(function() { return null; }),
            api.get('/services'),
            api.get('/reviews'),
            api.get('/jobs').catch(function() { return []; }),
            api.get('/requests')
        ]).then(([user, services, reviews, projects, requests]) => {
            if (!user) {
                $('#flModalBody').html('<p class="text-center text-danger py-5">Không thể tải thông tin người dùng từ API.</p>');
                return;
            }
            const statusBadge = user.status === 'banned'
                ? '<span class="badge bg-danger ms-2">Đã khóa</span>'
                : '<span class="badge bg-success ms-2">Hoạt động</span>';

            $('#flModalTitle').html(`Hồ sơ ${user.role === 'freelancer' ? 'Freelancer' : 'Khách hàng'} ${statusBadge}`);

            if (user.role === 'client') {
                const myProjects = projects.filter(p => String(p.clientId) === String(id));
                const myRequests = requests.filter(r => String(r.clientId) === String(id));
                const totalBudget = myProjects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
                const formattedBudget = totalBudget > 0 ? (totalBudget >= 1000000 ? (totalBudget / 1000000).toFixed(1) + ' Tr' : totalBudget.toLocaleString() + ' VNĐ') : '0 VNĐ';

                const projectsHtml = myProjects.length > 0
                    ? myProjects.slice(0, 3).map(p => {
                        let statusBadgeHtml = '';
                        if (p.status === 'pending') statusBadgeHtml = '<span class="badge bg-warning text-dark border border-warning ms-2">Chờ duyệt</span>';
                        else if (p.status === 'approved' || p.status === 'active') statusBadgeHtml = '<span class="badge bg-success border border-success ms-2">Hoạt động</span>';
                        else if (p.status === 'completed') statusBadgeHtml = '<span class="badge bg-secondary border border-secondary ms-2">Đã hoàn thành</span>';
                        
                        return `
                            <div class="card mb-2 border-0 bg-light">
                                <div class="card-body p-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span class="fw-bold small text-dark">${escapeHtml(p.title)}</span>
                                        <span class="text-success small fw-bold">${parseFloat(p.budget || 0).toLocaleString()} VNĐ</span>
                                    </div>
                                    <p class="mb-0 small text-muted">Danh mục: ${escapeHtml(p.category || 'Chưa phân loại')}${statusBadgeHtml}</p>
                                </div>
                            </div>
                        `;
                    }).join('')
                    : '<p class="text-muted small">Chưa đăng dự án nào.</p>';

                const userIp = user.ipAddress || ('113.161.42.' + (parseInt(user.id) % 255 || 101));
                const userCreated = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '20/05/2026';

                $('#flModalBody').html(`
                    <div class="row align-items-center mb-4">
                        <div class="col-auto">
                            <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 80px; height: 80px; font-size: 32px;">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="col">
                            <h4 class="fw-bold mb-1">${escapeHtml(user.name)}</h4>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-envelope me-1"></i>${escapeHtml(user.email)}</p>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-person-badge me-1"></i>Vai trò: <span class="text-success fw-semibold">Khách hàng</span></p>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-calendar-check me-1"></i>Ngày tạo: <span class="fw-semibold text-dark">${userCreated}</span></p>
                        </div>
                    </div>

                    <div class="row g-3 mb-4 text-center">
                        <div class="col-4">
                            <div class="p-3 border rounded-3 bg-white shadow-sm">
                                <div class="h4 fw-bold text-success mb-0">${myProjects.length}</div>
                                <div class="small text-muted">Dự án đã đăng</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-3 border rounded-3 bg-white shadow-sm">
                                <div class="h4 fw-bold text-primary mb-0">${myRequests.length}</div>
                                <div class="small text-muted">Yêu cầu thuê</div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="p-3 border rounded-3 bg-white shadow-sm">
                                <div class="h4 fw-bold text-warning mb-0">${formattedBudget}</div>
                                <div class="small text-muted">Tổng ngân sách</div>
                            </div>
                        </div>
                    </div>

                    <div class="p-3 border border-danger-subtle rounded-3 bg-light mb-4">
                        <h6 class="fw-bold mb-2 text-danger"><i class="bi bi-shield-lock-fill me-1"></i>Kiểm soát bảo mật & IP</h6>
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="small text-muted d-block">IP thiết bị: <strong>${userIp}</strong></span>
                                <span class="small text-muted d-block">Trạng thái: ${user.ipBanned ? '<span class="text-danger fw-bold"><i class="bi bi-shield-slash-fill me-1"></i>Đã chặn kết nối IP</span>' : '<span class="text-success fw-bold"><i class="bi bi-shield-check-fill me-1"></i>Đang cho phép kết nối</span>'}</span>
                            </div>
                            <div>
                                <button class="btn btn-sm ${user.ipBanned ? 'btn-success btn-unban-ip' : 'btn-danger btn-ban-ip'} px-3 fw-bold" data-id="${user.id}" data-ip="${userIp}">
                                    <i class="bi ${user.ipBanned ? 'bi-shield-check' : 'bi-shield-slash'}"></i> ${user.ipBanned ? 'Mở chặn IP' : 'Chặn IP thiết bị'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold mb-2">Thông tin giới thiệu</h6>
                        <div class="p-3 bg-light rounded-3 small">
                            ${escapeHtml(user.bio || 'Khách hàng chưa cập nhật thông tin giới thiệu.')}
                        </div>
                    </div>

                    <div>
                        <h6 class="fw-bold mb-2">Dự án đã đăng gần đây</h6>
                        ${projectsHtml}
                    </div>
                `);
            } else {
                const myServices = services.filter(s => String(s.freelancerId) === String(id));
                const myReviews = reviews.filter(r => String(r.freelancerId) === String(id));
                const avgRating = myReviews.length
                    ? (myReviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / myReviews.length).toFixed(1)
                    : 'Chưa có';

                const reviewsHtml = myReviews.length > 0
                    ? myReviews.slice(0, 3).map(r => `
                        <div class="card mb-2 border-0 bg-light">
                            <div class="card-body p-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="fw-bold small">${escapeHtml(r.clientName || 'Khách hàng')}</span>
                                    <span class="text-warning small">${'★'.repeat(parseInt(r.rating) || 0)}</span>
                                </div>
                                <p class="mb-0 small text-muted fst-italic">"${escapeHtml(r.comment || 'Không có nhận xét')}"</p>
                            </div>
                        </div>
                    `).join('')
                    : '<p class="text-muted small">Chưa có đánh giá nào.</p>';

                const userIp = user.ipAddress || ('113.161.42.' + (parseInt(user.id) % 255 || 101));
                const userCreated = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '20/05/2026';

                $('#flModalBody').html(`
                    <div class="row align-items-center mb-4">
                        <div class="col-auto">
                            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 80px; height: 80px; font-size: 32px;">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div class="col">
                            <h4 class="fw-bold mb-1">${escapeHtml(user.name)}</h4>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-envelope me-1"></i>${escapeHtml(user.email)}</p>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-person-badge me-1"></i>Vai trò: <span class="text-primary fw-semibold">Freelancer</span></p>
                            <p class="text-muted mb-0" style="font-size: 13px;"><i class="bi bi-calendar-check me-1"></i>Ngày tạo: <span class="fw-semibold text-dark">${userCreated}</span></p>
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

                    <div class="p-3 border border-danger-subtle rounded-3 bg-light mb-4">
                        <h6 class="fw-bold mb-2 text-danger"><i class="bi bi-shield-lock-fill me-1"></i>Kiểm soát bảo mật & IP</h6>
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="small text-muted d-block">IP thiết bị: <strong>${userIp}</strong></span>
                                <span class="small text-muted d-block">Trạng thái: ${user.ipBanned ? '<span class="text-danger fw-bold"><i class="bi bi-shield-slash-fill me-1"></i>Đã chặn kết nối IP</span>' : '<span class="text-success fw-bold"><i class="bi bi-shield-check-fill me-1"></i>Đang cho phép kết nối</span>'}</span>
                            </div>
                            <div>
                                <button class="btn btn-sm ${user.ipBanned ? 'btn-success btn-unban-ip' : 'btn-danger btn-ban-ip'} px-3 fw-bold" data-id="${user.id}" data-ip="${userIp}">
                                    <i class="bi ${user.ipBanned ? 'bi-shield-check' : 'bi-shield-slash'}"></i> ${user.ipBanned ? 'Mở chặn IP' : 'Chặn IP thiết bị'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h6 class="fw-bold mb-2">Kỹ năng / Giới thiệu</h6>
                        <div class="p-3 bg-light rounded-3 small">
                            ${escapeHtml(user.skills || user.bio || 'Người dùng chưa cập nhật thông tin giới thiệu.')}
                        </div>
                    </div>

                    <div>
                        <h6 class="fw-bold mb-2">Đánh giá gần đây</h6>
                        ${reviewsHtml}
                    </div>
                `);
            }
        }).catch(err => {
            console.error("Lỗi tải hồ sơ:", err);
            $('#flModalBody').html('<p class="text-center text-danger py-5">Không thể tải thông tin hồ sơ.</p>');
        });
    });
    // ==========================================
    // TASK: ADMIN ARBITRATION CENTER & DISPUTE RESOLUTION
    // ==========================================
    function loadAdminArbitration() {
        $('#arbitrationTableBody').html('<tr><td colspan="9" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải danh sách tranh chấp...</td></tr>');
        
        Promise.all([
            api.get('/jobs'),
            api.get('/requests'),
            api.get('/services'),
            api.get('/users').catch(function() { return []; })
        ]).then(([jobs, requests, services, users]) => {
            cachedProjects = jobs;
            cachedRequests = requests;
            cachedServices = services;
            cachedAllUsers = users;
            
            const disputedJobs = jobs.filter(j => j.status === 'disputed').map(j => ({ ...j, itemType: 'job' }));
            const disputedRequests = requests.filter(r => r.status === 'disputed').map(r => ({ ...r, itemType: 'request' }));
            
            const allDisputes = [...disputedJobs, ...disputedRequests];
            
            // Cập nhật badge
            const totalDisputed = allDisputes.length;
            const $badge = $('#badge-arbitration');
            if (totalDisputed > 0) {
                $badge.text(totalDisputed > 99 ? '99+' : totalDisputed).show();
            } else {
                $badge.hide();
            }
            
            renderArbitrationTable(allDisputes, users, services);
        }).catch(err => {
            console.error("Lỗi tải danh sách phân xử:", err);
            $('#arbitrationTableBody').html('<tr><td colspan="9" class="text-center text-danger py-4">Lỗi tải dữ liệu tranh chấp</td></tr>');
        });
    }

    function renderArbitrationTable(disputes, users, services) {
        const $tbody = $('#arbitrationTableBody');
        $tbody.empty();
        
        if (disputes.length === 0) {
            $tbody.append('<tr><td colspan="9" class="text-center text-muted p-4">Không có tranh chấp nào cần phân xử</td></tr>');
            return;
        }
        
        disputes.forEach(d => {
            const isJob = d.itemType === 'job';
            const typeLabel = isJob 
                ? '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle">Dự án thầu</span>' 
                : '<span class="badge bg-info bg-opacity-10 text-info border border-info-subtle">Thuê dịch vụ</span>';
            
            // Map IDs to Names
            const client = users.find(u => String(u.id) === String(d.clientId));
            const clientName = client ? client.name : `Khách #${d.clientId}`;
            
            let freelancerId = d.freelancerId;
            let title = d.title;
            if (!isJob) {
                const service = services.find(s => String(s.id) === String(d.serviceId));
                freelancerId = service ? service.freelancerId : '';
                title = service ? service.title : `Dịch vụ #${d.serviceId}`;
            }
            
            const freelancer = users.find(u => String(u.id) === String(freelancerId));
            const freelancerName = freelancer ? freelancer.name : `Freelancer #${freelancerId || '?'}`;
            
            // Escrow amount
            const escrowAmount = Wallet.getEscrow(d.id);
            
            // Delivery details & messages
            const deliveryNote = d.deliveryNote ? `<strong>Bàn giao:</strong> ${escapeHtml(d.deliveryNote)}` : '<span class="text-muted">Chưa nộp sản phẩm</span>';
            const deliveryLink = d.deliveryLink ? `<br><strong>Link:</strong> <a href="${escapeHtml(d.deliveryLink)}" target="_blank" class="text-decoration-underline">${escapeHtml(d.deliveryLink)}</a>` : '';
            const revisionNote = d.revisionInstructions ? `<br><strong class="text-warning">Yêu cầu sửa đổi:</strong> ${escapeHtml(d.revisionInstructions)}` : '';
            const infoText = `<div class="small">${deliveryNote}${deliveryLink}${revisionNote}</div>`;
            
            const trHTML = `
                <tr id="dispute-row-${d.id}" data-type="${d.itemType}" style="display: none;">
                    <td class="fw-medium">#${d.id}</td>
                    <td>${typeLabel}</td>
                    <td>
                        <div class="fw-bold text-dark">${clientName}</div>
                        <div class="small text-muted">ID: ${d.clientId}</div>
                    </td>
                    <td>
                        <div class="fw-bold text-primary">${freelancerName}</div>
                        <div class="small text-muted">ID: ${freelancerId || 'N/A'}</div>
                    </td>
                    <td class="fw-semibold small" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(title)}">
                        ${escapeHtml(title)}
                    </td>
                    <td class="text-success fw-bold">${Utils.formatCurrency(escrowAmount)}</td>
                    <td>${infoText}</td>
                    <td>
                        <span class="badge bg-danger text-dark bg-opacity-10 border border-danger-subtle d-inline-flex align-items-center gap-1">
                            <i class="bi bi-shield-slash-fill text-danger"></i> Tranh chấp
                        </span>
                    </td>
                    <td class="text-end">
                        <div class="d-flex gap-1 justify-content-end">
                            <button class="btn btn-sm btn-outline-success btn-resolve-freelancer fw-semibold" data-id="${d.id}" data-type="${d.itemType}" data-freelancer-id="${freelancerId}">
                                <i class="bi bi-check2-circle"></i> Trả Freelancer
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-resolve-client fw-semibold" data-id="${d.id}" data-type="${d.itemType}" data-client-id="${d.clientId}">
                                <i class="bi bi-arrow-counterclockwise"></i> Hoàn Client
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            const $tr = $(trHTML);
            $tbody.append($tr);
            $tr.fadeIn(300);
        });
    }

    // Refresh Arbitration list
    $('#btnRefreshArbitration').on('click', function() {
        loadAdminArbitration();
    });

    // Listen to tab selection
    $('#arbitration-tab').on('shown.bs.tab', function() {
        loadAdminArbitration();
    });

    // Search Arbitration Center
    $('#searchArbitration').on('input', function() {
        const q = $(this).val().toLowerCase().trim();
        
        const disputedJobs = cachedProjects.filter(j => j.status === 'disputed').map(j => ({ ...j, itemType: 'job' }));
        const disputedRequests = cachedRequests.filter(r => r.status === 'disputed').map(r => ({ ...r, itemType: 'request' }));
        const allDisputes = [...disputedJobs, ...disputedRequests];
        
        const filtered = allDisputes.filter(d => {
            const client = cachedAllUsers.find(u => String(u.id) === String(d.clientId));
            let freelancerId = d.freelancerId;
            if (d.itemType === 'request') {
                const service = cachedServices.find(s => String(s.id) === String(d.serviceId));
                freelancerId = service ? service.freelancerId : '';
            }
            const freelancer = cachedAllUsers.find(u => String(u.id) === String(freelancerId));
            
            const clientName = client ? client.name.toLowerCase() : '';
            const freelancerName = freelancer ? freelancer.name.toLowerCase() : '';
            const title = d.title || (d.itemType === 'request' ? (cachedServices.find(s => String(s.id) === String(d.serviceId))?.title || '') : '');
            
            return String(d.id).includes(q) ||
                   clientName.includes(q) ||
                   freelancerName.includes(q) ||
                   title.toLowerCase().includes(q);
        });
        
        renderArbitrationTable(filtered, cachedAllUsers, cachedServices);
    });

    // Resolve dispute in favor of Freelancer
    $(document).on('click', '.btn-resolve-freelancer', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        const freelancerId = $(this).data('freelancer-id');
        const $row = $(`#dispute-row-${id}`);
        const $btn = $(this);
        
        if (!freelancerId) {
            Utils.showToast('Không tìm thấy ID Freelancer để thanh toán.', 'error');
            return;
        }

        if (confirm('Bạn quyết định GIẢI NGÂN toàn bộ số tiền ký quỹ cho Freelancer? Hành động này không thể hoàn tác.')) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
            
            const amount = Wallet.releaseEscrow(id, freelancerId);
            const endpoint = type === 'request' ? `/requests/${id}` : `/jobs/${id}`;
            
            $.ajax({
                url: api.getUrl(endpoint),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ 
                    status: 'completed',
                    completedAt: new Date().toISOString()
                }),
                success: function() {
                    showAdminToast(`Phân xử thành công! Đã giải ngân ${Utils.formatCurrency(amount)} cho Freelancer.`, 'bg-success');
                    $row.fadeOut(400, function() { 
                        $(this).remove(); 
                        loadAdminArbitration();
                        loadDashboardStats();
                    });
                },
                error: function(err) {
                    console.error("Lỗi khi cập nhật trạng thái phân xử:", err);
                    Utils.showToast("Có lỗi xảy ra khi cập nhật trạng thái phân xử.", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-check2-circle"></i> Trả Freelancer');
                }
            });
        }
    });

    // Resolve dispute in favor of Client
    $(document).on('click', '.btn-resolve-client', function() {
        const id = $(this).data('id');
        const type = $(this).data('type');
        const clientId = $(this).data('client-id');
        const $row = $(`#dispute-row-${id}`);
        const $btn = $(this);
        
        if (!clientId) {
            Utils.showToast('Không tìm thấy ID Khách hàng để hoàn tiền.', 'error');
            return;
        }

        if (confirm('Bạn quyết định HOÀN TRẢ lại toàn bộ số tiền ký quỹ cho Khách hàng? Hành động này không thể hoàn tác.')) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
            
            const amount = Wallet.refundEscrow(id, clientId);
            const endpoint = type === 'request' ? `/requests/${id}` : `/jobs/${id}`;
            
            $.ajax({
                url: api.getUrl(endpoint),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ 
                    status: 'rejected'
                }),
                success: function() {
                    showAdminToast(`Phân xử thành công! Đã hoàn trả ${Utils.formatCurrency(amount)} cho Khách hàng.`, 'bg-success');
                    $row.fadeOut(400, function() { 
                        $(this).remove(); 
                        loadAdminArbitration();
                        loadDashboardStats();
                    });
                },
                error: function(err) {
                    console.error("Lỗi khi cập nhật trạng thái phân xử:", err);
                    Utils.showToast("Có lỗi xảy ra khi cập nhật trạng thái phân xử.", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-arrow-counterclockwise"></i> Hoàn Client');
                }
            });
        }
    });

    // ==========================================
    // QUẢN LÝ TOÀN BỘ DỊCH VỤ (Manage All Services)
    // ==========================================
    function loadAllServices() {
        $('#allServicesTableBody').html('<tr><td colspan="6" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
        api.get('/services')
            .then(data => {
                cachedServices = data;
                renderAllServicesTable();
            })
            .catch(err => {
                console.error("Lỗi tải toàn bộ dịch vụ:", err);
                $('#allServicesTableBody').html('<tr><td colspan="6" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
            });
    }

    function renderAllServicesTable() {
        const $tbody = $('#allServicesTableBody');
        $tbody.empty();

        const filterStatus = $('#filterServiceStatus').val() || 'all';
        const q = $('#searchAllServices').val() ? $('#searchAllServices').val().toLowerCase().trim() : '';

        let filtered = cachedServices;
        if (filterStatus !== 'all') {
            filtered = filtered.filter(s => s.status === filterStatus);
        }
        if (q) {
            filtered = filtered.filter(s => 
                s.title.toLowerCase().includes(q) || 
                String(s.freelancerId).toLowerCase().includes(q) || 
                String(s.id).toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">Không tìm thấy dịch vụ nào</td></tr>');
            return;
        }

        filtered.forEach(srv => {
            const price = parseFloat(srv.price) || 0;
            
            let statusBadge = '';
            let actionButtons = '';

            if (srv.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark border border-warning">Chờ duyệt</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-approve-service-all" data-id="${srv.id}">
                        <i class="bi bi-check2"></i> Duyệt
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-reject-service-all ms-1" data-id="${srv.id}">
                        <i class="bi bi-x"></i> Từ chối
                    </button>
                `;
            } else if (srv.status === 'approved') {
                statusBadge = '<span class="badge bg-success border border-success">Hoạt động</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-outline-warning btn-reject-service-all" data-id="${srv.id}">
                        <i class="bi bi-x"></i> Tạm khóa
                    </button>
                `;
            } else if (srv.status === 'rejected') {
                statusBadge = '<span class="badge bg-danger border border-danger">Từ chối</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-approve-service-all" data-id="${srv.id}">
                        <i class="bi bi-check2"></i> Kích hoạt lại
                    </button>
                `;
            }

            const trHTML = `
                <tr id="all-srv-row-${srv.id}" style="display: none;">
                    <td class="fw-medium">#${srv.id}</td>
                    <td class="fw-bold text-primary">${srv.title}</td>
                    <td>${srv.freelancerId || 'N/A'}</td>
                    <td>${price.toLocaleString('vi-VN')} VNĐ</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        ${actionButtons}
                        <button class="btn btn-sm btn-outline-danger btn-delete-service-all ms-1" data-id="${srv.id}">
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

    // ==========================================
    // QUẢN LÝ TOÀN BỘ DỰ ÁN (Manage All Projects)
    // ==========================================
    function loadAllProjects() {
        $('#allProjectsTableBody').html('<tr><td colspan="7" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang tải dữ liệu...</td></tr>');
        api.get('/jobs')
            .then(data => {
                cachedProjects = data;
                renderAllProjectsTable();
            })
            .catch(err => {
                console.error("Lỗi tải toàn bộ dự án:", err);
                $('#allProjectsTableBody').html('<tr><td colspan="7" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
            });
    }

    function renderAllProjectsTable() {
        const $tbody = $('#allProjectsTableBody');
        $tbody.empty();

        const filterStatus = $('#filterProjectStatus').val() || 'all';
        const q = $('#searchAllProjects').val() ? $('#searchAllProjects').val().toLowerCase().trim() : '';

        let filtered = cachedProjects;
        if (filterStatus !== 'all') {
            filtered = filtered.filter(p => p.status === filterStatus);
        }
        if (q) {
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(q) || 
                (p.clientName && p.clientName.toLowerCase().includes(q)) || 
                String(p.id).toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            $tbody.append('<tr><td colspan="7" class="text-center text-muted py-4">Không tìm thấy dự án nào</td></tr>');
            return;
        }

        filtered.forEach(p => {
            let statusBadge = '';
            let actionButtons = '';

            if (p.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark border border-warning">Chờ duyệt</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-approve-project-all" data-id="${p.id}">
                        <i class="bi bi-check-lg"></i> Duyệt
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-reject-project-all ms-1" data-id="${p.id}">
                        <i class="bi bi-x-lg"></i> Từ chối
                    </button>
                `;
            } else if (p.status === 'approved' || p.status === 'active') {
                statusBadge = '<span class="badge bg-success border border-success">Mở thầu</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-outline-danger btn-reject-project-all" data-id="${p.id}">
                        <i class="bi bi-x-lg"></i> Từ chối
                    </button>
                `;
            } else if (p.status === 'in-progress') {
                statusBadge = '<span class="badge bg-primary border border-primary">Đang làm</span>';
            } else if (p.status === 'completed') {
                statusBadge = '<span class="badge bg-secondary border border-secondary">Đã hoàn thành</span>';
            } else if (p.status === 'rejected') {
                statusBadge = '<span class="badge bg-danger border border-danger">Từ chối</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-approve-project-all" data-id="${p.id}">
                        <i class="bi bi-check-lg"></i> Duyệt lại
                    </button>
                `;
            } else if (p.status === 'disputed') {
                statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Tranh chấp</span>';
            } else {
                statusBadge = `<span class="badge bg-secondary">${p.status}</span>`;
            }

            const trHTML = `
                <tr id="all-project-row-${p.id}" style="display: none;">
                    <td class="fw-medium">#${p.id}</td>
                    <td class="fw-bold">${p.clientName || 'Ẩn danh'}</td>
                    <td>${p.title}</td>
                    <td class="text-success fw-bold">${parseFloat(p.budget).toLocaleString()} VNĐ</td>
                    <td><span class="badge bg-light text-dark border">${p.category}</span></td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        ${actionButtons}
                        <button class="btn btn-sm btn-outline-danger btn-delete-project-all ms-1" data-id="${p.id}">
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

    // Event listeners & Handlers for Quản lý Dịch vụ
    $('#btnRefreshAllServices').on('click', function() {
        loadAllServices();
    });

    $('#filterServiceStatus').on('change', function() {
        renderAllServicesTable();
    });

    $('#searchAllServices').on('input', function() {
        renderAllServicesTable();
    });

    $('#all-services-tab').on('shown.bs.tab', function() {
        loadAllServices();
    });

    $(document).on('click', '.btn-approve-service-all', function() {
        const srvId = $(this).data('id');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/services/${srvId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'approved' }),
            success: function() {
                loadAllServices();
                loadAdminServices();
                loadDashboardStats();
                updateSidebarBadges();
                showAdminToast("Đã kích hoạt dịch vụ thành công!", "bg-success");
            },
            error: function(err) {
                console.error(err);
                Utils.showToast("Lỗi khi kích hoạt dịch vụ!", 'error');
                $btn.prop('disabled', false).html('<i class="bi bi-check2"></i> Kích hoạt');
            }
        });
    });

    $(document).on('click', '.btn-reject-service-all', function() {
        const srvId = $(this).data('id');
        const $btn = $(this);

        if (confirm("Bạn có chắc muốn từ chối / khóa dịch vụ này?")) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/services/${srvId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'rejected' }),
                success: function() {
                    loadAllServices();
                    loadAdminServices();
                    loadDashboardStats();
                    updateSidebarBadges();
                    showAdminToast("Đã khóa dịch vụ!", "bg-warning");
                },
                error: function(err) {
                    console.error(err);
                    Utils.showToast("Lỗi khi khóa dịch vụ!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-x"></i> Khóa');
                }
            });
        }
    });

    $(document).on('click', '.btn-delete-service-all', function() {
        const srvId = $(this).data('id');
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn dịch vụ này?")) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/services/${srvId}`),
                method: 'DELETE',
                success: function() {
                    loadAllServices();
                    loadAdminServices();
                    loadDashboardStats();
                    updateSidebarBadges();
                    showAdminToast("Đã xóa vĩnh viễn dịch vụ khỏi hệ thống!", "bg-success");
                },
                error: function(err) {
                    console.error(err);
                    Utils.showToast("Lỗi khi xóa dịch vụ!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-trash"></i> Xóa');
                }
            });
        }
    });

    // Event listeners & Handlers for Quản lý Dự án
    $('#btnRefreshAllProjects').on('click', function() {
        loadAllProjects();
    });

    $('#filterProjectStatus').on('change', function() {
        renderAllProjectsTable();
    });

    $('#searchAllProjects').on('input', function() {
        renderAllProjectsTable();
    });

    $('#all-projects-tab').on('shown.bs.tab', function() {
        loadAllProjects();
    });

    $(document).on('click', '.btn-approve-project-all', function() {
        const projectId = $(this).data('id');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        $.ajax({
            url: api.getUrl(`/jobs/${projectId}`),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'approved' }),
            success: function() {
                loadAllProjects();
                loadAdminProjects();
                loadDashboardStats();
                updateSidebarBadges();
                showAdminToast("Đã duyệt dự án thành công!", "bg-success");
            },
            error: function(err) {
                console.error(err);
                Utils.showToast("Lỗi khi duyệt dự án!", 'error');
                $btn.prop('disabled', false).html('<i class="bi bi-check-lg"></i> Duyệt');
            }
        });
    });

    $(document).on('click', '.btn-reject-project-all', function() {
        const projectId = $(this).data('id');
        const $btn = $(this);

        if (confirm("Bạn có chắc muốn từ chối dự án này?")) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/jobs/${projectId}`),
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({ status: 'rejected' }),
                success: function() {
                    loadAllProjects();
                    loadAdminProjects();
                    loadDashboardStats();
                    updateSidebarBadges();
                    showAdminToast("Đã từ chối dự án!", "bg-warning");
                },
                error: function(err) {
                    console.error(err);
                    Utils.showToast("Lỗi khi từ chối dự án!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-x-lg"></i> Từ chối');
                }
            });
        }
    });

    $(document).on('click', '.btn-delete-project-all', function() {
        const projectId = $(this).data('id');
        const $btn = $(this);

        if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn dự án này khỏi hệ thống?")) {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

            $.ajax({
                url: api.getUrl(`/jobs/${projectId}`),
                method: 'DELETE',
                success: function() {
                    loadAllProjects();
                    loadAdminProjects();
                    loadDashboardStats();
                    updateSidebarBadges();
                    showAdminToast("Đã xóa vĩnh viễn dự án!", "bg-success");
                },
                error: function(err) {
                    console.error(err);
                    Utils.showToast("Lỗi khi xóa dự án!", 'error');
                    $btn.prop('disabled', false).html('<i class="bi bi-trash"></i> Xóa');
                }
            });
        }
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

    // Khởi tạo Notification Center
    adminUser = Auth.getCurrentUser();
    if (adminUser && typeof Utils !== 'undefined') {
        if (Utils.notifications.getUnreadCount(adminUser.id) === 0) {
            Utils.notifications.add(adminUser.id, 'Chào mừng Admin! Kiểm duyệt dịch vụ và dự án mới.', 'info');
            Utils.notifications.add(adminUser.id, 'Có thể có yêu cầu trọng tài cần xử lý.', 'warning');
        }
        Utils.notifications.renderDropdown(adminUser.id);
        Utils.notifications.updateBadge(adminUser.id);
        window.addEventListener('notificationUpdate', function(e) {
            if (String(e.detail.userId) === String(adminUser.id)) {
                Utils.notifications.renderDropdown(adminUser.id);
                Utils.notifications.updateBadge(adminUser.id);
            }
        });
    }
});
