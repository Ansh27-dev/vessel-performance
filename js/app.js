// ============================================================
// APP.JS - Main Application Controller
// Navigation, page rendering, state management
// ============================================================

const App = (() => {
    let currentPage = 'dashboard';
    let sidebarCollapsed = false;

    const pages = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'performance', label: 'Performance', icon: 'fa-gauge-high' },
        { id: 'fuel', label: 'Fuel Analytics', icon: 'fa-gas-pump' },
        { id: 'weather', label: 'Weather Intel', icon: 'fa-cloud-bolt' },
        { id: 'optimization', label: 'Route Optimizer', icon: 'fa-route' },
        { id: 'commercial', label: 'Commercial', icon: 'fa-file-invoice-dollar' },
        { id: 'reports', label: 'Reports', icon: 'fa-file-lines' },
        { id: 'planner', label: 'Voyage Planner', icon: 'fa-compass' }
    ];

    // --- Initialize App ---
    function init() {
        renderShell();
        navigateTo('dashboard');
        document.addEventListener('keydown', e => {
            if (e.key === '[') toggleSidebar();
        });
    }

    // --- Render App Shell ---
    function renderShell() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <aside id="sidebar" class="sidebar">
                <div class="sidebar-brand">
                    <div class="brand-icon"><i class="fas fa-ship"></i></div>
                    <span class="brand-text">VoyageIQ</span>
                </div>
                <nav class="sidebar-nav">
                    ${pages.map(p => `
                        <button class="nav-item" data-page="${p.id}" id="nav-${p.id}" onclick="App.navigateTo('${p.id}')">
                            <i class="fas ${p.icon}"></i>
                            <span class="nav-label">${p.label}</span>
                        </button>
                    `).join('')}
                </nav>
                <div class="sidebar-footer">
                    <button class="nav-item toggle-btn" onclick="App.toggleSidebar()">
                        <i class="fas fa-angles-left" id="toggle-icon"></i>
                        <span class="nav-label">Collapse</span>
                    </button>
                </div>
            </aside>
            <main id="main-content" class="main-content">
                <header class="top-header">
                    <div class="header-left">
                        <h2 id="page-title" class="page-title">Dashboard</h2>
                        <span class="header-breadcrumb" id="breadcrumb">Fleet Overview</span>
                    </div>
                    <div class="header-right">
                        <div class="vessel-badge">
                            <i class="fas fa-ship"></i>
                            <span>${VesselData.vesselInfo.name}</span>
                            <span class="badge-route">${VesselData.voyageInfo.departure} → ${VesselData.voyageInfo.arrival}</span>
                        </div>
                        <div class="header-notification" onclick="App.showAlerts()">
                            <i class="fas fa-bell"></i>
                            <span class="notif-badge">${VesselData.alerts.length}</span>
                        </div>
                    </div>
                </header>
                <div id="page-content" class="page-content"></div>
            </main>
            <div id="alert-panel" class="alert-panel hidden">
                <div class="alert-panel-header">
                    <h3>Notifications</h3>
                    <button onclick="App.hideAlerts()"><i class="fas fa-xmark"></i></button>
                </div>
                <div class="alert-panel-body">
                    ${VesselData.alerts.map(a => `
                        <div class="alert-item alert-${a.type}">
                            <div class="alert-icon"><i class="fas ${a.icon}"></i></div>
                            <div class="alert-content">
                                <div class="alert-title">${a.title}</div>
                                <div class="alert-message">${a.message}</div>
                                <div class="alert-time">${a.time}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- Navigation ---
    function navigateTo(pageId) {
        currentPage = pageId;
        const content = document.getElementById('page-content');
        const pageConf = pages.find(p => p.id === pageId);

        // Update nav active state
        document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.remove('active'));
        const navEl = document.getElementById(`nav-${pageId}`);
        if (navEl) navEl.classList.add('active');

        // Update header
        document.getElementById('page-title').textContent = pageConf ? pageConf.label : 'Dashboard';
        document.getElementById('breadcrumb').textContent = getBreadcrumb(pageId);

        // Fade transition
        content.classList.add('page-exit');
        setTimeout(() => {
            Charts.destroyAll();
            content.innerHTML = getPageHTML(pageId);
            content.classList.remove('page-exit');
            content.classList.add('page-enter');
            setTimeout(() => {
                content.classList.remove('page-enter');
                initPageCharts(pageId);
            }, 50);
        }, 200);
    }

    function getBreadcrumb(pageId) {
        const map = {
            dashboard: 'Fleet Overview',
            performance: `${VesselData.vesselInfo.name} · ${VesselData.voyageInfo.periodStart} to ${VesselData.voyageInfo.periodEnd}`,
            fuel: 'Consumption & ROB Analytics',
            weather: 'Weather Conditions & Risk Assessment',
            optimization: 'Route Planning & Alternatives',
            commercial: 'CP Compliance & Claim Intelligence',
            reports: 'Auto-Generated Performance Reports',
            planner: 'Plan New Voyage'
        };
        return map[pageId] || '';
    }

    // --- Toggle Sidebar ---
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
        document.getElementById('main-content').classList.toggle('sidebar-collapsed', sidebarCollapsed);
        const icon = document.getElementById('toggle-icon');
        icon.className = sidebarCollapsed ? 'fas fa-angles-right' : 'fas fa-angles-left';
    }

    function showAlerts() { document.getElementById('alert-panel').classList.remove('hidden'); }
    function hideAlerts() { document.getElementById('alert-panel').classList.add('hidden'); }

    // =============================================
    // PAGE HTML GENERATORS
    // =============================================

    function getPageHTML(page) {
        switch (page) {
            case 'dashboard': return dashboardHTML();
            case 'performance': return performanceHTML();
            case 'fuel': return fuelHTML();
            case 'weather': return weatherHTML();
            case 'optimization': return optimizationHTML();
            case 'commercial': return commercialHTML();
            case 'reports': return reportsHTML();
            case 'planner': return plannerHTML();
            default: return dashboardHTML();
        }
    }

    // ----------- DASHBOARD -----------
    function dashboardHTML() {
        const k = VesselData.kpis;
        const v = VesselData.voyageInfo;
        return `
        <div class="upload-section">
            <div class="upload-zone" id="upload-zone"
                 ondragover="event.preventDefault(); this.classList.add('drag-over')"
                 ondragleave="this.classList.remove('drag-over')"
                 ondrop="event.preventDefault(); this.classList.remove('drag-over'); App.handleFileDrop(event)">
                <div class="upload-visual">
                    <div class="upload-icon-ring"><i class="fas fa-cloud-arrow-up"></i></div>
                    <div class="upload-text">
                        <h3>Upload Noon Report</h3>
                        <p>Drag & drop your <strong>.xlsx</strong> file here, or <label for="excel-file-input" class="upload-browse">browse files</label></p>
                    </div>
                </div>
                <input type="file" id="excel-file-input" accept=".xlsx,.xls" onchange="App.handleFileSelect(event)" hidden>
            </div>
            <div id="upload-status" class="upload-status hidden"></div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(0,212,255,0.12);color:#00d4ff"><i class="fas fa-ship"></i></div>
                <div class="kpi-data"><span class="kpi-value">${k.activeVessels}</span><span class="kpi-label">Active Vessels</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-gauge-high"></i></div>
                <div class="kpi-data"><span class="kpi-value">${v.averageSpeed} <small>kts</small></span><span class="kpi-label">Avg Speed (CP ${v.cpSpeed})</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(16,185,129,0.12);color:#10b981"><i class="fas fa-leaf"></i></div>
                <div class="kpi-data"><span class="kpi-value">${k.fuelEfficiencyScore}%</span><span class="kpi-label">Fuel Efficiency Score</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(124,58,237,0.12);color:#7c3aed"><i class="fas fa-calendar-days"></i></div>
                <div class="kpi-data"><span class="kpi-value">${k.daysAtSea} <small>days</small></span><span class="kpi-label">Reporting Period</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-anchor"></i></div>
                <div class="kpi-data"><span class="kpi-value">${v.idleDays} <small>days</small></span><span class="kpi-label">Idle at Anchor</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon" style="background:rgba(34,197,94,0.12);color:#22c55e"><i class="fas fa-piggy-bank"></i></div>
                <div class="kpi-data"><span class="kpi-value">${k.fuelSaved} <small>MT</small></span><span class="kpi-label">Fuel Saved ($${k.fuelSavedCost})</span></div>
            </div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Speed Trend</h3><span class="card-badge">9 Days</span></div>
                <div class="chart-container mini-chart"><canvas id="dash-speed-sparkline"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Daily Fuel Consumption</h3><span class="card-badge">LSFO MT</span></div>
                <div class="chart-container mini-chart"><canvas id="dash-fuel-bar"></canvas></div>
            </div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>LSFO ROB</h3></div>
                <div class="chart-container mini-chart"><canvas id="dash-rob-gauge"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Active Voyage</h3></div>
                <div class="voyage-status-card">
                    <div class="voyage-route">
                        <span class="port-tag departure"><i class="fas fa-play"></i> ${v.departure}</span>
                        <span class="route-line"><i class="fas fa-arrow-right"></i></span>
                        <span class="port-tag arrival"><i class="fas fa-anchor"></i> ${v.arrival}</span>
                    </div>
                    <div class="voyage-meta-grid">
                        <div><span class="meta-label">Distance</span><span class="meta-value">${v.totalDistance} nm</span></div>
                        <div><span class="meta-label">Condition</span><span class="meta-value">${v.condition}</span></div>
                        <div><span class="meta-label">Status</span><span class="meta-value status-${v.status.toLowerCase()}">${v.status}</span></div>
                        <div><span class="meta-label">Period</span><span class="meta-value">22-30 Apr 2026</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Recent Alerts</h3></div>
            <div class="alerts-list">
                ${VesselData.alerts.slice(0, 4).map(a => `
                    <div class="alert-row alert-${a.type}">
                        <div class="alert-row-icon"><i class="fas ${a.icon}"></i></div>
                        <div class="alert-row-text"><strong>${a.title}</strong><br/><span>${a.message}</span></div>
                        <div class="alert-row-time">${a.time}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Quick Navigation</h3></div>
            <div class="quick-nav-grid">
                ${pages.filter(p => p.id !== 'dashboard').map(p => `
                    <button class="quick-nav-btn" onclick="App.navigateTo('${p.id}')">
                        <i class="fas ${p.icon}"></i><span>${p.label}</span>
                    </button>
                `).join('')}
            </div>
        </div>`;
    }

    // ----------- PERFORMANCE -----------
    function performanceHTML() {
        const score = Analytics.getPerformanceScore();
        const speed = Analytics.getSpeedPerformance();
        return `
        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Performance Score</h3><span class="card-badge grade-${score.grade.toLowerCase()}">${score.grade}</span></div>
                <div class="chart-container" style="height:220px"><canvas id="perf-gauge"></canvas></div>
                <div class="score-breakdown">
                    <div class="score-item"><span>Fuel Efficiency</span><div class="score-bar"><div style="width:${score.fuel}%;background:#10b981"></div></div><span>${score.fuel}%</span></div>
                    <div class="score-item"><span>Speed (Steaming)</span><div class="score-bar"><div style="width:${score.speed}%;background:#00d4ff"></div></div><span>${score.speed}%</span></div>
                    <div class="score-item"><span>Weather Impact</span><div class="score-bar"><div style="width:${score.weather}%;background:#22c55e"></div></div><span>${score.weather}%</span></div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Why Performance Deviated</h3></div>
                <div class="deviation-list">
                    ${VesselData.deviationAnalysis.map(d => `
                        <div class="deviation-item dev-${d.severity}">
                            <div class="dev-icon"><i class="fas ${d.icon}"></i></div>
                            <div class="dev-body">
                                <div class="dev-title">${d.title}</div>
                                <div class="dev-detail">${d.detail}</div>
                                <div class="dev-impact"><strong>Impact:</strong> ${d.impact}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Speed — Actual vs CP Warranted</h3><span class="card-badge">CP ${speed.cpSpeed} kts</span></div>
            <div class="chart-container"><canvas id="perf-speed-chart"></canvas></div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Daily LSFO Consumption (Stacked)</h3></div>
                <div class="chart-container"><canvas id="perf-fuel-stacked"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Speed vs RPM</h3></div>
                <div class="chart-container"><canvas id="perf-speed-rpm"></canvas></div>
            </div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>LSFO ROB Drawdown</h3></div>
                <div class="chart-container"><canvas id="perf-rob-drawdown"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>MGO ROB Trend</h3></div>
                <div class="chart-container"><canvas id="perf-mgo-trend"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Noon Report Data</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Date</th><th>Position</th><th>Operation</th><th>Dist (nm)</th><th>Avg Spd</th><th>CP Spd</th><th>RPM</th><th>Slip %</th><th>BF</th><th>Location</th></tr></thead>
                    <tbody>
                        ${VesselData.noonReports.map(r => `
                            <tr class="op-${r.operation.toLowerCase().replace(/[^a-z]/g,'')}">
                                <td>${r.dateShort}</td><td>${r.latStr}, ${r.lngStr}</td><td><span class="op-badge op-${r.operation.toLowerCase().includes('idle')?'idle':'steam'}">${r.operation}</span></td>
                                <td class="num">${r.distance}</td><td class="num">${r.avgSpeed || '-'}</td><td class="num">${r.cpSpeed}</td>
                                <td class="num">${r.rpm || '-'}</td><td class="num">${r.slip || '-'}</td><td class="num">${r.beaufort !== null ? r.beaufort : '-'}</td><td>${r.location}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ----------- FUEL ANALYTICS -----------
    function fuelHTML() {
        const idle = Analytics.getIdleFuelCost();
        const b = VesselData.bunkerSummary;
        return `
        <div class="kpi-grid kpi-4col">
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(0,212,255,0.12);color:#00d4ff"><i class="fas fa-fire"></i></div><div class="kpi-data"><span class="kpi-value">${b.lsfo.totalConsumed} <small>MT</small></span><span class="kpi-label">Total LSFO Consumed</span></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(239,68,68,0.12);color:#ef4444"><i class="fas fa-bullseye"></i></div><div class="kpi-data"><span class="kpi-value">${b.lsfo.warranted} <small>MT</small></span><span class="kpi-label">Warranted LSFO</span></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(34,197,94,0.12);color:#22c55e"><i class="fas fa-piggy-bank"></i></div><div class="kpi-data"><span class="kpi-value">${b.lsfo.saved} <small>MT</small></span><span class="kpi-label">LSFO Saved</span></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-droplet"></i></div><div class="kpi-data"><span class="kpi-value">${b.mgo.totalConsumed} <small>MT</small></span><span class="kpi-label">Total MGO Consumed</span></div></div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>LSFO by System</h3></div>
                <div class="chart-container" style="height:280px"><canvas id="fuel-donut"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Time Utilization</h3></div>
                <div class="chart-container" style="height:280px"><canvas id="fuel-time-pie"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Daily Consumption by Component</h3></div>
            <div class="chart-container"><canvas id="fuel-stacked-area"></canvas></div>
        </div>

        <div class="card">
            <div class="card-header"><h3>ROB Drawdown — LSFO & MGO</h3></div>
            <div class="chart-container"><canvas id="fuel-rob-dual"></canvas></div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Actual vs Warranted Consumption</h3></div>
                <div class="chart-container"><canvas id="fuel-vs-warranted"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Idle Fuel Cost Analysis</h3></div>
                <div class="idle-cost-panel">
                    <div class="idle-stat"><span class="idle-label">Idle Days (Sungai Linggi)</span><span class="idle-value">${idle.days} days</span></div>
                    <div class="idle-stat"><span class="idle-label">Total LSFO Burned (Idle)</span><span class="idle-value">${idle.totalLSFO} MT</span></div>
                    <div class="idle-stat"><span class="idle-label">Avg Daily Idle Rate</span><span class="idle-value">${idle.avgDailyLSFO} MT/day</span></div>
                    <div class="idle-stat highlight"><span class="idle-label">Estimated Idle Fuel Cost</span><span class="idle-value cost">$${idle.totalCost.toLocaleString()}</span></div>
                    <div class="idle-note">
                        <i class="fas fa-info-circle"></i>
                        <span>7 days idle at anchor represents <strong>57%</strong> of total voyage fuel consumption. Reducing idle time is the primary fuel-saving opportunity for this vessel.</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Bunker ROB Summary</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Metric</th><th>LSFO (MT)</th><th>MGO (MT)</th></tr></thead>
                    <tbody>
                        <tr><td>Opening ROB</td><td class="num">${b.lsfo.opening}</td><td class="num">${b.mgo.opening}</td></tr>
                        <tr><td>Closing ROB</td><td class="num">${b.lsfo.closing}</td><td class="num">${b.mgo.closing}</td></tr>
                        <tr><td>Total Consumed</td><td class="num">${b.lsfo.totalConsumed}</td><td class="num">${b.mgo.totalConsumed}</td></tr>
                        <tr><td>Warranted</td><td class="num">${b.lsfo.warranted}</td><td class="num">—</td></tr>
                        <tr class="row-highlight"><td>Savings/(Excess)</td><td class="num positive">+${b.lsfo.saved}</td><td class="num">—</td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ----------- WEATHER INTELLIGENCE -----------
    function weatherHTML() {
        const w = Analytics.getWeatherAnalysis();
        return `
        <div class="card">
            <div class="card-header"><h3>Voyage Weather Map</h3><span class="card-badge">Singapore → Sungai Linggi</span></div>
            <div id="weather-map" class="map-container"></div>
        </div>

        <div class="card assessment-card success">
            <div class="assessment-icon"><i class="fas fa-check-circle"></i></div>
            <div class="assessment-body">
                <h4>Weather Impact Assessment</h4>
                <p>${w.weatherSummary}</p>
                <div class="assessment-stats">
                    <span>Max BF: ${w.maxBeaufort}</span>
                    <span>Avg BF: ${w.avgBeaufort}</span>
                    <span>Impact: ${w.weatherImpact}</span>
                </div>
            </div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Beaufort Scale — Daily</h3></div>
                <div class="chart-container"><canvas id="weather-bf"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Wind Speed (kts)</h3></div>
                <div class="chart-container"><canvas id="weather-wind"></canvas></div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Current Direction Index — Daily</h3></div>
            <div class="chart-container"><canvas id="weather-current"></canvas></div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Weather Risk Scoring</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Zone</th><th>Risk Level</th><th>Score</th><th>Description</th></tr></thead>
                    <tbody>
                        ${VoyageOptimizer.getWeatherRiskZones().map(z => `
                            <tr><td>${z.name}</td><td><span class="risk-badge risk-${z.risk.toLowerCase()}">${z.risk}</span></td><td class="num">${z.riskScore}/100</td><td>${z.description}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ----------- VOYAGE OPTIMIZATION -----------
    function optimizationHTML() {
        const routes = VoyageOptimizer.compareRoutes();
        const recs = VoyageOptimizer.getRecommendations();
        const segments = VoyageOptimizer.analyzeSegments('original');
        return `
        <div class="card">
            <div class="card-header"><h3>Route Comparison Map</h3><span class="card-badge">3 Routes Analyzed</span></div>
            <div id="optimization-map" class="map-container"></div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Route Comparison</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Rank</th><th>Route</th><th>Distance (nm)</th><th>ETA</th><th>Fuel Est. (MT)</th><th>Fuel Cost ($)</th><th>Weather Risk</th><th>Score</th></tr></thead>
                    <tbody>
                        ${routes.map(r => `
                            <tr class="${r.rank===1?'row-highlight':''}">
                                <td><span class="rank-badge rank-${r.rank}">#${r.rank}</span></td>
                                <td><span style="color:${r.color};font-weight:600">${r.name}</span></td>
                                <td class="num">${r.distance}</td>
                                <td class="num">${r.etaCalc.display}</td>
                                <td class="num">${r.fuelCalc.total}</td>
                                <td class="num">$${r.fuelCalc.cost.toLocaleString()}</td>
                                <td><span class="risk-badge risk-${r.weatherRisk.toLowerCase().replace(' ','')}">${r.weatherRisk}</span></td>
                                <td class="num"><strong>${r.score}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Route Scoring Radar</h3></div>
                <div class="chart-container" style="height:320px"><canvas id="opt-radar"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>AI Recommendations</h3></div>
                <div class="rec-list">
                    ${recs.map(r => `
                        <div class="rec-item rec-${r.priority}">
                            <div class="rec-icon"><i class="fas ${r.icon}"></i></div>
                            <div class="rec-body">
                                <div class="rec-title">${r.title}</div>
                                <div class="rec-text">${r.recommendation}</div>
                                ${r.savings ? `<div class="rec-savings"><i class="fas fa-leaf"></i> ${r.savings}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Segment Analysis — Original Route</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Seg #</th><th>From</th><th>To</th><th>Distance (nm)</th><th>Bearing (°)</th><th>Weather Risk</th><th>Current Effect</th></tr></thead>
                    <tbody>
                        ${segments.map(s => `
                            <tr><td>${s.segmentNo}</td><td>${s.from}</td><td>${s.to}</td><td class="num">${s.distance}</td><td class="num">${s.bearing}°</td>
                            <td><span class="risk-badge risk-low">${s.weatherRisk}</span></td><td>${s.currentEffect}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ----------- COMMERCIAL INTELLIGENCE -----------
    function commercialHTML() {
        const ca = Analytics.getCommercialAnalysis();
        const cl = ca.claims;
        return `
        <div class="card assessment-card info">
            <div class="assessment-icon"><i class="fas fa-scale-balanced"></i></div>
            <div class="assessment-body">
                <h4>Charter Party Compliance Summary</h4>
                <p>Voyage VY-2026-0047 has been analyzed against CP terms. Fuel consumption was <strong>under warranted</strong>. Speed deviation is due to operational factors, not engine underperformance.</p>
            </div>
        </div>

        <div class="kpi-grid kpi-3col">
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(34,197,94,0.12);color:#22c55e"><i class="fas fa-check-circle"></i></div><div class="kpi-data"><span class="kpi-value">$${ca.fuelSavingsValue.toLocaleString()}</span><span class="kpi-label">Fuel Savings Value</span></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(0,212,255,0.12);color:#00d4ff"><i class="fas fa-gas-pump"></i></div><div class="kpi-data"><span class="kpi-value">$${ca.voyageFuelCost.toLocaleString()}</span><span class="kpi-label">Total Voyage Fuel Cost</span></div></div>
            <div class="kpi-card"><div class="kpi-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b"><i class="fas fa-clock"></i></div><div class="kpi-data"><span class="kpi-value">7 <small>days</small></span><span class="kpi-label">Idle Time (Off-Hire Review)</span></div></div>
        </div>

        <div class="claims-grid">
            <div class="claim-card claim-${cl.speed.verdictClass}">
                <div class="claim-header"><i class="fas fa-gauge-high"></i> Speed Claim Analysis</div>
                <div class="claim-metrics">
                    <div><span class="cm-label">Warranted</span><span class="cm-value">${cl.speed.warranted} kts</span></div>
                    <div><span class="cm-label">Actual</span><span class="cm-value">${cl.speed.actual} kts</span></div>
                    <div><span class="cm-label">Deviation</span><span class="cm-value">${cl.speed.deviation}%</span></div>
                </div>
                <div class="claim-verdict"><span class="verdict-badge verdict-${cl.speed.verdictClass}">${cl.speed.verdict}</span></div>
                <div class="claim-explain">${cl.speed.explanation}</div>
            </div>
            <div class="claim-card claim-${cl.fuel.verdictClass}">
                <div class="claim-header"><i class="fas fa-gas-pump"></i> Fuel Claim Analysis</div>
                <div class="claim-metrics">
                    <div><span class="cm-label">Warranted</span><span class="cm-value">${cl.fuel.warranted} MT</span></div>
                    <div><span class="cm-label">Actual</span><span class="cm-value">${cl.fuel.actual} MT</span></div>
                    <div><span class="cm-label">Saved</span><span class="cm-value positive">+${cl.fuel.saved} MT</span></div>
                </div>
                <div class="claim-verdict"><span class="verdict-badge verdict-${cl.fuel.verdictClass}">${cl.fuel.verdict}</span></div>
                <div class="claim-explain">${cl.fuel.explanation}</div>
            </div>
            <div class="claim-card claim-${cl.idleTime.verdictClass}">
                <div class="claim-header"><i class="fas fa-anchor"></i> Off-Hire / Idle Time Analysis</div>
                <div class="claim-metrics">
                    <div><span class="cm-label">Idle Days</span><span class="cm-value">${cl.idleTime.days} days</span></div>
                    <div><span class="cm-label">Location</span><span class="cm-value">${cl.idleTime.location}</span></div>
                    <div><span class="cm-label">Fuel Burned</span><span class="cm-value">${cl.idleTime.fuelConsumed} MT</span></div>
                </div>
                <div class="claim-verdict"><span class="verdict-badge verdict-${cl.idleTime.verdictClass}">${cl.idleTime.verdict}</span></div>
                <div class="claim-explain">${cl.idleTime.explanation}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>CP Compliance Scorecard</h3></div>
            <div class="chart-container"><canvas id="comm-compliance"></canvas></div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Actual vs Warranted</h3></div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Parameter</th><th>CP Warranted</th><th>Actual</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>Speed (Overall Avg)</td><td class="num">12.5 kts</td><td class="num">10.35 kts</td><td><span class="status-badge status-warning">Below — Ops Delays</span></td></tr>
                        <tr><td>Speed (Steaming Only)</td><td class="num">12.5 kts</td><td class="num">11.5 kts</td><td><span class="status-badge status-info">Maneuvering</span></td></tr>
                        <tr><td>Total LSFO</td><td class="num">49.5 MT</td><td class="num">46.987 MT</td><td><span class="status-badge status-success">Under Warranted ✓</span></td></tr>
                        <tr><td>Daily LSFO (Idle)</td><td class="num">5.5 MT/day</td><td class="num">3.84 MT/day</td><td><span class="status-badge status-success">Under Warranted ✓</span></td></tr>
                        <tr><td>Weather Impact</td><td class="num">BF ≤ 5</td><td class="num">BF 2-3</td><td><span class="status-badge status-success">Fair Weather ✓</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    // ----------- REPORTS -----------
    function reportsHTML() {
        const v = VesselData.voyageInfo;
        const b = VesselData.bunkerSummary;
        return `
        <div class="card report-card">
            <div class="report-header">
                <h2>VESSEL PERFORMANCE REPORT</h2>
                <div class="report-sub">${VesselData.vesselInfo.name} · ${v.condition} Voyage · ${v.departure} → ${v.arrival}</div>
                <div class="report-period">Period: 22 Apr – 30 Apr 2026 · Prepared: 30 Apr 2026</div>
            </div>

            <div class="report-summary-grid">
                <div class="rs-item"><span class="rs-label">Reporting Days</span><span class="rs-value">${v.totalDays}</span></div>
                <div class="rs-item"><span class="rs-label">Total Distance</span><span class="rs-value">${v.totalDistance} nm</span></div>
                <div class="rs-item"><span class="rs-label">Avg Speed (Stmg)</span><span class="rs-value">${v.averageSpeed} kts</span></div>
                <div class="rs-item"><span class="rs-label">CP Warranted</span><span class="rs-value">${v.cpSpeed} kts</span></div>
                <div class="rs-item"><span class="rs-label">Idle at Anchor</span><span class="rs-value">${v.idleDays} Days</span></div>
                <div class="rs-item"><span class="rs-label">LSFO Consumed</span><span class="rs-value">${b.lsfo.totalConsumed} MT</span></div>
                <div class="rs-item"><span class="rs-label">LSFO ROB (Close)</span><span class="rs-value">${b.lsfo.closing} MT</span></div>
                <div class="rs-item"><span class="rs-label">MGO Consumed</span><span class="rs-value">${b.mgo.totalConsumed} MT</span></div>
            </div>

            <h3 class="report-section-title">Voyage Summary — Actuals vs Warranted</h3>
            <div class="table-wrapper">
                <table class="data-table report-table">
                    <thead><tr><th>Date</th><th>Distance</th><th>Operation</th><th>Avg Speed</th><th>Status</th></tr></thead>
                    <tbody>
                        ${VesselData.voyageSummary.map(s => `
                            <tr><td>${s.date}</td><td class="num">${s.distance} nm</td><td>${s.operation}</td><td class="num">${s.speed} kts</td>
                            <td><span class="status-badge status-${s.flag==='idle'?'warning':'info'}">${s.remark}</span></td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h3 class="report-section-title">Engine Summary — ROB & Consumption</h3>
            <div class="table-wrapper">
                <table class="data-table report-table">
                    <thead><tr><th>Date</th><th>Operation</th><th>ME LSFO</th><th>AE LSFO</th><th>Boiler</th><th>Total LSFO</th><th>MGO</th><th>ROB LSFO</th><th>ROB MGO</th></tr></thead>
                    <tbody>
                        ${VesselData.engineFuelData.map(d => `
                            <tr><td>${d.dateShort}</td><td>${d.operation}</td>
                            <td class="num">${d.meLSFO}</td><td class="num">${d.aeLSFO}</td><td class="num">${d.boilerLSFO}</td>
                            <td class="num"><strong>${d.totalLSFO}</strong></td><td class="num">${d.mgo}</td>
                            <td class="num">${d.robLSFO}</td><td class="num">${d.robMGO}</td></tr>
                        `).join('')}
                        <tr class="row-total"><td><strong>TOTAL</strong></td><td></td>
                            <td class="num"><strong>12.477</strong></td><td class="num"><strong>25.05</strong></td><td class="num"><strong>9.46</strong></td>
                            <td class="num"><strong>46.987</strong></td><td class="num"><strong>4.274</strong></td><td></td><td></td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-footer">
                <p><strong>Confidential</strong> — VoyageIQ Vessel Performance Report · Auto-generated ${new Date().toLocaleDateString()}</p>
            </div>
        </div>`;
    }

    // ----------- VOYAGE PLANNER -----------
    function plannerHTML() {
        return `
        <div class="grid-2col">
            <div class="card">
                <div class="card-header"><h3>Plan New Voyage</h3></div>
                <div class="planner-form">
                    <div class="form-group">
                        <label>Departure Port</label>
                        <select id="plan-departure" class="form-input">
                            <option value="1.29,103.85">Singapore</option>
                            <option value="2.26,102.00">Sungai Linggi</option>
                            <option value="1.43,104.15">Pasir Gudang</option>
                            <option value="3.97,103.43">Kuantan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Arrival Port</label>
                        <select id="plan-arrival" class="form-input">
                            <option value="2.26,102.00">Sungai Linggi</option>
                            <option value="1.29,103.85">Singapore</option>
                            <option value="5.28,103.13">Kemaman</option>
                            <option value="3.97,103.43">Kuantan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Speed (kts)</label>
                        <select id="plan-speed" class="form-input">
                            <option value="12.5">12.5 kts (ECO)</option>
                            <option value="12.0">12.0 kts</option>
                            <option value="11.5">11.5 kts</option>
                            <option value="11.0">11.0 kts</option>
                            <option value="10.5">10.5 kts</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Condition</label>
                        <select id="plan-condition" class="form-input">
                            <option value="Ballast">Ballast</option>
                            <option value="Laden">Laden</option>
                        </select>
                    </div>
                    <button class="btn-primary" onclick="App.runPlanner()"><i class="fas fa-calculator"></i> Calculate Voyage</button>
                </div>
                <div id="planner-results" class="planner-results hidden"></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>Regional Port Map</h3></div>
                <div id="planner-map" class="map-container"></div>
            </div>
        </div>`;
    }

    // --- Planner Calculation ---
    function runPlanner() {
        const depVal = document.getElementById('plan-departure').value.split(',');
        const arrVal = document.getElementById('plan-arrival').value.split(',');
        const speed = parseFloat(document.getElementById('plan-speed').value);
        const condition = document.getElementById('plan-condition').value;
        const dep = { lat: parseFloat(depVal[0]), lng: parseFloat(depVal[1]) };
        const arr = { lat: parseFloat(arrVal[0]), lng: parseFloat(arrVal[1]) };
        const result = VoyageOptimizer.planVoyage(dep, arr, speed, condition);
        const el = document.getElementById('planner-results');
        el.classList.remove('hidden');
        el.innerHTML = `
            <h4>Voyage Estimate</h4>
            <div class="plan-result-grid">
                <div><span>Distance</span><strong>${result.distance} nm</strong></div>
                <div><span>ETA</span><strong>${result.eta.display}</strong></div>
                <div><span>Fuel (Total)</span><strong>${result.fuel.total} MT</strong></div>
                <div><span>Fuel Cost</span><strong>$${result.fuel.cost.toLocaleString()}</strong></div>
                <div><span>Speed</span><strong>${result.recommendedSpeed} kts</strong></div>
                <div><span>Weather</span><strong>${result.weatherOutlook}</strong></div>
            </div>
        `;
    }

    // =============================================
    // PAGE CHART INITIALIZATION
    // =============================================
    function initPageCharts(page) {
        setTimeout(() => {
            switch (page) {
                case 'dashboard':
                    Charts.createSpeedSparkline('dash-speed-sparkline');
                    Charts.createFuelMiniBar('dash-fuel-bar');
                    Charts.createROBGauge('dash-rob-gauge');
                    break;
                case 'performance':
                    Charts.createPerformanceGauge('perf-gauge');
                    Charts.createSpeedPerformanceChart('perf-speed-chart');
                    Charts.createFuelStackedBar('perf-fuel-stacked');
                    Charts.createSpeedRPMScatter('perf-speed-rpm');
                    Charts.createROBDrawdownChart('perf-rob-drawdown');
                    Charts.createMGOTrendChart('perf-mgo-trend');
                    break;
                case 'fuel':
                    Charts.createConsumptionDonut('fuel-donut');
                    Charts.createTimeUtilizationPie('fuel-time-pie');
                    Charts.createDailyStackedArea('fuel-stacked-area');
                    Charts.createROBDualAxis('fuel-rob-dual');
                    Charts.createConsumptionVsWarrantedBar('fuel-vs-warranted');
                    break;
                case 'weather':
                    Maps.createWeatherMap('weather-map');
                    Charts.createBeaufortChart('weather-bf');
                    Charts.createWindSpeedChart('weather-wind');
                    Charts.createCurrentChart('weather-current');
                    break;
                case 'optimization':
                    Maps.createOptimizationMap('optimization-map');
                    Charts.createRouteRadarChart('opt-radar');
                    break;
                case 'commercial':
                    Charts.createComplianceChart('comm-compliance');
                    break;
                case 'planner':
                    Maps.createPlannerMap('planner-map');
                    break;
            }
        }, 100);
    }

    // =============================================
    // EXCEL UPLOAD HANDLERS
    // =============================================

    function handleFileDrop(e) {
        const file = e.dataTransfer.files[0];
        if (file) processUploadedFile(file);
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) processUploadedFile(file);
    }

    async function processUploadedFile(file) {
        if (!file.name.match(/\.xlsx?$/i)) {
            showUploadStatus('error', '<i class="fas fa-circle-xmark"></i> Please upload an Excel file (.xlsx)');
            return;
        }
        showUploadStatus('loading', '<div class="upload-spinner"></div> Parsing ' + file.name + '...');
        const zone = document.getElementById('upload-zone');
        if (zone) zone.classList.add('processing');

        try {
            const result = await ExcelParser.parseFile(file);
            showUploadStatus('success',
                '<i class="fas fa-circle-check"></i> Loaded <strong>' + result.numDays + ' days</strong> of data from <strong>' + result.vesselName + '</strong> · ' + result.departure + ' → ' + result.arrival);
            if (zone) zone.classList.remove('processing');

            // Re-render the whole shell (header badge updates) then navigate to dashboard
            setTimeout(() => {
                renderShell();
                navigateTo('dashboard');
            }, 1200);
        } catch (err) {
            showUploadStatus('error', '<i class="fas fa-circle-xmark"></i> ' + err.message);
            if (zone) zone.classList.remove('processing');
        }
    }

    function showUploadStatus(type, html) {
        const el = document.getElementById('upload-status');
        if (!el) return;
        el.className = 'upload-status ' + type;
        el.innerHTML = html;
    }

    return { init, navigateTo, toggleSidebar, showAlerts, hideAlerts, runPlanner, handleFileDrop, handleFileSelect };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    // Loading screen
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('fade-out');
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
            App.init();
        }, 500);
    }, 1200);
});
