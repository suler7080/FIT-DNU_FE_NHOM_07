/**
 * FREELANCER.JS - Diagnostic & Type-Safe Version
 * Khắc phục lỗi N+1 và Silent Failure do ép kiểu dữ liệu
 */

// GLOBAL STATE (In-memory Cache)
let cachedJobs = [];
let cachedUsers = [];
let cachedBids = [];
let cachedServices = [];
let cachedRequests = [];

const currentUser = Auth.getCurrentUser();

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.checkAuth('freelancer')) return;
    initDashboard();
    setupFormListeners();

    // Lắng nghe sự kiện cập nhật ví để đồng bộ dashboard
    window.addEventListener('walletUpdate', (e) => {
        if (currentUser && String(e.detail.userId) === String(currentUser.id)) {
            renderStatCards();
        }
    });
});

/**
 * INITIALIZATION WITH MRI LOGGING
 */
async function initDashboard() {
    console.log("--- Dashboard Initialization Started ---");
    showLoading(true);

    try {
        const [jobs, users, bids, services, requests] = await Promise.all([
            api.get('/jobs'),
            api.get('/users'),
            api.get('/bids'),
            api.get('/services'),
            api.get('/requests')
        ]);

        // Gán dữ liệu vào Cache
        cachedJobs = Array.isArray(jobs) ? jobs : [];
        cachedUsers = Array.isArray(users) ? users : [];
        cachedBids = Array.isArray(bids) ? bids : [];
        cachedServices = Array.isArray(services) ? services : [];
        cachedRequests = Array.isArray(requests) ? requests : [];

        console.log("Data loaded, starting initial render...");

        // KÍCH HOẠT HIỂN THỊ DỮ LIỆU
        refreshAllSections();

    } catch (err) {
        console.error('Rendering Error - Dashboard Init Failed:', err);
        const container = document.getElementById('freelancerProjectsContainer');
        if (container) container.innerHTML = `<div class="alert alert-danger">Lỗi nạp dữ liệu: ${err.message}</div>`;
    } finally {
        // HÀNH ĐỘNG QUAN TRỌNG: ẨN SPINNER VÀ HIỂN THỊ UI
        showLoading(false);
        console.log("--- Dashboard Initialization Finished ---");
    }
}

function refreshAllSections() {
    updateProfileSidebar(); // Inject sidebar data
    renderStatCards();      // Inject summary stats
    renderFindProjects();
    renderMyBids();
    renderMyActiveJobs();
    renderMyServices();
    renderClientRequests();
}

function renderStatCards() {
    const myBids = cachedBids.filter(b => String(b.freelancerId) === String(currentUser.id));
    const myJobs = cachedJobs.filter(j => String(j.freelancerId) === String(currentUser.id));
    
    const myServiceIds = cachedServices.filter(s => String(s.freelancerId) === String(currentUser.id)).map(s => String(s.id));
    const myRequests = cachedRequests.filter(r => myServiceIds.includes(String(r.serviceId)));

    const bidsSent = myBids.length;
    const bidsAccepted = myBids.filter(b => b.status === 'accepted').length;
    
    const activeJobs = myJobs.filter(j => ['in-progress', 'delivered', 'revision_requested', 'disputed'].includes(j.status)).length +
                       myRequests.filter(r => ['accepted', 'delivered', 'revision_requested', 'disputed'].includes(r.status)).length;
    
    const jobEarnings = myJobs
        .filter(j => j.status === 'completed')
        .reduce((sum, j) => sum + parseFloat(j.budget || 0), 0);
        
    const requestEarnings = myRequests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + parseFloat(r.proposedBudget || 0), 0);
        
    const totalEarnings = jobEarnings + requestEarnings;

    const walletBalance = Wallet.getBalance(currentUser.id, 'freelancer');

    document.getElementById('statBidsSent').textContent = bidsSent;
    document.getElementById('statBidsAccepted').textContent = bidsAccepted;
    document.getElementById('statActiveJobs').textContent = activeJobs;
    document.getElementById('statWalletBalance').textContent = Utils.formatCurrency(walletBalance);
    document.getElementById('statTotalEarnings').textContent = Utils.formatCurrency(totalEarnings);
}

/**
 * UI BINDING: Cập nhật thông tin Sidebar từ currentUser
 */
function updateProfileSidebar() {
    // Inject name
    const nameEl = document.getElementById('freelancerNameDisplay')
                 || document.getElementById('sidebarUserName') 
                 || document.querySelector('.sidebar-username');
    if (nameEl) nameEl.textContent = currentUser.name || 'Freelancer';

    // Inject skills
    const skillsEl = document.getElementById('freelancerSkillsDisplay')
                   || document.getElementById('sidebarUserSkills')
                   || document.querySelector('.sidebar-skills');
    if (skillsEl) skillsEl.textContent = currentUser.skills || 'Chưa cập nhật kỹ năng';

    // Inject avatar initial (Nếu có element hỗ trợ)
    const avatarEl = document.getElementById('sidebarAvatar')
                   || document.querySelector('.sidebar-avatar-initial');
    if (avatarEl && currentUser.name) {
        avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

/**
 * TASK 2: TYPE COERCION FIXES IN ALL FILTERS
 */

function renderFindProjects() {
    const container = document.getElementById('freelancerProjectsContainer');
    const recContainer = document.getElementById('recommendedProjectsContainer');
    if (!container) return;

    const safeJobs = Array.isArray(cachedJobs) ? cachedJobs : [];
    // Chỉ lấy dự án status là approved/open
    const openProjects = safeJobs.filter(j => j.status === 'approved' || j.status === 'open');

    const freelancerSkills = (currentUser.skills || '').toLowerCase().split(',').map(s => s.trim());
    
    const scoredProjects = openProjects.map(p => {
        const reqSkills = (p.requiredSkills || '').toLowerCase().split(',').map(s => s.trim());
        let score = 0;
        freelancerSkills.forEach(fs => { if (fs && reqSkills.includes(fs)) score++; });
        return { ...p, matchScore: score };
    });

    const topMatches = scoredProjects.filter(p => p.matchScore > 0).sort((a,b) => b.matchScore - a.matchScore).slice(0, 3);

    if (recContainer) {
        recContainer.innerHTML = '';
        topMatches.forEach(p => {
            recContainer.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 border-success border-opacity-50 shadow-sm">
                        <div class="card-body p-3 d-flex flex-column">
                            <div class="mb-2"><span class="badge bg-success">Match: ${p.matchScore}</span></div>
                            <h6 class="fw-bold text-dark text-truncate">${p.title}</h6>
                            <p class="text-primary fw-bold mb-2">${Utils.formatCurrency(p.budget)}</p>
                            <button class="btn btn-sm btn-outline-success mt-auto btn-open-bid-modal" data-id="${p.id}" data-title="${p.title}" data-budget="${Utils.formatCurrency(p.budget)}">Báo giá</button>
                        </div>
                    </div>
                </div>`;
        });
    }

    container.innerHTML = '';
    if (openProjects.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted"><h5>Không có dự án mới nào khả dụng.</h5></div>';
        return;
    }

    openProjects.forEach((p, idx) => {
        const skillsHtml = (p.requiredSkills || '').split(',').filter(s => s.trim()).map(s => `<span class="badge bg-secondary bg-opacity-10 text-dark border me-1">${s.trim()}</span>`).join('');
        const collapseId = `details-${p.id}-${idx}`;
        
        container.innerHTML += `
            <div class="card mb-3 border-0 bg-white shadow-sm rounded-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start flex-wrap">
                        <div class="flex-grow-1 me-lg-4 mb-3">
                            <h5 class="fw-bold text-primary mb-1">${p.title}</h5>
                            <p class="text-muted small mb-2">${p.description || ''}</p>
                            <div class="mb-3">${skillsHtml}</div>
                            <button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">Xem chi tiết</button>
                            <div class="collapse mt-3" id="${collapseId}">
                                <div class="card card-body bg-light border-0 rounded-4 p-4 small">
                                    <p>${p.detailedScope || 'Không có mô tả chi tiết.'}</p>
                                    <div class="row g-2 mt-2">
                                        <div class="col-6"><strong>Hạn chót:</strong> ${p.deadline || 'N/A'}</div>
                                        <div class="col-6"><strong>Tài liệu:</strong> <a href="${p.attachments || '#'}" target="_blank">Xem tệp</a></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-lg-end" style="min-width: 180px;">
                            <h4 class="fw-bold text-dark mb-3">${Utils.formatCurrency(p.budget)}</h4>
                            <button class="btn btn-primary fw-bold px-4 py-2 w-100 rounded-pill btn-open-bid-modal" data-id="${p.id}" data-title="${p.title}" data-budget="${Utils.formatCurrency(p.budget)}">Gửi Báo Giá</button>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    attachBidEvents(container);
    if(recContainer) attachBidEvents(recContainer);
}

function renderMyBids() {
    const tbody = document.getElementById('freelancerBidsTableBody');
    if (!tbody) return;

    const safeBids = Array.isArray(cachedBids) ? cachedBids : [];
    // FIX: Sử dụng String() để so sánh IDs
    const myBids = safeBids.filter(b => String(b.freelancerId) === String(currentUser.id));
    
    tbody.innerHTML = '';
    if (!myBids.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Bạn chưa gửi báo giá nào.</td></tr>';
        return;
    }

    myBids.forEach(bid => {
        const project = Array.isArray(cachedJobs) ? cachedJobs.find(j => String(j.id) === String(bid.projectId)) : null;
        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold text-primary">${project ? project.title : `Dự án #${bid.projectId}`}</td>
                <td class="fw-bold">${Utils.formatCurrency(bid.price)}</td>
                <td class="small text-muted">${bid.message || ''}</td>
                <td>${getStatusBadge(bid.status)}</td>
            </tr>`;
    });
}

function renderMyActiveJobs() {
    const tbody = document.getElementById('freelancerActiveJobsTableBody');
    const completedTbody = document.getElementById('freelancerCompletedJobsTableBody');
    if (!tbody) return;

    const safeJobs = Array.isArray(cachedJobs) ? cachedJobs : [];
    // FIX: So sánh freelancerId bằng String()
    const myActiveJobs = safeJobs.filter(j => 
        ['in-progress', 'delivered', 'revision_requested', 'disputed'].includes(j.status) && 
        String(j.freelancerId) === String(currentUser.id)
    );

    tbody.innerHTML = myActiveJobs.length ? '' : '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có dự án nào đang làm.</td></tr>';

    myActiveJobs.forEach(j => {
        let statusBadge = '';
        let actionBtn = '';
        let revisionNotesHtml = '';

        if (j.status === 'in-progress') {
            statusBadge = '<span class="badge bg-primary bg-opacity-10 text-primary border">Đang làm</span>';
            actionBtn = `<button class="btn btn-sm btn-success btn-deliver-modal" data-id="${j.id}">Bàn Giao</button>`;
        } else if (j.status === 'delivered') {
            statusBadge = '<span class="badge bg-info bg-opacity-10 text-info border">Đã bàn giao</span>';
            actionBtn = `
                <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-outline-secondary" disabled>Chờ nghiệm thu</button>
                    <button class="btn btn-sm btn-outline-danger btn-dispute-project" data-id="${j.id}" data-type="job" title="Khiếu nại Admin"><i class="bi bi-shield-slash"></i> Khiếu nại</button>
                </div>
            `;
        } else if (j.status === 'revision_requested') {
            statusBadge = '<span class="badge bg-warning text-dark border border-warning">Yêu cầu sửa lại</span>';
            revisionNotesHtml = `<div class="text-warning small mt-1"><b>Yêu cầu:</b> ${j.revisionInstructions || 'N/A'}</div>`;
            actionBtn = `
                <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-warning text-dark btn-deliver-modal" data-id="${j.id}">Nộp lại</button>
                    <button class="btn btn-sm btn-outline-danger btn-dispute-project" data-id="${j.id}" data-type="job" title="Khiếu nại Admin"><i class="bi bi-shield-slash"></i> Khiếu nại</button>
                </div>
            `;
        } else if (j.status === 'disputed') {
            statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Tranh chấp</span>';
            actionBtn = `<span class="text-muted small">Đang phân xử</span>`;
        }
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">
                    ${j.title}
                    ${revisionNotesHtml}
                </td>
                <td>${j.clientName || 'N/A'}</td>
                <td>${j.deadline || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionBtn}</td>
            </tr>`;
    });

    if (completedTbody) {
        const myCompleted = safeJobs.filter(j => j.status === 'completed' && String(j.freelancerId) === String(currentUser.id));
        completedTbody.innerHTML = myCompleted.length ? '' : '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có lịch sử.</td></tr>';
        myCompleted.forEach(j => {
            completedTbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${j.title}</td>
                    <td>${j.clientName || 'N/A'}</td>
                    <td>${new Date(j.deliveredAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                    <td><span class="badge bg-success">Hoàn tất</span></td>
                </tr>`;
        });
    }

    tbody.querySelectorAll('.btn-deliver-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('deliverProjectId').value = e.currentTarget.dataset.id;
            document.getElementById('deliverProjectId').dataset.type = 'job';
            new bootstrap.Modal(document.getElementById('deliverWorkModal')).show();
        });
    });
}

function renderMyServices() {
    const tbody = document.getElementById('myServicesTableBody');
    if (!tbody) return;

    const safeServices = Array.isArray(cachedServices) ? cachedServices : [];
    const myServices = safeServices.filter(s => String(s.freelancerId) === String(currentUser.id));
    
    tbody.innerHTML = myServices.length ? '' : '<tr><td colspan="4" class="text-center text-muted py-3">Chưa đăng dịch vụ nào.</td></tr>';

    myServices.forEach(s => {
        const statusMap = {
            'pending': { class: 'bg-warning text-dark', text: 'Chờ duyệt' },
            'approved': { class: 'bg-success text-white', text: 'Đã duyệt' },
            'rejected': { class: 'bg-danger text-white', text: 'Từ chối' }
        };
        const st = statusMap[s.status] || statusMap.pending;
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-primary">${s.title}</td>
                <td>${s.category || ''}</td>
                <td class="fw-semibold text-success">${Utils.formatCurrency(s.price || 0)}</td>
                <td><span class="badge ${st.class} border">${st.text}</span></td>
            </tr>`;
    });
}

function renderClientRequests() {
    const tbody = document.getElementById('clientRequestsTableBody');
    if (!tbody) return;

    const safeServices = Array.isArray(cachedServices) ? cachedServices : [];
    const safeRequests = Array.isArray(cachedRequests) ? cachedRequests : [];

    const myServiceIds = safeServices
        .filter(s => String(s.freelancerId) === String(currentUser.id))
        .map(s => String(s.id));

    const myRequests = safeRequests.filter(r => myServiceIds.includes(String(r.serviceId)));
    
    tbody.innerHTML = myRequests.length ? '' : '<tr><td colspan="7" class="text-center text-muted py-4">Chưa có yêu cầu nào.</td></tr>';

    myRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(req => {
        const service = safeServices.find(s => String(s.id) === String(req.serviceId));
        const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;

        let statusBadge = '';
        let actionButtons = '';
        let revisionNotesHtml = '';

        if (req.status === 'pending') {
            statusBadge = '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
            actionButtons = `
                <button class="btn btn-sm btn-success btn-accept-request" data-id="${req.id}">Nhận việc</button>
                <button class="btn btn-sm btn-outline-danger btn-reject-request" data-id="${req.id}">Từ chối</button>`;
        } else if (req.status === 'accepted') {
            statusBadge = '<span class="badge bg-primary text-white">Đang làm</span>';
            actionButtons = `<button class="btn btn-sm btn-primary btn-deliver-modal-req" data-id="${req.id}">Bàn giao</button>`;
        } else if (req.status === 'delivered') {
            statusBadge = '<span class="badge bg-info bg-opacity-10 text-info border">Đã bàn giao</span>';
            actionButtons = `
                <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-outline-secondary" disabled>Chờ nghiệm thu</button>
                    <button class="btn btn-sm btn-outline-danger btn-dispute-project" data-id="${req.id}" data-type="request" title="Khiếu nại Admin"><i class="bi bi-shield-slash"></i> Khiếu nại</button>
                </div>
            `;
        } else if (req.status === 'revision_requested') {
            statusBadge = '<span class="badge bg-warning text-dark border border-warning">Yêu cầu sửa lại</span>';
            revisionNotesHtml = `<div class="text-warning small mt-1"><b>Yêu cầu:</b> ${req.revisionInstructions || 'N/A'}</div>`;
            actionButtons = `
                <div class="d-flex gap-1 justify-content-end">
                    <button class="btn btn-sm btn-warning text-dark btn-deliver-modal-req" data-id="${req.id}">Nộp lại</button>
                    <button class="btn btn-sm btn-outline-danger btn-dispute-project" data-id="${req.id}" data-type="request" title="Khiếu nại Admin"><i class="bi bi-shield-slash"></i> Khiếu nại</button>
                </div>
            `;
        } else if (req.status === 'disputed') {
            statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">Tranh chấp</span>';
            actionButtons = `<span class="text-muted small">Đang phân xử</span>`;
        } else {
            statusBadge = getStatusBadge(req.status);
        }

        tbody.innerHTML += `
            <tr>
                <td class="text-muted small">#${req.id}</td>
                <td class="fw-bold">${req.clientName || 'Khách hàng'}</td>
                <td>
                    ${serviceTitle}
                    ${revisionNotesHtml}
                </td>
                <td class="text-primary fw-bold">${Utils.formatCurrency(req.proposedBudget || 0)}</td>
                <td class="small text-muted">${req.message || ''}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionButtons}</td>
            </tr>`;
    });

    tbody.querySelectorAll('.btn-accept-request').forEach(btn => {
        btn.addEventListener('click', (e) => handleRequestAction(e.target.dataset.id, 'accepted'));
    });
    tbody.querySelectorAll('.btn-reject-request').forEach(btn => {
        btn.addEventListener('click', (e) => confirm('Xác nhận từ chối?') && handleRequestAction(e.target.dataset.id, 'rejected'));
    });
    tbody.querySelectorAll('.btn-deliver-modal-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('deliverProjectId').value = e.target.dataset.id;
            document.getElementById('deliverProjectId').dataset.type = 'request';
            new bootstrap.Modal(document.getElementById('deliverWorkModal')).show();
        });
    });
}

/**
 * ACTIONS & SYNC
 */
function setupFormListeners() {
    const bidForm = document.getElementById('submitBidForm');
    if (bidForm) {
        bidForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitBid');
            btn.disabled = true;
            try {
                const bid = {
                    projectId: document.getElementById('bidProjectId').value,
                    freelancerId: currentUser.id,
                    price: document.getElementById('bidPrice').value,
                    message: document.getElementById('bidMessage').value.trim(),
                    status: 'pending'
                };
                await api.post('/bids', bid);
                alert('Thành công!');
                bootstrap.Modal.getInstance(document.getElementById('submitBidModal')).hide();
                bidForm.reset();
                cachedBids = await api.get('/bids');
                renderMyBids();
            } catch (err) { alert(err.message); }
            finally { btn.disabled = false; }
        });
    }

    // Add Service Form Validation
    const addServiceForm = document.getElementById('addServiceForm');
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titleInput = document.getElementById('fs_title');
            const categoryInput = document.getElementById('fs_category');
            const priceInput = document.getElementById('fs_price');
            const imageInput = document.getElementById('fs_image');
            const descInput = document.getElementById('fs_description');
            
            // Reset validation
            [titleInput, categoryInput, priceInput, imageInput, descInput].forEach(el => el.classList.remove('is-invalid'));
            document.getElementById('fsTitleError').textContent = '';
            document.getElementById('fsCategoryError').textContent = '';
            document.getElementById('fsPriceError').textContent = '';
            document.getElementById('fsImageError').textContent = '';
            document.getElementById('fsDescError').textContent = '';
            
            let hasError = false;
            
            if (!titleInput.value.trim()) {
                titleInput.classList.add('is-invalid');
                document.getElementById('fsTitleError').textContent = 'Tên dịch vụ không được để trống.';
                hasError = true;
            }
            
            if (!categoryInput.value) {
                categoryInput.classList.add('is-invalid');
                document.getElementById('fsCategoryError').textContent = 'Vui lòng chọn danh mục.';
                hasError = true;
            }
            
            if (!priceInput.value) {
                priceInput.classList.add('is-invalid');
                document.getElementById('fsPriceError').textContent = 'Mức giá không được để trống.';
                hasError = true;
            } else if (parseFloat(priceInput.value) <= 0) {
                priceInput.classList.add('is-invalid');
                document.getElementById('fsPriceError').textContent = 'Giá phải lớn hơn 0.';
                hasError = true;
            }
            
            if (imageInput.value.trim() && !/^https?:\/\/.+/.test(imageInput.value.trim())) {
                imageInput.classList.add('is-invalid');
                document.getElementById('fsImageError').textContent = 'URL hình ảnh không hợp lệ.';
                hasError = true;
            }
            
            if (!descInput.value.trim()) {
                descInput.classList.add('is-invalid');
                document.getElementById('fsDescError').textContent = 'Mô tả không được để trống.';
                hasError = true;
            } else if (descInput.value.trim().length < 10) {
                descInput.classList.add('is-invalid');
                document.getElementById('fsDescError').textContent = 'Mô tả phải có ít nhất 10 ký tự.';
                hasError = true;
            }
            
            if (hasError) return;
            
            const btn = document.getElementById('btnSaveFreelancerService');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';
            
            try {
                const serviceData = {
                    title: titleInput.value.trim(),
                    category: categoryInput.value,
                    price: priceInput.value,
                    image: imageInput.value.trim(),
                    description: descInput.value.trim(),
                    freelancerId: currentUser.id,
                    status: 'pending'
                };
                await api.post('/services', serviceData);
                alert('Gửi dịch vụ thành công! Chờ admin duyệt.');
                bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
                addServiceForm.reset();
                cachedServices = await api.get('/services');
                renderMyServices();
            } catch (err) {
                alert('Lỗi: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Gửi Duyệt';
            }
        });
    }

    const deliverForm = document.getElementById('deliverWorkForm');
    if (deliverForm) {
        deliverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('deliverProjectId').value;
            const type = document.getElementById('deliverProjectId').dataset.type;
            const btn = document.getElementById('btnConfirmDelivery');
            btn.disabled = true;
            try {
                const payload = {
                    status: 'delivered',
                    deliveryLink: document.getElementById('deliveryLink').value,
                    deliveryNote: document.getElementById('deliveryNote').value,
                    deliveredAt: new Date().toISOString()
                };
                const endpoint = type === 'request' ? `/requests/${id}` : `/jobs/${id}`;
                await api.put(endpoint, payload);
                alert('Bàn giao thành công!');
                bootstrap.Modal.getInstance(document.getElementById('deliverWorkModal')).hide();
                deliverForm.reset();
                if (type === 'request') {
                    cachedRequests = await api.get('/requests');
                    renderClientRequests();
                } else {
                    cachedJobs = await api.get('/jobs');
                    renderMyActiveJobs();
                }
            } catch (err) { alert(err.message); }
            finally { btn.disabled = false; }
        });
    }

    // Gửi khiếu nại lên ban trọng tài Admin
    $(document).on('click', '.btn-dispute-project', async function() {
        const itemId = $(this).data('id');
        const itemType = $(this).data('type');
        
        if (confirm("Bạn có chắc chắn muốn gửi khiếu nại lên Admin? Ban trọng tài sẽ phân xử tranh chấp của dự án này.")) {
            const btn = $(this);
            btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
            
            const endpoint = itemType === 'request' ? `/requests/${itemId}` : `/jobs/${itemId}`;
            try {
                await api.put(endpoint, { status: 'disputed' });
                alert('Đã gửi khiếu nại lên ban trọng tài Admin thành công!');
                initDashboard();
            } catch (err) {
                alert('Lỗi: ' + err.message);
                btn.prop('disabled', false).html('<i class="bi bi-shield-slash"></i> Khiếu nại');
            }
        }
    });

    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amountInput = document.getElementById('withdrawAmount');
            const bankInput = document.getElementById('withdrawBank');
            const accountInput = document.getElementById('withdrawAccount');
            const nameInput = document.getElementById('withdrawName');
            const btn = document.getElementById('btnConfirmWithdraw');

            // Reset validation
            amountInput.classList.remove('is-invalid');
            bankInput.classList.remove('is-invalid');
            accountInput.classList.remove('is-invalid');
            nameInput.classList.remove('is-invalid');

            let hasError = false;
            const amount = parseFloat(amountInput.value);
            const balance = Wallet.getBalance(currentUser.id, 'freelancer');

            if (isNaN(amount) || amount < 50000) {
                amountInput.classList.add('is-invalid');
                document.getElementById('withdrawAmountError').textContent = 'Số tiền rút tối thiểu là 50.000 VNĐ.';
                hasError = true;
            } else if (amount > balance) {
                amountInput.classList.add('is-invalid');
                document.getElementById('withdrawAmountError').textContent = `Số dư khả dụng không đủ (Số dư hiện tại: ${Utils.formatCurrency(balance)}).`;
                hasError = true;
            }

            if (!bankInput.value) {
                bankInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!accountInput.value.trim()) {
                accountInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!nameInput.value.trim()) {
                nameInput.classList.add('is-invalid');
                hasError = true;
            }

            if (hasError) return;

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

            try {
                // Rút tiền mô phỏng
                Wallet.withdraw(currentUser.id, amount);
                alert(`Yêu cầu rút tiền thành công! Đã chuyển ${Utils.formatCurrency(amount)} về tài khoản ngân hàng ${bankInput.value} - ${accountInput.value}.`);
                bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
                withdrawForm.reset();
                
                // Re-render statistics
                renderStatCards();
            } catch (err) {
                alert('Có lỗi xảy ra: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Xác nhận rút tiền';
            }
        });
    }
}

async function handleRequestAction(id, status) {
    try {
        await api.put(`/requests/${id}`, { status });
        cachedRequests = await api.get('/requests');
        renderClientRequests();
    } catch (err) { alert(err.message); }
}

/**
 * HELPERS
 */
function attachBidEvents(container) {
    if(!container) return;
    container.querySelectorAll('.btn-open-bid-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const { id, title, budget } = e.currentTarget.dataset;
            document.getElementById('bidProjectId').value = id;
            document.getElementById('bidProjectTitle').textContent = title;
            document.getElementById('bidProjectBudget').textContent = `Ngân sách dự kiến: ${budget}`;
            new bootstrap.Modal(document.getElementById('submitBidModal')).show();
        });
    });
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning text-dark border">Đang chờ</span>',
        'accepted': '<span class="badge bg-success bg-opacity-10 text-success border">Đã nhận</span>',
        'rejected': '<span class="badge bg-danger bg-opacity-10 text-danger border">Từ chối</span>',
        'delivered': '<span class="badge bg-info bg-opacity-10 text-info border">Đã bàn giao</span>',
        'completed': '<span class="badge bg-success text-white">Hoàn tất</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function showLoading(isLoading) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (isLoading) {
            spinner.classList.remove('d-none');
            spinner.classList.add('d-flex');
        } else {
            spinner.classList.remove('d-flex');
            spinner.classList.add('d-none');
        }
    }
}

// RESET ON MODAL CLOSE — added for premium UI/UX
document.getElementById('addServiceModal')?.addEventListener('hidden.bs.modal', () => {
  const desc = document.getElementById('fs_description');
  if (desc) desc.value = '';
  const c = document.getElementById('svcDescCount');
  if (c) c.textContent = '0 / 500 ký tự';
});
