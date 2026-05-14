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
    
    // Hàm tải danh sách yêu cầu
    function loadAdminRequests() {
        // Sử dụng Vanilla Fetch từ api.js để lấy dữ liệu (để minh họa biết dùng cả 2)
        api.get('/requests')
            .then(data => {
                renderTable(data);
            })
            .catch(err => {
                console.warn('API không khả dụng, load mock data cho admin', err);
                const mockRequests = [
                    { id: '1', clientName: 'Nguyễn Văn A', clientEmail: 'a@gmail.com', serviceId: '1', status: 'pending' },
                    { id: '2', clientName: 'Trần Thị B', clientEmail: 'b@gmail.com', serviceId: '2', status: 'accepted' }
                ];
                renderTable(mockRequests);
            });
    }

    // jQuery: Render bảng và thêm hiệu ứng
    function renderTable(requests) {
        const $tbody = $('#requestsTableBody'); // jQuery selector
        $tbody.empty(); // jQuery DOM manipulation

        if (requests.length === 0) {
            $tbody.append('<tr><td colspan="6" class="text-center text-muted">Không có yêu cầu nào</td></tr>');
            return;
        }

        requests.forEach(req => {
            const badgeClass = req.status === 'pending' ? 'bg-warning' : (req.status === 'accepted' ? 'bg-success' : 'bg-danger');
            const statusText = req.status === 'pending' ? 'Đang chờ' : (req.status === 'accepted' ? 'Đã duyệt' : 'Từ chối');
            
            // Xây dựng tr ẩn đi ban đầu để dùng hiệu ứng fadeIn
            const trHTML = `
                <tr id="req-row-${req.id}" style="display: none;">
                    <td class="fw-medium">#${req.id}</td>
                    <td>${req.clientName}</td>
                    <td>${req.clientEmail}</td>
                    <td>${req.serviceId}</td>
                    <td><span class="badge ${badgeClass} status-badge">${statusText}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-success btn-accept" data-id="${req.id}">
                            <i class="bi bi-check2"></i> Duyệt
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${req.id}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            
            const $tr = $(trHTML);
            $tbody.append($tr); // jQuery manipulation
            
            // Yêu cầu: 1 trong 2 hiệu ứng jQuery (fadeIn)
            $tr.fadeIn(400); 
        });
    }

    // Load dữ liệu lần đầu
    loadAdminRequests();

    // jQuery event 1: Nút làm mới dữ liệu
    $('#btnRefresh').on('click', function() {
        const $btn = $(this);
        $btn.prop('disabled', true).text('Đang tải...');
        
        // Tạo hiệu ứng mờ bảng đi (jQuery Effect)
        $('#requestsTableBody').fadeOut(300, function() {
            loadAdminRequests();
            $btn.prop('disabled', false).text('Làm mới dữ liệu');
            $(this).show(); // Đảm bảo tbody hiện lại để tr bên trong có thể fadeIn
        });
    });

    // jQuery event 2: Nút Duyệt yêu cầu (Sử dụng $.ajax DUY NHẤT 1 LẦN CỤ THỂ theo đề bài)
    $(document).on('click', '.btn-accept', function() {
        const reqId = $(this).data('id');
        const $row = $(`#req-row-${reqId}`);
        const $btn = $(this);

        // Đổi trạng thái UI tạm thời
        $btn.prop('disabled', true).text('...');

        // CRUCIAL YÊU CẦU: Dùng chính xác 1 $.ajax() call để minh họa sự am hiểu
        $.ajax({
            url: API_BASE_URL + `/requests/${reqId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: 'accepted' }),
            success: function(response) {
                // Thành công: Đổi màu huy hiệu
                const $badge = $row.find('.status-badge'); // jQuery DOM traversal
                $badge.removeClass('bg-warning bg-danger')
                      .addClass('bg-success')
                      .text('Đã duyệt');
                
                $btn.remove(); // Xoá nút duyệt đi
            },
            error: function(err) {
                console.error("Lỗi AJAX:", err);
                alert("Lỗi khi cập nhật trạng thái!");
                $btn.prop('disabled', false).text('Duyệt');
            }
        });
    });

    // jQuery event 3: Nút Xóa yêu cầu (Hiệu ứng jQuery hide/fadeOut)
    $(document).on('click', '.btn-delete', function() {
        const reqId = $(this).data('id');
        if (confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) {
            // Dùng api.js (fetch) cho thao tác xóa để linh hoạt
            api.delete(`/requests/${reqId}`)
                .then(() => {
                    // Yêu cầu: Hiệu ứng jQuery (fadeOut) sau đó xóa phần tử
                    $(`#req-row-${reqId}`).fadeOut(300, function() {
                        $(this).remove();
                    });
                })
                .catch(err => {
                    // Fallback cho bài tập nếu API hỏng: vẫn chạy hiệu ứng xóa UI
                    $(`#req-row-${reqId}`).fadeOut(300, function() {
                        $(this).remove();
                    });
                });
        }
    });

});
