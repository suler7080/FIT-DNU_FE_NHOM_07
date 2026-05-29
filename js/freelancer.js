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

let currentProjectsPage = 1;
let currentBidsPage = 1;
let currentActiveJobsPage = 1;
let currentCompletedJobsPage = 1;
let myServicesPage = 1;
let currentRequestsPage = 1;

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

    // Lắng nghe sự kiện sắp xếp dự án
    const sortBudgetSelect = document.getElementById('sortBudgetSelect');
    if (sortBudgetSelect) {
        sortBudgetSelect.addEventListener('change', () => {
            currentProjectsPage = 1;
            renderFindProjects();
        });
    }

    // Lắng nghe sự kiện lọc trạng thái yêu cầu dịch vụ
    const requestStatusFilter = document.getElementById('requestStatusFilter');
    if (requestStatusFilter) {
        requestStatusFilter.addEventListener('change', () => {
            currentRequestsPage = 1;
            renderClientRequests();
        });
    }

    // Khởi tạo Notification Center
    if (currentUser) {
        if (Utils.notifications.getUnreadCount(currentUser.id) === 0) {
            Utils.notifications.add(currentUser.id, 'Chào mừng đến với Freelancer Dashboard!', 'info');
            Utils.notifications.add(currentUser.id, 'Hoàn thành hồ sơ và đăng dịch vụ để nhận việc ngay!', 'success');
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

/**
 * INITIALIZATION WITH MRI LOGGING
 */
async function initDashboard() {
    console.log("--- Dashboard Initialization Started ---");
    showLoading(true);

    // Render skeleton placeholders
    Utils.renderSkeleton('freelancerProjectsContainer', 'list', 3);
    Utils.renderSkeleton('freelancerBidsTableBody', 'table', 5);
    Utils.renderSkeleton('freelancerActiveJobsTableBody', 'table', 5);
    Utils.renderSkeleton('freelancerCompletedJobsTableBody', 'table', 5);
    Utils.renderSkeleton('myServicesTableBody', 'table', 5);
    Utils.renderSkeleton('clientRequestsListContainer', 'list', 5);

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
    renderFreelancerCharts();
    renderFindProjects();
    renderMyBids();
    renderMyActiveJobs();
    renderMyServices();
    renderClientRequests();
}

function renderFreelancerCharts() {
    const myBids = cachedBids.filter(b => String(b.freelancerId) === String(currentUser.id));
    const myJobs = cachedJobs.filter(j => String(j.freelancerId) === String(currentUser.id));
    const myRequests = cachedRequests.filter(r => String(r.freelancerId) === String(currentUser.id));

    // Destroy old charts if they exist
    try {
        ['freelancerChartEarnings', 'freelancerChartBids'].forEach(function(id) {
            var canvas = document.getElementById(id);
            if (canvas) {
                var existing = Chart.getChart(canvas);
                if (existing) existing.destroy();
            }
        });
    } catch (e) {
        console.warn('Lỗi khi hủy biểu đồ cũ:', e);
    }

    // Bar Chart — Earnings Overview (by job status)
    const earningsEl = document.getElementById('freelancerChartEarnings');
    if (earningsEl) {
        const pendingJobs = myJobs.filter(j => j.status === 'in-progress' || j.status === 'delivered' || j.status === 'revision_requested').length;
        const completedJobs = myJobs.filter(j => j.status === 'completed').length;
        const disputedJobs = myJobs.filter(j => j.status === 'disputed').length;
        const pendingReqs = myRequests.filter(r => r.status === 'accepted' || r.status === 'delivered' || r.status === 'revision_requested').length;
        const completedReqs = myRequests.filter(r => r.status === 'completed').length;
        const disputedReqs = myRequests.filter(r => r.status === 'disputed').length;

        const ctx = earningsEl.getContext('2d');
        const gradProject = ctx.createLinearGradient(0, 0, 0, 200);
        gradProject.addColorStop(0, '#6366f1');
        gradProject.addColorStop(1, 'rgba(99, 102, 241, 0.4)');

        const gradService = ctx.createLinearGradient(0, 0, 0, 200);
        gradService.addColorStop(0, '#10b981');
        gradService.addColorStop(1, 'rgba(16, 185, 129, 0.4)');

        new Chart(earningsEl, {
            type: 'bar',
            data: {
                labels: ['Đang làm', 'Hoàn thành', 'Tranh chấp'],
                datasets: [
                    { label: 'Dự Án', data: [pendingJobs, completedJobs, disputedJobs], backgroundColor: gradProject, borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6 },
                    { label: 'Dịch Vụ', data: [pendingReqs, completedReqs, disputedReqs], backgroundColor: gradService, borderColor: '#10b981', borderWidth: 1.5, borderRadius: 6 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' } } } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
            }
        });
    }

    // Doughnut Chart — Bid Status
    const bidsEl = document.getElementById('freelancerChartBids');
    if (bidsEl) {
        const pendingBids = myBids.filter(b => b.status === 'pending').length;
        const acceptedBids = myBids.filter(b => b.status === 'accepted').length;
        const rejectedBids = myBids.filter(b => b.status === 'rejected').length;

        const ctxBids = bidsEl.getContext('2d');
        const gradPending = ctxBids.createLinearGradient(0, 0, 0, 200);
        gradPending.addColorStop(0, '#f59e0b');
        gradPending.addColorStop(1, 'rgba(245, 158, 11, 0.5)');

        const gradAccepted = ctxBids.createLinearGradient(0, 0, 0, 200);
        gradAccepted.addColorStop(0, '#10b981');
        gradAccepted.addColorStop(1, 'rgba(16, 185, 129, 0.5)');

        const gradRejected = ctxBids.createLinearGradient(0, 0, 0, 200);
        gradRejected.addColorStop(0, '#ef4444');
        gradRejected.addColorStop(1, 'rgba(239, 68, 68, 0.5)');

        new Chart(bidsEl, {
            type: 'doughnut',
            data: {
                labels: ['Chờ duyệt', 'Được chấp nhận', 'Bị từ chối'],
                datasets: [{
                    data: [pendingBids, acceptedBids, rejectedBids],
                    backgroundColor: [gradPending, gradAccepted, gradRejected],
                    borderWidth: 3, borderColor: '#ffffff', hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11, family: 'Inter' } } } }
            }
        });
    }
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

    document.getElementById('statBidsSent').textContent = bidsSent;
    document.getElementById('statBidsAccepted').textContent = bidsAccepted;
    document.getElementById('statActiveJobs').textContent = activeJobs;
    document.getElementById('statTotalEarnings').textContent = Utils.formatCurrency(totalEarnings);
    drawSparkline('freelancerEarningsSparkline', [totalEarnings * 0.85, totalEarnings * 0.9, totalEarnings * 0.8, totalEarnings * 0.95, totalEarnings], '#f59e0b');

    Wallet.getBalance(currentUser.id, 'freelancer')
        .then(walletBalance => {
            document.getElementById('statWalletBalance').textContent = Utils.formatCurrency(walletBalance);
            drawSparkline('freelancerWalletSparkline', [walletBalance * 0.8, walletBalance * 0.95, walletBalance * 0.85, walletBalance * 1.05, walletBalance], '#06b6d4');
        })
        .catch(err => {
            console.warn('Lỗi tải số dư ví freelancer:', err);
            document.getElementById('statWalletBalance').textContent = "0 ₫";
            drawSparkline('freelancerWalletSparkline', [0, 0, 0, 0, 0], '#06b6d4');
        });
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

    // Inject Freelancer Badge / Level
    const badgeContainer = document.getElementById('freelancerBadgeContainer');
    if (badgeContainer) {
        const completedJobs = (cachedJobs || []).filter(j => String(j.freelancerId) === String(currentUser.id) && j.status === 'completed').length +
                              (cachedRequests || []).filter(r => {
                                  const myServiceIds = (cachedServices || []).filter(s => String(s.freelancerId) === String(currentUser.id)).map(s => String(s.id));
                                  return myServiceIds.includes(String(r.serviceId)) && r.status === 'completed';
                              }).length;
        badgeContainer.innerHTML = Utils.renderFreelancerBadge(completedJobs);
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

    // Sorting
    const sortVal = document.getElementById('sortBudgetSelect')?.value || 'default';
    let displayProjects = [...openProjects];
    if (sortVal === 'asc') {
        displayProjects.sort((a, b) => parseFloat(a.budget || 0) - parseFloat(b.budget || 0));
    } else if (sortVal === 'desc') {
        displayProjects.sort((a, b) => parseFloat(b.budget || 0) - parseFloat(a.budget || 0));
    }

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
    if (displayProjects.length === 0) {
        container.innerHTML = '<div class="text-center py-5 text-muted"><h5>Không có dự án mới nào khả dụng.</h5></div>';
        Utils.renderPagination('projectsPagination', 1, 1, null);
        return;
    }

    const paginateResult = Utils.paginateArray(displayProjects, currentProjectsPage, 6);
    currentProjectsPage = paginateResult.currentPage;

    paginateResult.paginatedItems.forEach((p, idx) => {
        const skillsHtml = (p.requiredSkills || '').split(',').filter(s => s.trim()).map(s => `<span class="badge bg-secondary bg-opacity-10 text-dark border me-1 mb-1" style="font-size: 10px; padding: 4px 8px !important;">${s.trim()}</span>`).join('');
        const descShort = Utils.truncateText(p.description || 'Chưa có mô tả ngắn cho dự án này.', 160);
        
        container.innerHTML += `
            <div class="card mb-3 border-0 bg-white shadow-sm rounded-4 overflow-hidden">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-lg-8">
                            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style="font-size: 10px; padding: 4px 8px !important;">Dự án mở</span>
                                <span class="text-muted small" style="font-size: 11px;"><i class="bi bi-calendar-event me-1"></i>Hạn chót: ${p.deadline || 'N/A'}</span>
                            </div>
                            <h5 class="fw-bold text-dark mb-2" style="font-size: 16px;">${p.title}</h5>
                            <p class="text-muted small mb-3" style="line-height: 1.5; font-size: 13px;">${descShort}</p>
                            <div class="d-flex flex-wrap gap-1 mb-2">${skillsHtml || '<span class="text-muted small">Không yêu cầu kỹ năng</span>'}</div>
                        </div>
                        <div class="col-lg-4 text-lg-end mt-3 mt-lg-0 ps-lg-4 border-start-lg">
                            <div class="mb-3">
                                <span class="text-muted small d-block mb-1" style="font-size: 11px;">Ngân sách dự kiến</span>
                                <h4 class="fw-bold text-success mb-0" style="font-size: 18px;">${Utils.formatCurrency(p.budget)}</h4>
                            </div>
                            <div class="d-flex gap-2 justify-content-lg-end mt-3">
                                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 btn-view-project-drawer" type="button" data-id="${p.id}" style="font-size: 12px; font-weight: 500;"><i class="bi bi-info-circle me-1"></i>Chi tiết</button>
                                <button class="btn btn-sm btn-primary rounded-pill px-3 py-2 btn-open-bid-modal" data-id="${p.id}" data-title="${p.title}" data-budget="${Utils.formatCurrency(p.budget)}" style="font-size: 12px; font-weight: 600;"><i class="bi bi-send me-1"></i>Báo giá</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    Utils.renderPagination('projectsPagination', currentProjectsPage, paginateResult.totalPages, function(newPage) {
        currentProjectsPage = newPage;
        renderFindProjects();
    });

    // Attach click events for quick drawer view
    container.querySelectorAll('.btn-view-project-drawer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            const project = displayProjects.find(pro => String(pro.id) === String(projectId));
            if (project) {
                openProjectDetailsDrawer(project);
            }
        });
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
        tbody.innerHTML = Utils.renderTableEmptyState(5, 'Bạn chưa gửi báo giá nào.', 'bi-send-dash', 'Tìm dự án ứng tuyển', "document.querySelector('[href=\"#find-projects\"]').click()");
        Utils.renderPagination('freelancerBidsPagination', 1, 1, null);
        return;
    }

    const paginateResult = Utils.paginateArray(myBids, currentBidsPage, 10);
    currentBidsPage = paginateResult.currentPage;

    paginateResult.paginatedItems.forEach(bid => {
        const project = Array.isArray(cachedJobs) ? cachedJobs.find(j => String(j.id) === String(bid.projectId)) : null;
        let actionHtml = '';
        if (bid.status === 'pending') {
            actionHtml = `
                <button class="btn btn-sm btn-outline-warning btn-edit-bid me-1" data-id="${bid.id}" title="Sửa">
                    <i class="bi bi-pencil-square"></i> Sửa
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-bid" data-id="${bid.id}" title="Xóa">
                    <i class="bi bi-trash"></i> Xóa
                </button>
            `;
        } else {
            actionHtml = `<span class="text-muted small">—</span>`;
        }
        tbody.innerHTML += `
            <tr>
                <td class="fw-semibold text-primary">${project ? project.title : `Dự án #${bid.projectId}`}</td>
                <td class="fw-bold">${Utils.formatCurrency(bid.price)}</td>
                <td class="small text-muted">${bid.message || ''}</td>
                <td>${getStatusBadge(bid.status)}</td>
                <td class="text-end">${actionHtml}</td>
            </tr>`;
    });

    Utils.renderPagination('freelancerBidsPagination', currentBidsPage, paginateResult.totalPages, function(newPage) {
        currentBidsPage = newPage;
        renderMyBids();
    });

    // Gắn sự kiện sửa bid
    tbody.querySelectorAll('.btn-edit-bid').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openEditBidModal(id);
        });
    });

    // Gắn sự kiện xóa bid
    tbody.querySelectorAll('.btn-delete-bid').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            Utils.showConfirmDialog(
                'Hủy báo giá',
                'Bạn có chắc chắn muốn hủy (xóa) báo giá này?',
                () => {
                    api.delete('/bids/' + id)
                        .then(() => {
                            if (typeof Utils !== 'undefined' && Utils.logAudit) {
                                Utils.logAudit('Hủy báo giá', `Freelancer ${currentUser.name} đã hủy báo giá #${id}.`);
                            }
                            Utils.showToast('Hủy báo giá thành công!', 'success');
                            initDashboard();
                        })
                        .catch(err => {
                            console.error(err);
                            Utils.showToast('Có lỗi xảy ra khi hủy báo giá: ' + err.message, 'error');
                        });
                }
            );
        });
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

    tbody.innerHTML = myActiveJobs.length ? '' : Utils.renderTableEmptyState(5, 'Chưa có dự án nào đang làm.', 'bi-briefcase', 'Tìm dự án ứng tuyển', "document.querySelector('[href=\"#find-projects\"]').click()");

    if (myActiveJobs.length === 0) {
        Utils.renderPagination('freelancerActiveJobsPagination', 1, 1, null);
    } else {
        const paginateActive = Utils.paginateArray(myActiveJobs, currentActiveJobsPage, 10);
        currentActiveJobsPage = paginateActive.currentPage;

        paginateActive.paginatedItems.forEach(j => {
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

        Utils.renderPagination('freelancerActiveJobsPagination', currentActiveJobsPage, paginateActive.totalPages, function(newPage) {
            currentActiveJobsPage = newPage;
            renderMyActiveJobs();
        });
    }

    if (completedTbody) {
        const myCompleted = safeJobs.filter(j => j.status === 'completed' && String(j.freelancerId) === String(currentUser.id));
        completedTbody.innerHTML = myCompleted.length ? '' : '<tr><td colspan="4" class="text-center text-muted py-4">Chưa có lịch sử.</td></tr>';
        
        if (myCompleted.length === 0) {
            Utils.renderPagination('freelancerCompletedJobsPagination', 1, 1, null);
        } else {
            const paginateCompleted = Utils.paginateArray(myCompleted, currentCompletedJobsPage, 10);
            currentCompletedJobsPage = paginateCompleted.currentPage;

            paginateCompleted.paginatedItems.forEach(j => {
                completedTbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${j.title}</td>
                        <td>${j.clientName || 'N/A'}</td>
                        <td>${new Date(j.deliveredAt || Date.now()).toLocaleDateString('vi-VN')}</td>
                        <td><span class="badge bg-success">Hoàn tất</span></td>
                    </tr>`;
            });

            Utils.renderPagination('freelancerCompletedJobsPagination', currentCompletedJobsPage, paginateCompleted.totalPages, function(newPage) {
                currentCompletedJobsPage = newPage;
                renderMyActiveJobs();
            });
        }
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
    
    tbody.innerHTML = myServices.length ? '' : Utils.renderTableEmptyState(5, 'Chưa đăng dịch vụ nào.', 'bi-card-list', 'Đăng dịch vụ mới', "new bootstrap.Modal(document.getElementById('addServiceModal')).show()");

    if (myServices.length === 0) {
        Utils.renderPagination('myServicesPagination', 1, 1, null);
        return;
    }

    const paginateResult = Utils.paginateArray(myServices, myServicesPage, 10);
    myServicesPage = paginateResult.currentPage;

    paginateResult.paginatedItems.forEach(s => {
        const statusMap = {
            'pending': { class: 'bg-warning text-dark', text: 'Chờ duyệt' },
            'approved': { class: 'bg-success text-white', text: 'Đã duyệt' },
            'rejected': { class: 'bg-danger text-white', text: 'Từ chối' }
        };
        const st = statusMap[s.status] || statusMap.pending;
        
        let actionHtml = '';
        if (s.status === 'pending' || s.status === 'approved') {
            actionHtml = `
                <button class="btn btn-sm btn-outline-warning btn-edit-service me-1" data-id="${s.id}" title="Sửa">
                    <i class="bi bi-pencil-square"></i> Sửa
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-service" data-id="${s.id}" title="Xóa">
                    <i class="bi bi-trash"></i> Xóa
                </button>
            `;
        } else {
            actionHtml = `<span class="text-muted small">—</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-primary">${s.title}</td>
                <td>${s.category || ''}</td>
                <td class="fw-semibold text-success">${Utils.formatCurrency(s.price || 0)}</td>
                <td><span class="badge ${st.class} border">${st.text}</span></td>
                <td class="text-end">${actionHtml}</td>
            </tr>`;
    });

    Utils.renderPagination('myServicesPagination', myServicesPage, paginateResult.totalPages, function(newPage) {
        myServicesPage = newPage;
        renderMyServices();
    });

    // Gắn sự kiện sửa dịch vụ
    tbody.querySelectorAll('.btn-edit-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openEditServiceModal(id);
        });
    });

    // Gắn sự kiện xóa dịch vụ
    tbody.querySelectorAll('.btn-delete-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            Utils.showConfirmDialog(
                'Xóa dịch vụ',
                'Bạn có chắc chắn muốn xóa dịch vụ này?',
                () => {
                    api.delete('/services/' + id)
                        .then(() => {
                            if (typeof Utils !== 'undefined' && Utils.logAudit) {
                                Utils.logAudit('Xóa dịch vụ', `Freelancer ${currentUser.name} đã xóa dịch vụ #${id}.`);
                            }
                            Utils.showToast('Xóa dịch vụ thành công!', 'success');
                            initDashboard();
                        })
                        .catch(err => {
                            console.error(err);
                            Utils.showToast('Có lỗi xảy ra khi xóa dịch vụ: ' + err.message, 'error');
                        });
                }
            );
        });
    });
}

function renderClientRequests() {
    const container = document.getElementById('clientRequestsListContainer');
    if (!container) return;

    const safeServices = Array.isArray(cachedServices) ? cachedServices : [];
    const safeRequests = Array.isArray(cachedRequests) ? cachedRequests : [];

    const myServiceIds = safeServices
        .filter(s => String(s.freelancerId) === String(currentUser.id))
        .map(s => String(s.id));

    let myRequests = safeRequests.filter(r => myServiceIds.includes(String(r.serviceId)));

    // Apply status filter
    const filterStatus = document.getElementById('requestStatusFilter')?.value || 'all';
    if (filterStatus !== 'all') {
        myRequests = myRequests.filter(r => r.status === filterStatus);
    }

    if (myRequests.length === 0) {
        const emptyMsg = filterStatus !== 'all'
            ? 'Không có yêu cầu nào với trạng thái này.'
            : 'Chưa có yêu cầu nào từ khách hàng.';
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-envelope fs-1 text-muted d-block mb-3"></i>
                <p class="text-muted mb-3">${emptyMsg}</p>
                ${filterStatus === 'all' ? `<button class="btn btn-primary btn-sm rounded-pill px-4" onclick="document.querySelector('[href=\\"#my-services\\"]').click()"><i class="bi bi-plus-circle me-1"></i>Tối ưu hóa dịch vụ</button>` : ''}
            </div>`;
        Utils.renderPagination('freelancerRequestsPagination', 1, 1, null);
        return;
    }

    const sortedRequests = [...myRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginateResult = Utils.paginateArray(sortedRequests, currentRequestsPage, 10);
    currentRequestsPage = paginateResult.currentPage;

    container.innerHTML = '';

    paginateResult.paginatedItems.forEach(req => {
        const service = safeServices.find(s => String(s.id) === String(req.serviceId));
        const serviceTitle = service ? service.title : `Dịch vụ #${req.serviceId}`;
        const shortMsg = Utils.truncateText(req.message || 'Không có lời nhắn.', 100);
        const fullMsg = (req.message || '').replace(/"/g, '&quot;');
        const formattedDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : 'N/A';

        let statusBadge = '';
        let actionButtons = '';
        let revisionBanner = '';

        if (req.status === 'pending') {
            statusBadge = '<span class="badge bg-warning text-dark rounded-pill px-3"><i class="bi bi-hourglass-split me-1"></i>Chờ xác nhận</span>';
            actionButtons = `
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-success btn-sm rounded-pill px-3 btn-accept-request" data-id="${req.id}">
                        <i class="bi bi-check-circle me-1"></i>Nhận việc
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 btn-reject-request" data-id="${req.id}">
                        <i class="bi bi-x-circle me-1"></i>Từ chối
                    </button>
                </div>`;
        } else if (req.status === 'accepted') {
            statusBadge = '<span class="badge bg-primary rounded-pill px-3"><i class="bi bi-tools me-1"></i>Đang thực hiện</span>';
            actionButtons = `
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm rounded-pill px-3 btn-deliver-modal-req" data-id="${req.id}">
                        <i class="bi bi-box-seam me-1"></i>Bàn giao
                    </button>
                </div>`;
        } else if (req.status === 'delivered') {
            statusBadge = '<span class="badge bg-info bg-opacity-15 text-info border border-info rounded-pill px-3"><i class="bi bi-send-check me-1"></i>Đã bàn giao</span>';
            actionButtons = `
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" disabled>
                        <i class="bi bi-clock-history me-1"></i>Chờ nghiệm thu
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 btn-dispute-project" data-id="${req.id}" data-type="request" title="Khiếu nại Admin">
                        <i class="bi bi-shield-slash me-1"></i>Khiếu nại
                    </button>
                </div>`;
        } else if (req.status === 'revision_requested') {
            statusBadge = '<span class="badge bg-warning text-dark border border-warning rounded-pill px-3"><i class="bi bi-arrow-counterclockwise me-1"></i>Yêu cầu sửa lại</span>';
            revisionBanner = `
                <div class="alert alert-warning alert-sm py-2 px-3 mb-3 rounded-3 d-flex align-items-start gap-2" style="font-size:13px;">
                    <i class="bi bi-exclamation-triangle-fill mt-1 flex-shrink-0"></i>
                    <div><strong>Yêu cầu chỉnh sửa:</strong> ${req.revisionInstructions || 'N/A'}</div>
                </div>`;
            actionButtons = `
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-warning text-dark btn-sm rounded-pill px-3 btn-deliver-modal-req" data-id="${req.id}">
                        <i class="bi bi-arrow-up-circle me-1"></i>Nộp lại
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 btn-dispute-project" data-id="${req.id}" data-type="request" title="Khiếu nại Admin">
                        <i class="bi bi-shield-slash me-1"></i>Khiếu nại
                    </button>
                </div>`;
        } else if (req.status === 'disputed') {
            statusBadge = '<span class="badge bg-danger bg-opacity-15 text-danger border border-danger rounded-pill px-3"><i class="bi bi-exclamation-octagon me-1"></i>Tranh chấp</span>';
            actionButtons = `<span class="text-muted small"><i class="bi bi-hourglass me-1"></i>Đang phân xử bởi Admin</span>`;
        } else if (req.status === 'completed') {
            statusBadge = '<span class="badge bg-success rounded-pill px-3"><i class="bi bi-check-all me-1"></i>Hoàn tất</span>';
            actionButtons = `<span class="text-muted small"><i class="bi bi-star me-1"></i>Đã hoàn thành</span>`;
        } else if (req.status === 'rejected') {
            statusBadge = '<span class="badge bg-danger rounded-pill px-3"><i class="bi bi-slash-circle me-1"></i>Đã từ chối</span>';
            actionButtons = '';
        } else {
            statusBadge = getStatusBadge(req.status);
        }

        container.innerHTML += `
            <div class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden" style="transition: box-shadow 0.2s;">
                <div class="card-body p-4">
                    <div class="row align-items-start gy-3">
                        <div class="col-lg-7">
                            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
                                ${statusBadge}
                                <span class="text-muted small"><i class="bi bi-calendar3 me-1"></i>${formattedDate}</span>
                                <span class="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill px-2" style="font-size:11px;">
                                    <i class="bi bi-tag me-1"></i>${serviceTitle.length > 30 ? serviceTitle.substring(0, 30) + '…' : serviceTitle}
                                </span>
                            </div>
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <div class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style="width:32px;height:32px;">
                                    <i class="bi bi-person text-primary" style="font-size:14px;"></i>
                                </div>
                                <div>
                                    <div class="fw-bold" style="font-size:14px;">${req.clientName || 'Khách hàng'}</div>
                                    <div class="text-muted" style="font-size:11px;">ID Yêu cầu: #${req.id}</div>
                                </div>
                            </div>
                            ${revisionBanner}
                            <p class="text-muted small mb-0" title="${fullMsg}" style="font-size:13px; line-height:1.5; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                                <i class="bi bi-chat-left-text me-1"></i>${shortMsg}
                            </p>
                        </div>
                        <div class="col-lg-5">
                            <div class="d-flex flex-column align-items-lg-end gap-3">
                                <div class="text-lg-end">
                                    <div class="text-muted small mb-1">Ngân sách</div>
                                    <div class="fw-bold text-success fs-5">${Utils.formatCurrency(req.proposedBudget || 0)}</div>
                                </div>
                                ${actionButtons}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    Utils.renderPagination('freelancerRequestsPagination', currentRequestsPage, paginateResult.totalPages, function(newPage) {
        currentRequestsPage = newPage;
        renderClientRequests();
    });

    container.querySelectorAll('.btn-accept-request').forEach(btn => {
        btn.addEventListener('click', (e) => handleRequestAction(e.currentTarget.dataset.id, 'accepted'));
    });
    container.querySelectorAll('.btn-reject-request').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            Utils.showConfirmDialog(
                'Từ chối yêu cầu',
                'Bạn có chắc chắn muốn từ chối yêu cầu này?',
                () => handleRequestAction(id, 'rejected')
            );
        });
    });
    container.querySelectorAll('.btn-deliver-modal-req').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('deliverProjectId').value = e.currentTarget.dataset.id;
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
                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                    Utils.logAudit('Đăng báo giá', `Freelancer ${currentUser.name} đã gửi báo giá ${Utils.formatCurrency(bid.price)} cho dự án #${bid.projectId}.`);
                }
                Utils.showToast('Gửi báo giá thành công!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('submitBidModal')).hide();
                bidForm.reset();
                cachedBids = await api.get('/bids');
                renderMyBids();
            } catch (err) { Utils.showToast(err.message, 'error'); }
            finally { btn.disabled = false; }
        });
    }

    // Edit Bid Form Handler
    const editBidForm = document.getElementById('editBidForm');
    if (editBidForm) {
        editBidForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const idInput = document.getElementById('editBidId');
            const priceInput = document.getElementById('editBidPrice');
            const messageInput = document.getElementById('editBidMessage');
            
            // Reset validation
            [priceInput, messageInput].forEach(el => el.classList.remove('is-invalid'));
            
            let hasError = false;
            
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                priceInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!messageInput.value.trim()) {
                messageInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (hasError) return;
            
            const btn = document.getElementById('btnUpdateBid');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';
            
            try {
                const bidData = {
                    price: priceInput.value,
                    message: messageInput.value.trim(),
                    status: 'pending'
                };
                await api.put('/bids/' + idInput.value, bidData);
                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                    Utils.logAudit('Cập nhật báo giá', `Freelancer ${currentUser.name} đã cập nhật báo giá cho dự án/yêu cầu: ${Utils.formatCurrency(bidData.price)}.`);
                }
                Utils.showToast('Cập nhật báo giá thành công!', 'success');
                
                const modalEl = document.getElementById('editBidModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                editBidForm.reset();
                initDashboard();
            } catch (err) {
                Utils.showToast('Lỗi: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Lưu Thay Đổi';
            }
        });
    }

    // Edit Service Form Handler
    const editServiceForm = document.getElementById('editServiceForm');
    if (editServiceForm) {
        editServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const idInput = document.getElementById('edit_fs_id');
            const titleInput = document.getElementById('edit_fs_title');
            const categoryInput = document.getElementById('edit_fs_category');
            const priceInput = document.getElementById('edit_fs_price');
            const imageInput = document.getElementById('edit_fs_image');
            const descInput = document.getElementById('edit_fs_description');
            
            // Reset validation
            [titleInput, categoryInput, priceInput, imageInput, descInput].forEach(el => el.classList.remove('is-invalid'));
            
            let hasError = false;
            
            if (!titleInput.value.trim()) {
                titleInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!categoryInput.value) {
                categoryInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                priceInput.classList.add('is-invalid');
                hasError = true;
            }
            if (imageInput.value.trim() && !/^https?:\/\/.+/.test(imageInput.value.trim())) {
                imageInput.classList.add('is-invalid');
                hasError = true;
            }
            if (!descInput.value.trim() || descInput.value.trim().length < 10) {
                descInput.classList.add('is-invalid');
                hasError = true;
            }
            
            if (hasError) return;
            
            const btn = document.getElementById('btnUpdateFreelancerService');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';
            
            try {
                const serviceData = {
                    title: titleInput.value.trim(),
                    category: categoryInput.value,
                    price: priceInput.value,
                    image: imageInput.value.trim(),
                    description: descInput.value.trim(),
                    status: 'pending'
                };
                await api.put('/services/' + idInput.value, serviceData);
                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                    Utils.logAudit('Cập nhật dịch vụ', `Freelancer ${currentUser.name} đã cập nhật dịch vụ: "${serviceData.title}" (Chờ duyệt).`);
                }
                Utils.showToast('Cập nhật dịch vụ thành công! Chờ admin duyệt lại.', 'success');
                
                const modalEl = document.getElementById('editServiceModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                editServiceForm.reset();
                initDashboard();
            } catch (err) {
                Utils.showToast('Lỗi: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-save"></i> Lưu thay đổi';
            }
        });
    }

    // Add Service Form Handler

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
                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                    Utils.logAudit('Đăng dịch vụ', `Freelancer ${currentUser.name} đã tạo dịch vụ mới: "${serviceData.title}" (Chờ duyệt).`);
                }
                Utils.showToast('Gửi dịch vụ thành công! Chờ admin duyệt.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addServiceModal')).hide();
                addServiceForm.reset();
                cachedServices = await api.get('/services');
                renderMyServices();
            } catch (err) {
                Utils.showToast('Lỗi: ' + err.message, 'error');
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
                if (typeof Utils !== 'undefined' && Utils.logAudit) {
                    Utils.logAudit('Bàn giao sản phẩm', `Freelancer ${currentUser.name} đã bàn giao sản phẩm cho dự án/yêu cầu #${id}.`);
                }
                Utils.showToast('Bàn giao thành công!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('deliverWorkModal')).hide();
                deliverForm.reset();
                if (type === 'request') {
                    cachedRequests = await api.get('/requests');
                    renderClientRequests();
                } else {
                    cachedJobs = await api.get('/jobs');
                    renderMyActiveJobs();
                }
            } catch (err) { Utils.showToast(err.message, 'error'); }
            finally { btn.disabled = false; }
        });
    }

    // Gửi khiếu nại lên ban trọng tài Admin
    $(document).on('click', '.btn-dispute-project', async function() {
        const itemId = $(this).data('id');
        const itemType = $(this).data('type');
        const btn = $(this);
        
        Utils.showConfirmDialog(
            'Khiếu nại dự án',
            'Bạn có chắc chắn muốn gửi khiếu nại lên Admin? Ban trọng tài sẽ phân xử tranh chấp của dự án này.',
            async () => {
                btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
                const endpoint = itemType === 'request' ? `/requests/${itemId}` : `/jobs/${itemId}`;
                try {
                    await api.put(endpoint, { status: 'disputed' });
                    if (typeof Utils !== 'undefined' && Utils.logAudit) {
                        Utils.logAudit('Khiếu nại dự án', `Freelancer ${currentUser.name} đã gửi khiếu nại tranh chấp cho dự án/yêu cầu #${itemId}.`);
                    }
                    Utils.showToast('Đã gửi khiếu nại lên ban trọng tài Admin thành công!', 'success');
                    initDashboard();
                } catch (err) {
                    Utils.showToast('Lỗi: ' + err.message, 'error');
                    btn.prop('disabled', false).html('<i class="bi bi-shield-slash"></i> Khiếu nại');
                }
            }
        );
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

            const amount = parseFloat(amountInput.value);
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang kiểm tra...';
            
            Wallet.getBalance(currentUser.id, 'freelancer')
                .then(balance => {
                    let hasError = false;
                    
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

                    if (hasError) {
                        btn.disabled = false;
                        btn.innerHTML = 'Xác nhận rút tiền';
                        return;
                    }

                    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';
                    
                    Wallet.withdraw(currentUser.id, amount, 'freelancer')
                        .then(() => {
                            Utils.showToast(`Yêu cầu rút tiền thành công! Đã chuyển ${Utils.formatCurrency(amount)} về tài khoản ngân hàng ${bankInput.value} - ${accountInput.value}.`, 'success');
                            bootstrap.Modal.getInstance(document.getElementById('withdrawModal')).hide();
                            withdrawForm.reset();
                            renderStatCards();
                        })
                        .catch(err => {
                            Utils.showToast('Lỗi rút tiền: ' + err.message, 'error');
                        })
                        .finally(() => {
                            btn.disabled = false;
                            btn.innerHTML = 'Xác nhận rút tiền';
                        });
                })
                .catch(err => {
                    console.error(err);
                    Utils.showToast('Lỗi tải ví.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Xác nhận rút tiền';
                });
        });
    }
}

async function handleRequestAction(id, status) {
    try {
        await api.put(`/requests/${id}`, { status });
        if (typeof Utils !== 'undefined' && Utils.logAudit) {
            const actionText = status === 'accepted' ? 'Nhận yêu cầu dịch vụ' : 'Từ chối yêu cầu dịch vụ';
            Utils.logAudit(actionText, `Freelancer ${currentUser.name} đã ${status === 'accepted' ? 'nhận' : 'từ chối'} yêu cầu dịch vụ #${id}.`);
        }
        cachedRequests = await api.get('/requests');
        renderClientRequests();
    } catch (err) { Utils.showToast(err.message, 'error'); }
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

document.getElementById('editServiceModal')?.addEventListener('hidden.bs.modal', () => {
  const desc = document.getElementById('edit_fs_description');
  if (desc) desc.value = '';
  const c = document.getElementById('editSvcDescCount');
  if (c) c.textContent = '0 / 500 ký tự';
});

function openEditServiceModal(id) {
    api.get('/services/' + id)
        .then(s => {
            document.getElementById('edit_fs_id').value = s.id;
            document.getElementById('edit_fs_title').value = s.title;
            document.getElementById('edit_fs_category').value = s.category;
            document.getElementById('edit_fs_price').value = s.price;
            document.getElementById('edit_fs_image').value = s.image || '';
            document.getElementById('edit_fs_description').value = s.description;
            
            const countEl = document.getElementById('editSvcDescCount');
            if (countEl) {
                countEl.textContent = `${(s.description || '').length} / 500 ký tự`;
            }
            
            // Remove previous invalid classes
            ['edit_fs_title', 'edit_fs_category', 'edit_fs_price', 'edit_fs_image', 'edit_fs_description'].forEach(fieldId => {
                const el = document.getElementById(fieldId);
                if (el) el.classList.remove('is-invalid');
            });
            
            const modalEl = document.getElementById('editServiceModal');
            new bootstrap.Modal(modalEl).show();
        })
        .catch(err => {
            console.error(err);
            Utils.showToast('Không thể tải thông tin dịch vụ: ' + err.message, 'error');
        });
}

function openEditBidModal(id) {
    api.get('/bids/' + id)
        .then(bid => {
            const project = Array.isArray(cachedJobs) ? cachedJobs.find(j => String(j.id) === String(bid.projectId)) : null;
            document.getElementById('editBidId').value = bid.id;
            document.getElementById('editBidProjectTitle').textContent = project ? project.title : `Dự án #${bid.projectId}`;
            document.getElementById('editBidProjectBudget').textContent = `Ngân sách dự kiến: ${project ? Utils.formatCurrency(project.budget) : 'N/A'}`;
            document.getElementById('editBidPrice').value = bid.price;
            document.getElementById('editBidMessage').value = bid.message || '';
            
            // Remove previous invalid classes
            ['editBidPrice', 'editBidMessage'].forEach(fieldId => {
                const el = document.getElementById(fieldId);
                if (el) el.classList.remove('is-invalid');
            });
            
            const modalEl = document.getElementById('editBidModal');
            new bootstrap.Modal(modalEl).show();
        })
        .catch(err => {
            console.error(err);
            Utils.showToast('Không thể tải thông tin báo giá: ' + err.message, 'error');
        });
}

function openProjectDetailsDrawer(p) {
    const title = p.title;
    const skillsHtml = (p.requiredSkills || '').split(',').filter(s => s.trim()).map(s => `<span class="badge bg-secondary bg-opacity-10 text-dark border me-1">${s.trim()}</span>`).join('');
    const contentHtml = `
        <div class="p-2">
            <div class="mb-4 d-flex gap-2">
                <span class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-bold">
                    Ngân sách: ${Utils.formatCurrency(p.budget)}
                </span>
                <span class="badge bg-secondary bg-opacity-10 text-dark border px-3 py-2 rounded-pill fw-semibold">
                    ${p.category || 'N/A'}
                </span>
            </div>
            <div class="mb-4">
                <h6 class="fw-bold text-dark border-bottom pb-2">Kỹ năng yêu cầu</h6>
                <div>${skillsHtml || '<span class="text-muted">Không yêu cầu kỹ năng đặc biệt</span>'}</div>
            </div>
            <div class="mb-4">
                <h6 class="fw-bold text-dark border-bottom pb-2">Mô tả dự án</h6>
                <p class="text-secondary" style="line-height: 1.6;">${p.description || 'Chưa có mô tả.'}</p>
            </div>
            <div class="mb-4">
                <h6 class="fw-bold text-dark border-bottom pb-2">Chi tiết công việc</h6>
                <p class="text-secondary" style="line-height: 1.6; white-space: pre-line;">${p.detailedScope || 'Không có mô tả chi tiết.'}</p>
            </div>
            <div class="row g-3 mb-4 p-3 bg-light rounded-4">
                <div class="col-6 border-end">
                    <span class="d-block text-muted small">Hạn chót bàn giao</span>
                    <strong class="text-dark"><i class="bi bi-calendar-event me-1"></i>${p.deadline || 'N/A'}</strong>
                </div>
                <div class="col-6 ps-3">
                    <span class="d-block text-muted small">Tài liệu đính kèm</span>
                    ${p.attachments ? `<a href="${p.attachments}" target="_blank" class="btn btn-sm btn-outline-primary mt-1 py-1 px-3"><i class="bi bi-file-earmark-arrow-down"></i> Xem tệp</a>` : '<span class="text-secondary small">Không có tệp đính kèm</span>'}
                </div>
            </div>
            <button class="btn btn-primary w-100 py-3 rounded-pill fw-bold btn-drawer-bid" data-id="${p.id}" data-title="${p.title}" data-budget="${Utils.formatCurrency(p.budget)}">
                <i class="bi bi-send-fill me-2"></i> Gửi Báo Giá
            </button>
        </div>
    `;
    
    const drawer = document.getElementById('quickDetailDrawer');
    const drawerTitle = document.getElementById('quickDrawerTitle');
    const drawerBody = document.getElementById('quickDrawerBody');
    
    if (drawer && drawerTitle && drawerBody) {
        drawerTitle.textContent = "Chi Tiết Dự Án";
        drawerBody.innerHTML = contentHtml;
        drawer.classList.add('open');
    }
}

function closeQuickDrawer() {
    const drawer = document.getElementById('quickDetailDrawer');
    if (drawer) {
        drawer.classList.remove('open');
    }
}

// Attach quick drawer events
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeQuickDrawerBtn')?.addEventListener('click', closeQuickDrawer);
    
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-drawer-bid');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            const budget = btn.getAttribute('data-budget');
            closeQuickDrawer();
            
            const modalEl = document.getElementById('submitBidModal');
            if (modalEl) {
                document.getElementById('bid_project_id').value = id;
                document.getElementById('bid_project_title').value = title;
                document.getElementById('bid_project_budget').value = budget;
                new bootstrap.Modal(modalEl).show();
            }
        }
    });
});

function drawSparkline(canvasId, data, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    // Check if Chart instance already exists to avoid re-creation errors
    let existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                data: data,
                borderColor: color,
                borderWidth: 1.5,
                fill: false,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
