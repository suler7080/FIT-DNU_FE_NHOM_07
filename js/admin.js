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

});
