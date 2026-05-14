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
        api.get('/projects')
            .then(projects => {
                allProjects = projects;
                allOpenProjects = projects.filter(p => p.status === 'open');
                
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
            container.innerHTML = '<div class="text-center text-muted">Hiện chưa có dự án nào đang mở.</div>';
            return;
        }

        projects.forEach(p => {
            const skillsHtml = p.requiredSkills 
                ? p.requiredSkills.split(',').map(s => `<span class="badge bg-secondary bg-opacity-10 text-dark border me-1">${s.trim()}</span>`).join('') 
                : '';

            const cardHTML = `
                <div class="card mb-3 border border-light bg-light rounded-4">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="fw-bold text-primary mb-1">${p.title}</h5>
                                <p class="text-muted small mb-2">${p.description}</p>
                                ${skillsHtml}
                            </div>
                            <div class="text-end ms-3">
                                <h4 class="fw-bold text-dark mb-2" style="white-space: nowrap;">${Utils.formatCurrency(p.budget)}</h4>
                                <button class="btn btn-primary fw-bold px-4 rounded-pill btn-open-bid-modal" 
                                    data-id="${p.id}" 
                                    data-title="${p.title}" 
                                    data-budget="${Utils.formatCurrency(p.budget)}">
                                    Gửi Báo Giá
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
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Bạn chưa gửi báo giá nào.</td></tr>';
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

    // Khởi chạy khi load trang
    loadOpenProjects();
    
    // Gọi lại loadMyBids sau 1s để đảm bảo loadOpenProjects đã lấy được allProjects để map tên (giải pháp đơn giản)
    setTimeout(loadMyBids, 500); 
});
