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
    
    // Hàm tải danh sách dịch vụ chờ duyệt
    function loadAdminServices() {
        api.get('/services')
            .then(data => {
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
        api.get('/users')
            .then(users => {
                const freelancers = users.filter(u => u.role === 'freelancer');
                renderFreelancersTable(freelancers);
            })
            .catch(err => {
                console.error("Lỗi tải freelancers:", err);
                $('#freelancersTableBody').html('<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
            });
    }

    function renderFreelancersTable(freelancers) {
        const $tbody = $('#freelancersTableBody');
        $tbody.empty();

        if (freelancers.length === 0) {
            $tbody.append('<tr><td colspan="5" class="text-center text-muted">Không có Freelancer nào trong hệ thống</td></tr>');
            return;
        }

        freelancers.forEach(f => {
            const trHTML = `
                <tr id="fl-row-${f.id}" style="display: none;">
                    <td class="fw-medium">#${f.id}</td>
                    <td class="fw-bold">${f.name}</td>
                    <td>${f.email}</td>
                    <td><span class="badge bg-info text-dark border border-info">${f.role}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger btn-delete-freelancer" data-id="${f.id}">
                            <i class="bi bi-trash"></i> Xóa/Ban
                        </button>
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
        const $btn = $(this);
        $btn.prop('disabled', true).text('Đang tải...');
        
        $('#freelancersTableBody').fadeOut(300, function() {
            loadAdminFreelancers();
            $btn.prop('disabled', false).text('Làm mới dữ liệu');
            $(this).show();
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

    // Đăng xuất Admin
    $('#adminLogoutBtn').on('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });

});
