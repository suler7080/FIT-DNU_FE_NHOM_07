/**
 * RANKINGS.JS - Xử lý logic hiển thị Bảng Xếp Hạng Freelancer (Top 5)
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

// Dữ liệu Top 5 mặc định (dùng làm fallback nếu MockAPI trống hoặc chưa đủ 5 người)
const MOCK_TOP_FREELANCERS = [
    {
        name: "Nguyễn Văn A",
        category: "Thiết kế Web (Frontend)",
        rating: 5.0,
        completedJobs: 28,
        email: "nguyenvana@gmail.com"
    },
    {
        name: "Trần Thị B",
        category: "Thiết kế Đồ Họa & UI/UX",
        rating: 4.9,
        completedJobs: 42,
        email: "tranthib@gmail.com"
    },
    {
        name: "Phạm Minh C",
        category: "Digital Marketing & SEO",
        rating: 4.8,
        completedJobs: 19,
        email: "phamminhc@gmail.com"
    },
    {
        name: "Lê Hoàng D",
        category: "Dịch Thuật & Nội dung",
        rating: 4.7,
        completedJobs: 15,
        email: "lehoangd@gmail.com"
    },
    {
        name: "Vũ Thị E",
        category: "Lập trình Di Động",
        rating: 4.6,
        completedJobs: 11,
        email: "vuthie@gmail.com"
    }
];

// Hàm lấy icon phù hợp cho mỗi Bậc Rank/Level
function getLevelIcon(levelName) {
    if (levelName === 'Diamond') return 'bi-gem';
    if (levelName === 'Platinum') return 'bi-shield-shaded';
    if (levelName === 'Gold') return 'bi-award-fill';
    return 'bi-award';
}

// Hàm render thẻ danh hiệu/level badge
function renderBadgeHtml(completedJobs) {
    const lvl = Utils.getFreelancerLevel(completedJobs);
    const icon = getLevelIcon(lvl.level);
    return `<span class="freelancer-badge ${lvl.className}"><i class="bi ${icon} me-1"></i>${lvl.label}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadRankings();
});

function loadRankings() {
    // Tải đồng thời users, jobs, services, requests để tính toán số dự án hoàn thành thực tế
    Promise.all([
        api.get('/users'),
        api.get('/jobs'),
        api.get('/services'),
        api.get('/requests')
    ])
    .then(([users, jobs, services, requests]) => {
        const safeUsers = Array.isArray(users) ? users : [];
        const safeJobs = Array.isArray(jobs) ? jobs : [];
        const safeServices = Array.isArray(services) ? services : [];
        const safeRequests = Array.isArray(requests) ? requests : [];

        // Lọc ra các Freelancers
        const freelancers = safeUsers.filter(u => u.role === 'freelancer');
        
        // Tính toán số lượng dự án hoàn thành từ dữ liệu thực tế
        const freelancersWithStats = freelancers.map(f => {
            // 1. Số dự án hoàn thành trong danh mục Jobs (Contracts)
            const completedJobsCount = safeJobs.filter(j => String(j.freelancerId) === String(f.id) && j.status === 'completed').length;
            
            // 2. Số yêu cầu dịch vụ hoàn thành trong danh mục Requests
            const freelancerServicesIds = safeServices.filter(s => String(s.freelancerId) === String(f.id)).map(s => String(s.id));
            const completedRequestsCount = safeRequests.filter(r => freelancerServicesIds.includes(String(r.serviceId)) && r.status === 'completed').length;
            
            const totalCompleted = completedJobsCount + completedRequestsCount;

            return {
                name: f.name,
                category: f.category ? f.category.trim() : "", // Chuyên môn để trống nếu freelancer không cập nhật
                rating: parseFloat(f.rating) || 0.0,
                completedJobs: totalCompleted,
                email: f.email
            };
        });

        // Sắp xếp theo số dự án đã hoàn thành (số lượng lớn hơn xếp trên, rating làm khóa phụ)
        freelancersWithStats.sort((a, b) => {
            if (b.completedJobs !== a.completedJobs) {
                return b.completedJobs - a.completedJobs;
            }
            return b.rating - a.rating;
        });

        // Lấy Top 5
        let finalRankings = [];
        
        if (freelancersWithStats.length >= 5) {
            finalRankings = freelancersWithStats.slice(0, 5);
        } else {
            // Nếu dữ liệu DB chưa đủ 5 freelancer, dùng dữ liệu mock để điền đầy
            finalRankings = [...MOCK_TOP_FREELANCERS];
            
            // Sắp xếp mock freelancer theo completedJobs giảm dần
            finalRankings.sort((a, b) => b.completedJobs - a.completedJobs);
            
            // Đè dữ liệu thật lên các vị trí đầu
            freelancersWithStats.forEach((f, idx) => {
                if (idx < 5) {
                    finalRankings[idx] = f;
                }
            });
            
            // Sắp xếp lại toàn bộ để đảm bảo thứ tự chính xác
            finalRankings.sort((a, b) => {
                if (b.completedJobs !== a.completedJobs) {
                    return b.completedJobs - a.completedJobs;
                }
                return b.rating - a.rating;
            });
        }

        // Render giao diện
        renderPodium(finalRankings.slice(0, 3));
        renderRankingsTable(finalRankings);
    })
    .catch(err => {
        console.error("Lỗi khi tải bảng xếp hạng thực tế:", err);
        // Fallback sang dữ liệu mock hoàn toàn nếu lỗi API
        renderPodium(MOCK_TOP_FREELANCERS.slice(0, 3));
        renderRankingsTable(MOCK_TOP_FREELANCERS);
    });
}

// Hàm render Bục Vinh Quang Top 3 (Thứ tự hiển thị: Hạng 2 -> Hạng 1 -> Hạng 3)
function renderPodium(top3) {
    const podiumContainer = document.getElementById('leaderboardPodium');
    if (!podiumContainer || top3.length < 3) return;

    const f1 = top3[0];
    const f2 = top3[1];
    const f3 = top3[2];

    podiumContainer.innerHTML = `
        <!-- Hạng 2 -->
        <div class="podium-col order-1">
            <div class="podium-avatar">
                ${f2.name.charAt(0).toUpperCase()}
            </div>
            <h5 class="fw-bold mb-1">${Utils.escapeHtml(f2.name)}</h5>
            <p class="text-muted small mb-1">${Utils.escapeHtml(f2.category) || '&nbsp;'}</p>
            <div class="mb-3 small">
                ${renderBadgeHtml(f2.completedJobs)}
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f2.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-2">
                2
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>

        <!-- Hạng 1 -->
        <div class="podium-col order-2">
            <div class="podium-avatar podium-avatar-1 position-relative">
                <span class="podium-crown">👑</span>
                ${f1.name.charAt(0).toUpperCase()}
            </div>
            <h4 class="fw-bold mb-1 text-primary">${Utils.escapeHtml(f1.name)}</h4>
            <p class="text-muted small mb-1">${Utils.escapeHtml(f1.category) || '&nbsp;'}</p>
            <div class="mb-3">
                ${renderBadgeHtml(f1.completedJobs)}
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f1.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-1">
                1
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>

        <!-- Hạng 3 -->
        <div class="podium-col order-3">
            <div class="podium-avatar">
                ${f3.name.charAt(0).toUpperCase()}
            </div>
            <h5 class="fw-bold mb-1">${Utils.escapeHtml(f3.name)}</h5>
            <p class="text-muted small mb-1">${Utils.escapeHtml(f3.category) || '&nbsp;'}</p>
            <div class="mb-3 small">
                ${renderBadgeHtml(f3.completedJobs)}
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f3.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-3">
                3
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>
    `;
}

// Hàm render Bảng Xếp Hạng Top 5 đầy đủ
function renderRankingsTable(rankings) {
    const tbody = document.getElementById('rankingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = rankings.map((f, idx) => {
        const rank = idx + 1;
        
        let rankBadgeClass = 'rank-other-badge';
        if (rank === 1) rankBadgeClass = 'rank-1-badge';
        else if (rank === 2) rankBadgeClass = 'rank-2-badge';
        else if (rank === 3) rankBadgeClass = 'rank-3-badge';

        return `
            <tr>
                <td>
                    <span class="rank-badge ${rankBadgeClass}">${rank}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style="width: 38px; height: 38px; font-size: 14px;">
                            ${f.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span class="fw-bold text-dark d-block">${Utils.escapeHtml(f.name)}</span>
                            <span class="text-muted d-block" style="font-size: 11px;">${Utils.escapeHtml(f.email || '')}</span>
                        </div>
                    </div>
                </td>
                <td><span class="fw-semibold text-secondary small">${Utils.escapeHtml(f.category) || ''}</span></td>
                <td>
                    <div class="d-flex align-items-center gap-1 text-warning">
                        <i class="bi bi-star-fill"></i>
                        <span class="fw-bold text-dark" style="font-size: 13px;">${f.rating.toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    ${renderBadgeHtml(f.completedJobs)}
                </td>
                <td class="text-end fw-bold text-dark" style="font-size: 13px;">${f.completedJobs} dự án</td>
            </tr>
        `;
    }).join('');
}
