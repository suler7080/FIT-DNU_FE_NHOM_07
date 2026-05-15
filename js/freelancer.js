/**
 * FREELANCER.JS - Xử lý logic cho Freelancer Dashboard
 * Yêu cầu: Dùng Vanilla JS để fetch data.
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.checkAuth('freelancer')) return;

    const currentUser = Auth.getCurrentUser();
    let allProjects = [];       // Tất cả dự án từ DB
    let allOpenProjects = [];   // Chỉ chứa các dự án Open (dùng để sort, paginate)
    
    // Pagination state
    let currentPage = 1;
    const itemsPerPage = 3;

    // 1. Tải danh sách các dự án đang 'open' (Task 2 & 3)
    function loadOpenProjects() {
        api.get('/jobs')
            .then(projects => {
                allProjects = projects;
                allOpenProjects = projects.filter(p => p.status === 'approved'); // Task 4: Chỉ hiện dự án đã duyệt
                
                // Chạy thuật toán Smart Matching ngay khi load xong dữ liệu
                renderRecommendedProjects(allOpenProjects);

                // Render mảng chính (có phân trang)
                renderPaginatedProjects();
            })
            .catch(err => {
                console.error('Lỗi tải dự án:', err);
                document.getElementById('freelancerProjectsContainer').innerHTML = '<div class="text-danger text-center">Lỗi tải dữ liệu.</div>';
            });
    }

    // 1b. Smart Matching Algorithm (Task 2)
    function renderRecommendedProjects(openProjects) {
        const freelancerSkills = currentUser.skills ? currentUser.skills.toLowerCase().split(',').map(s => s.trim()) : [];
        if (freelancerSkills.length === 0) return; // Nếu ko có kỹ năng, bỏ qua gợi ý

        // Tính điểm Matching Score
        const scoredProjects = openProjects.map(project => {
            const reqSkills = project.requiredSkills ? project.requiredSkills.toLowerCase().split(',').map(s => s.trim()) : [];
            let score = 0;
            freelancerSkills.forEach(fs => {
                if (reqSkills.includes(fs)) score++;
            });
            return { ...project, matchScore: score };
        });

        // Sort giảm dần theo điểm và lấy Top 3
        const topMatches = scoredProjects
            .filter(p => p.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3);

        const recSection = document.getElementById('recommendedProjectsSection');
        const recContainer = document.getElementById('recommendedProjectsContainer');
        
        if (topMatches.length > 0) {
            recSection.classList.remove('d-none');
            recContainer.innerHTML = '';
            topMatches.forEach(p => {
                const cardHtml = `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 border-success border-opacity-50 shadow-sm">
                            <div class="card-body p-3 d-flex flex-column">
                                <div class="mb-2"><span class="badge bg-success">Match Score: ${p.matchScore}</span></div>
                                <h6 class="fw-bold text-dark">${p.title}</h6>
                                <p class="text-primary fw-bold mb-2">${Utils.formatCurrency(p.budget)}</p>
                                <button class="btn btn-sm btn-outline-success mt-auto btn-open-bid-modal" 
                                    data-id="${p.id}" data-title="${p.title}" data-budget="${Utils.formatCurrency(p.budget)}">
                                    Báo giá ngay
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                recContainer.innerHTML += cardHtml;
            });
            attachModalEvents(recContainer);
        }
    }

    // 1c. Hàm render có phân trang
    function renderPaginatedProjects() {
        const paginationResult = Utils.paginateArray(allOpenProjects, currentPage, itemsPerPage);
        renderOpenProjects(paginationResult.paginatedItems);
        Utils.renderPagination('projectsPagination', paginationResult.currentPage, paginationResult.totalPages, (newPage) => {
            currentPage = newPage;
            renderPaginatedProjects();
        });
    }

    // Dynamic Sorting (Task 3)
    const sortSelect = document.getElementById('sortBudgetSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortType = e.target.value;
            if (sortType === 'asc') {
                allOpenProjects.sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget));
            } else if (sortType === 'desc') {
                allOpenProjects.sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget));
            } else {
                // Sắp xếp mặc định theo ID (coi như mới nhất)
                allOpenProjects.sort((a, b) => a.id - b.id);
            }
            currentPage = 1; // Reset về trang 1
            renderPaginatedProjects();
        });
    }

    function renderOpenProjects(projects) {
        const container = document.getElementById('freelancerProjectsContainer');
        container.innerHTML = '';

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <h5>Không tìm thấy dự án</h5>
                        <p>Hiện chưa có dự án nào đang mở. Vui lòng quay lại sau!</p>
                    </div>
                </div>`;
            return;
        }

        projects.forEach((p, idx) => {
            const skillsHtml = p.requiredSkills 
                ? p.requiredSkills.split(',').map(s => `<span class="badge bg-secondary bg-opacity-10 text-dark border me-1">${s.trim()}</span>`).join('') 
                : '';

            const deadline = p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : 'Chưa xác định';
            const scope = p.detailedScope || 'Chưa có mô tả chi tiết cho dự án này.';
            const attachmentsHtml = p.attachments 
                ? `<a href="${p.attachments}" target="_blank" class="text-primary fw-semibold"><i class="bi bi-link-45deg"></i> Xem tệp đính kèm</a>` 
                : '<span class="text-muted small">Không có tệp đính kèm</span>';

            const collapseId = `projectDetails-${p.id}-${idx}`;

            const cardHTML = `
                <div class="card mb-3 border-0 bg-white shadow-sm rounded-4">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start flex-wrap">
                            <div class="flex-grow-1 me-lg-4 mb-3 mb-lg-0" style="flex-basis: 60%;">
                                <h5 class="fw-bold text-primary mb-1">${p.title}</h5>
                                <p class="text-muted small mb-2">${p.description}</p>
                                <div class="mb-3">${skillsHtml}</div>
                                
                                <button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                    <i class="bi bi-info-circle me-1"></i> Xem chi tiết dự án
                                </button>
                                
                                <div class="collapse mt-3" id="${collapseId}">
                                    <div class="card card-body bg-light border-0 rounded-4 p-4">
                                        <h6 class="fw-bold text-dark mb-2">Phạm vi công việc (Scope):</h6>
                                        <p class="small text-muted mb-4" style="white-space: pre-wrap;">${scope}</p>
                                        
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-calendar-event me-1"></i> Hạn chót (Deadline)</h6>
                                                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger">${deadline}</span>
                                            </div>
                                            <div class="col-md-6">
                                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-paperclip me-1"></i> Tài liệu đính kèm</h6>
                                                ${attachmentsHtml}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-lg-end text-start mt-3 mt-lg-0" style="min-width: 200px;">
                                <h4 class="fw-bold text-dark mb-3">${Utils.formatCurrency(p.budget)}</h4>
                                <button class="btn btn-primary fw-bold px-4 py-2 w-100 rounded-pill shadow-sm btn-open-bid-modal" 
                                    data-id="${p.id}" 
                                    data-title="${p.title}" 
                                    data-budget="${Utils.formatCurrency(p.budget)}">
                                    <i class="bi bi-send me-2"></i>Gửi Báo Giá
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        // Gắn sự kiện mở modal Bid cho container chính
        attachModalEvents(document.getElementById('freelancerProjectsContainer'));
    }

    // Hàm đính kèm sự kiện click mở modal
    function attachModalEvents(container) {
        container.querySelectorAll('.btn-open-bid-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.getAttribute('data-id');
                const projectTitle = e.currentTarget.getAttribute('data-title');
                const projectBudget = e.currentTarget.getAttribute('data-budget');
                
                document.getElementById('bidProjectId').value = projectId;
                document.getElementById('bidProjectTitle').textContent = projectTitle;
                document.getElementById('bidProjectBudget').textContent = `Ngân sách dự kiến: ${projectBudget}`;
                
                const modal = new bootstrap.Modal(document.getElementById('submitBidModal'));
                modal.show();
            });
        });
    }

    // 2. Xử lý Gửi Báo Giá (Bid) (Task 2)
    const submitBidForm = document.getElementById('submitBidForm');
    if (submitBidForm) {
        submitBidForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btnSubmitBid');
            btn.disabled = true;
            btn.innerHTML = 'Đang gửi...';

            const newBid = {
                projectId: document.getElementById('bidProjectId').value,
                freelancerId: currentUser.id,
                price: document.getElementById('bidPrice').value,
                message: document.getElementById('bidMessage').value.trim(),
                status: 'pending' // Mặc định là pending khi gửi
            };

            api.post('/bids', newBid)
                .then(response => {
                    alert('Gửi Báo Giá thành công!');
                    submitBidForm.reset();
                    const modalEl = document.getElementById('submitBidModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    modalInstance.hide();
                    
                    // Cập nhật lại danh sách Bids của tôi
                    loadMyBids();
                })
                .catch(err => {
                    console.error('Lỗi khi gửi bid:', err);
                    alert('Đã xảy ra lỗi khi gửi báo giá.');
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi Bid';
                });
        });
    }

    // 3. Tải danh sách Bids của Freelancer
    function loadMyBids() {
        const tbody = document.getElementById('freelancerBidsTableBody');
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải...</td></tr>';

        api.get('/bids')
            .then(bids => {
                const myBids = bids.filter(b => b.freelancerId === currentUser.id);
                renderMyBids(myBids);
            })
            .catch(err => {
                console.error('Lỗi tải bids:', err);
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Lỗi tải dữ liệu.</td></tr>';
            });
    }

    function renderMyBids(myBids) {
        const tbody = document.getElementById('freelancerBidsTableBody');
        tbody.innerHTML = '';

        if (myBids.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            <i class="bi bi-file-earmark-x"></i>
                            <h5>Chưa có báo giá nào</h5>
                            <p>Bạn chưa gửi báo giá (Bid) cho dự án nào. Hãy quay lại mục "Tìm Dự Án" để bắt đầu!</p>
                            <a href="#find-projects" data-bs-toggle="tab" class="btn btn-outline-primary" onclick="document.querySelector('.nav-link[href=\\'#find-projects\\']').click()">Tìm Dự Án Ngay</a>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        myBids.forEach(bid => {
            // Cố gắng tìm tên dự án từ mảng allProjects đã tải ở loadOpenProjects()
            // Nếu không có, gọi riêng API cho dự án đó (trong bài này để đơn giản ta dùng id hoặc chờ allProjects load xong)
            const project = allProjects.find(p => String(p.id) === String(bid.projectId));
            const title = project ? project.title : `Dự án #${bid.projectId}`;

            let statusBadge = '';
            if (bid.status === 'pending') statusBadge = '<span class="badge bg-warning text-dark border border-warning">Đang chờ</span>';
            else if (bid.status === 'accepted') statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success">Đã trúng thầu</span>';
            else statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Bị từ chối</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold text-primary">${title}</td>
                <td class="fw-bold">${Utils.formatCurrency(bid.price)}</td>
                <td class="small text-muted">${bid.message}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 4. Handle Create New Service (Task 2)
    const addServiceForm = document.getElementById('addServiceForm');
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSaveFreelancerService');
            btn.disabled = true;
            btn.innerHTML = 'Đang gửi...';

            const newService = {
                title: document.getElementById('fs_title').value.trim(),
                category: document.getElementById('fs_category').value,
                price: document.getElementById('fs_price').value,
                image: document.getElementById('fs_image').value.trim() || 'https://via.placeholder.com/400x200?text=No+Image',
                description: document.getElementById('fs_description').value.trim(),
                freelancerId: currentUser.id,
                status: 'pending' // CRITICAL: Mặc định pending chờ Admin duyệt
            };

            api.post('/services', newService)
                .then(response => {
                    alert('Đã gửi dịch vụ thành công! Đang chờ Admin xét duyệt.');
                    addServiceForm.reset();
                    const modalEl = document.getElementById('addServiceModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modalInstance.hide();
                })
                .catch(err => {
                    console.error('Lỗi khi tạo dịch vụ:', err);
                    alert('Có lỗi xảy ra: ' + err.message);
                })
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Gửi Duyệt';
                });
        });
    }

    // 5. Load My Services (Task 1)
    window.loadMyServices = function() {
        const tbody = document.getElementById('myServicesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Đang tải...</td></tr>';
        
        api.get('/services')
            .then(data => {
                const myServices = data.filter(s => s.freelancerId === currentUser.id);
                if (myServices.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Bạn chưa đăng dịch vụ nào</td></tr>';
                    return;
                }
                
                tbody.innerHTML = '';
                myServices.forEach(s => {
                    let badgeClass = 'bg-warning text-dark border-warning';
                    let statusText = 'Đang chờ duyệt';
                    
                    if (s.status === 'approved') {
                        badgeClass = 'bg-success text-white border-success';
                        statusText = 'Đã duyệt';
                    } else if (s.status === 'rejected') {
                        badgeClass = 'bg-danger text-white border-danger';
                        statusText = 'Từ chối';
                    }
                    
                    const price = parseFloat(s.price) || 0;
                    
                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-primary">${s.title}</td>
                            <td>${s.category || 'N/A'}</td>
                            <td class="fw-semibold text-success">${price.toLocaleString('vi-VN')} VNĐ</td>
                            <td><span class="badge ${badgeClass} border">${statusText}</span></td>
                        </tr>
                    `;
                });
            })
            .catch(err => {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
            });
    };

    // 6. DUYỆT DỰ ÁN ĐANG LÀM & BÀN GIAO (Task 1 & 3)
    // ===============================================
    function loadMyActiveJobs() {
        const tbody = document.getElementById('freelancerActiveJobsTableBody');
        if (!tbody) return;

        api.get('/jobs')
            .then(jobs => {
                // Lọc dự án đang làm (in-progress hoặc delivered) và mình là freelancer được chọn
                const myActiveJobs = jobs.filter(j => 
                    (j.status === 'in-progress' || j.status === 'delivered') && 
                    String(j.freelancerId) === String(currentUser.id)
                );
                renderActiveJobs(myActiveJobs);
            });
    }

    function renderActiveJobs(jobs) {
        const tbody = document.getElementById('freelancerActiveJobsTableBody');
        tbody.innerHTML = '';

        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Bạn chưa có dự án nào đang thực hiện.</td></tr>';
            return;
        }

        jobs.forEach(j => {
            let statusBadge = '';
            let actionBtn = '';

            if (j.status === 'in-progress') {
                statusBadge = '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary">Đang thực hiện</span>';
                actionBtn = `<button class="btn btn-sm btn-success btn-deliver-modal" data-id="${j.id}">
                                <i class="bi bi-box-seam me-1"></i> Bàn Giao
                             </button>`;
            } else if (j.status === 'delivered') {
                statusBadge = '<span class="badge bg-info bg-opacity-10 text-info border border-info">Đã bàn giao - Chờ duyệt</span>';
                actionBtn = `<button class="btn btn-sm btn-outline-secondary" disabled>Chờ nghiệm thu</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">${j.title}</td>
                <td>${j.clientName || 'Khách hàng'}</td>
                <td>${j.deadline || 'Chưa có'}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        // Event for Delivery Modal
        tbody.querySelectorAll('.btn-deliver-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('deliverProjectId').value = e.currentTarget.getAttribute('data-id');
                const modal = new bootstrap.Modal(document.getElementById('deliverWorkModal'));
                modal.show();
            });
        });
    }



    // 7. LỊCH SỬ HOÀN THÀNH (Task 3)
    function loadCompletedJobs() {
        const tbody = document.getElementById('freelancerCompletedJobsTableBody');
        if (!tbody) return;

        api.get('/jobs')
            .then(jobs => {
                const completedJobs = jobs.filter(j => 
                    j.status === 'completed' && 
                    String(j.freelancerId) === String(currentUser.id)
                );
                
                tbody.innerHTML = '';
                if (completedJobs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dự án hoàn thành.</td></tr>';
                    return;
                }

                completedJobs.forEach(j => {
                    tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold">${j.title}</td>
                            <td>${j.clientName || 'Khách hàng'}</td>
                            <td>${new Date(j.deliveredAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                            <td><span class="badge bg-success">Hoàn tất</span></td>
                        </tr>
                    `;
                });
            });
    }

    // 8. QUẢN LÝ YÊU CẦU TỪ KHÁCH (Task 2 & 3)
    // ==========================================
    window.loadClientRequests = function() {
        const tbody = document.getElementById('clientRequestsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải dữ liệu...</td></tr>';

        // B1: Lấy tất cả dịch vụ để lọc ra ID của mình
        Promise.all([
            api.get('/services'),
            api.get('/requests')
        ]).then(([services, requests]) => {
            const safeServices = Array.isArray(services) ? services : [];
            const safeRequests = Array.isArray(requests) ? requests : [];

            const myServiceIds = safeServices
                .filter(s => String(s.freelancerId) === String(currentUser.id))
                .map(s => String(s.id));

            // B2: Lọc yêu cầu (requests) thuộc về dịch vụ của mình
            const myRequests = safeRequests.filter(r => myServiceIds.includes(String(r.serviceId)));
            
            renderClientRequests(myRequests, safeServices);
        }).catch(err => {
            console.error("Lỗi tải Client Requests:", err);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Lỗi kết nối API /services hoặc /requests. Kiểm tra MockAPI!</td></tr>';
        });
    };

    function renderClientRequests(requests, services) {
        const tbody = document.getElementById('clientRequestsTableBody');
        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có yêu cầu thuê dịch vụ nào.</td></tr>';
            return;
        }

        requests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(req => {
            const service = services.find(s => String(s.id) === String(req.serviceId));
            const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;

            let statusBadge = '';
            let actionButtons = '';

            if (req.status === 'pending') {
                statusBadge = '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-success btn-accept-request" data-id="${req.id}">Nhận việc</button>
                    <button class="btn btn-sm btn-outline-danger btn-reject-request" data-id="${req.id}">Từ chối</button>
                `;
            } else if (req.status === 'accepted') {
                statusBadge = '<span class="badge bg-success">Đang làm</span>';
                actionButtons = `
                    <button class="btn btn-sm btn-primary btn-deliver-request" data-id="${req.id}">Bàn giao</button>
                `;
            } else if (req.status === 'delivered') {
                statusBadge = '<span class="badge bg-info">Chờ nghiệm thu</span>';
            } else if (req.status === 'completed') {
                statusBadge = '<span class="badge bg-secondary">Hoàn tất</span>';
            } else if (req.status === 'rejected') {
                statusBadge = '<span class="badge bg-danger">Đã từ chối</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-muted small">#${req.id}</td>
                <td class="fw-bold">${req.clientName || 'Khách hàng'}</td>
                <td>${serviceTitle}</td>
                <td class="text-primary fw-bold">${Utils.formatCurrency(req.proposedBudget || 0)}</td>
                <td class="small text-muted">${req.message || ''}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });

        // Gắn sự kiện cho các nút
        tbody.querySelectorAll('.btn-accept-request').forEach(btn => {
            btn.addEventListener('click', (e) => handleRequestAction(e.target.dataset.id, 'accepted'));
        });
        tbody.querySelectorAll('.btn-reject-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm('Bạn chắc chắn muốn từ chối yêu cầu này?')) {
                    handleRequestAction(e.target.dataset.id, 'rejected');
                }
            });
        });
        tbody.querySelectorAll('.btn-deliver-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('deliverProjectId').value = e.target.dataset.id;
                // Đánh dấu đây là request thay vì project (job)
                document.getElementById('deliverProjectId').dataset.type = 'request';
                new bootstrap.Modal(document.getElementById('deliverWorkModal')).show();
            });
        });
    }

    // Xử lý form bàn giao chung (dùng cho cả Project và Request)
    const deliverForm = document.getElementById('deliverWorkForm');
    if (deliverForm) {
        deliverForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('deliverProjectId').value;
            const type = document.getElementById('deliverProjectId').dataset.type;
            const link = document.getElementById('deliveryLink').value;
            const note = document.getElementById('deliveryNote').value;
            const btn = document.getElementById('btnConfirmDelivery');

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';

            const payload = {
                status: 'delivered',
                deliveryLink: link,
                deliveryNote: note,
                deliveredAt: new Date().toISOString()
            };

            const endpoint = type === 'request' ? `/requests/${id}` : `/jobs/${id}`;

            api.put(endpoint, payload)
                .then(() => {
                    alert('Bàn giao sản phẩm thành công!');
                    bootstrap.Modal.getInstance(document.getElementById('deliverWorkModal')).hide();
                    deliverForm.reset();
                    if (type === 'request') loadClientRequests();
                    else loadMyActiveJobs();
                })
                .catch(err => alert('Lỗi: ' + err.message))
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = 'Xác Nhận Bàn Giao';
                });
        });
    }

    function handleRequestAction(id, status) {
        api.put(`/requests/${id}`, { status: status })
            .then(() => {
                alert(status === 'accepted' ? 'Đã nhận việc thành công!' : 'Đã từ chối yêu cầu.');
                loadClientRequests();
            })
            .catch(err => alert('Lỗi: ' + err.message));
    }

    // Khởi chạy khi load trang
    loadOpenProjects();
    loadMyServices();
    loadMyActiveJobs();
    loadCompletedJobs();
    loadClientRequests();
    
    // Gọi lại loadMyBids sau 1s để đảm bảo loadOpenProjects đã lấy được allProjects để map tên
    setTimeout(loadMyBids, 500); 
});
