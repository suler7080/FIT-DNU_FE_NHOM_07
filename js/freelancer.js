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
    renderFindProjects();
    renderMyBids();
    renderMyActiveJobs();
    renderMyServices();
    renderClientRequests();
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
        (j.status === 'in-progress' || j.status === 'delivered') && 
        String(j.freelancerId) === String(currentUser.id)
    );

    tbody.innerHTML = myActiveJobs.length ? '' : '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có dự án nào đang làm.</td></tr>';

    myActiveJobs.forEach(j => {
        const isDelivered = j.status === 'delivered';
        const actionBtn = isDelivered 
            ? `<button class="btn btn-sm btn-outline-secondary" disabled>Chờ nghiệm thu</button>` 
            : `<button class="btn btn-sm btn-success btn-deliver-modal" data-id="${j.id}">Bàn Giao</button>`;
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${j.title}</td>
                <td>${j.clientName || 'N/A'}</td>
                <td>${j.deadline || 'N/A'}</td>
                <td><span class="badge ${isDelivered ? 'bg-info' : 'bg-primary'} bg-opacity-10 ${isDelivered ? 'text-info' : 'text-primary'} border">${isDelivered ? 'Đã bàn giao' : 'Đang làm'}</span></td>
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

    // B1: Lấy danh sách Service IDs của mình (Fix ID so sánh)
    const myServiceIds = safeServices
        .filter(s => String(s.freelancerId) === String(currentUser.id))
        .map(s => String(s.id));

    // B2: Lọc requests liên quan (Fix ID so sánh)
    const myRequests = safeRequests.filter(r => myServiceIds.includes(String(r.serviceId)));
    
    tbody.innerHTML = myRequests.length ? '' : '<tr><td colspan="7" class="text-center text-muted py-4">Chưa có yêu cầu nào.</td></tr>';

    myRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(req => {
        const service = safeServices.find(s => String(s.id) === String(req.serviceId));
        const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;

        let statusBadge = '';
        let actionButtons = '';

        if (req.status === 'pending') {
            statusBadge = '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
            actionButtons = `
                <button class="btn btn-sm btn-success btn-accept-request" data-id="${req.id}">Nhận việc</button>
                <button class="btn btn-sm btn-outline-danger btn-reject-request" data-id="${req.id}">Từ chối</button>`;
        } else if (req.status === 'accepted') {
            statusBadge = '<span class="badge bg-success">Đang làm</span>';
            actionButtons = `<button class="btn btn-sm btn-primary btn-deliver-modal-req" data-id="${req.id}">Bàn giao</button>`;
        } else {
            statusBadge = getStatusBadge(req.status);
        }

        tbody.innerHTML += `
            <tr>
                <td class="text-muted small">#${req.id}</td>
                <td class="fw-bold">${req.clientName || 'Khách hàng'}</td>
                <td>${serviceTitle}</td>
                <td class="text-primary fw-bold">${Utils.formatCurrency(req.proposedBudget || 0)}</td>
                <td class="small text-muted">${req.message || ''}</td>
                <td>${statusBadge}</td>
                <td class="text-end">${actionButtons}</td>
            </tr>`;
    });

    // Event listeners
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
