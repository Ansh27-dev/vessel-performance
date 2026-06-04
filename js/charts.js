// ============================================================
// CHARTS MODULE - Chart.js configurations and rendering
// All charts use real vessel data from data.js
// ============================================================

const Charts = (() => {
    const chartInstances = {};
    const chartColors = {
        primary: '#00d4ff',
        secondary: '#7c3aed',
        accent: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        success: '#22c55e',
        cyan: '#06b6d4',
        pink: '#ec4899',
        orange: '#f97316',
        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
        gridColor: 'rgba(255,255,255,0.06)',
        tooltipBg: 'rgba(10, 14, 39, 0.95)',
    };

    // --- Default Chart Options ---
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: chartColors.textPrimary,
                    font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 10
                }
            },
            tooltip: {
                backgroundColor: chartColors.tooltipBg,
                titleColor: chartColors.textPrimary,
                bodyColor: chartColors.textSecondary,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                titleFont: { family: "'Inter', sans-serif", size: 13, weight: 600 },
                bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
                displayColors: true,
                boxPadding: 4
            }
        },
        scales: {
            x: {
                ticks: { color: chartColors.textSecondary, font: { family: "'Inter', sans-serif", size: 11 } },
                grid: { color: chartColors.gridColor, drawBorder: false }
            },
            y: {
                ticks: { color: chartColors.textSecondary, font: { family: "'JetBrains Mono', monospace", size: 11 } },
                grid: { color: chartColors.gridColor, drawBorder: false }
            }
        },
        animation: {
            duration: 1200,
            easing: 'easeInOutQuart'
        }
    };

    function destroyChart(id) {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            delete chartInstances[id];
        }
    }

    function getCtx(canvasId) {
        const el = document.getElementById(canvasId);
        return el ? el.getContext('2d') : null;
    }

    // ===== DASHBOARD CHARTS =====

    function createSpeedSparkline(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const speed = Analytics.getSpeedPerformance();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: speed.dates,
                datasets: [{
                    data: speed.actualSpeeds,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: chartColors.primary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true, ...defaultOptions.plugins.tooltip } },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0, max: 14 }
                },
                animation: { duration: 800, easing: 'easeOutCubic' }
            }
        });
    }

    function createFuelMiniBar(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: fuel.dates,
                datasets: [{
                    data: fuel.totalLSFO,
                    backgroundColor: fuel.totalLSFO.map(v => v > 10 ? chartColors.warning : chartColors.accent),
                    borderRadius: 3,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true, ...defaultOptions.plugins.tooltip } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                animation: { duration: 800, easing: 'easeOutCubic' }
            }
        });
    }

    function createROBGauge(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const robLSFO = VesselData.bunkerSummary.lsfo.closing;
        const maxROB = 1200;
        const pct = (robLSFO / maxROB) * 100;
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['LSFO ROB', 'Capacity'],
                datasets: [{
                    data: [robLSFO, maxROB - robLSFO],
                    backgroundColor: [chartColors.accent, 'rgba(255,255,255,0.05)'],
                    borderWidth: 0,
                    cutout: '78%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...defaultOptions.plugins.tooltip,
                        callbacks: { label: (c) => `${c.label}: ${c.raw.toFixed(1)} MT` }
                    }
                },
                animation: { duration: 1000, easing: 'easeOutCubic' }
            },
            plugins: [{
                id: 'robGaugeCenter',
                afterDraw(chart) {
                    const { ctx, width, height } = chart;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = "600 18px 'JetBrains Mono', monospace";
                    ctx.fillStyle = chartColors.textPrimary;
                    ctx.fillText(`${robLSFO.toFixed(0)}`, width / 2, height / 2 - 8);
                    ctx.font = "400 10px 'Inter', sans-serif";
                    ctx.fillStyle = chartColors.textSecondary;
                    ctx.fillText('MT LSFO', width / 2, height / 2 + 12);
                    ctx.restore();
                }
            }]
        });
    }

    // ===== VESSEL PERFORMANCE CHARTS =====

    function createSpeedPerformanceChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const speed = Analytics.getSpeedPerformance();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: speed.dates,
                datasets: [
                    {
                        label: 'Actual Speed (kts)',
                        data: speed.actualSpeeds,
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(0, 212, 255, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: chartColors.primary,
                        pointBorderColor: '#0a0e27',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'CP Warranted Speed (kts)',
                        data: speed.cpSpeeds,
                        borderColor: chartColors.danger,
                        borderWidth: 2,
                        borderDash: [8, 4],
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: chartColors.danger
                    }
                ]
            },
            options: {
                ...defaultOptions,
                plugins: {
                    ...defaultOptions.plugins,
                    tooltip: {
                        ...defaultOptions.plugins.tooltip,
                        callbacks: {
                            afterBody: (items) => {
                                const idx = items[0].dataIndex;
                                const report = VesselData.noonReports[idx];
                                return `Operation: ${report.operation}\nDistance: ${report.distance} nm`;
                            }
                        }
                    }
                },
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, min: 0, max: 15, title: { display: true, text: 'Speed (kts)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createFuelStackedBar(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: fuel.dates,
                datasets: [
                    {
                        label: 'ME LSFO',
                        data: fuel.meLSFO,
                        backgroundColor: chartColors.primary,
                        borderRadius: { topLeft: 0, topRight: 0 },
                        barPercentage: 0.55
                    },
                    {
                        label: 'AE LSFO',
                        data: fuel.aeLSFO,
                        backgroundColor: chartColors.accent,
                        barPercentage: 0.55
                    },
                    {
                        label: 'Boiler LSFO',
                        data: fuel.boilerLSFO,
                        backgroundColor: chartColors.warning,
                        borderRadius: { topLeft: 4, topRight: 4 },
                        barPercentage: 0.55
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    x: { ...defaultOptions.scales.x, stacked: true },
                    y: { ...defaultOptions.scales.y, stacked: true, title: { display: true, text: 'LSFO (MT)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createDailyVsWarrantedChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        const warrantedDaily = VesselData.idleConsumption.totalPerDay;
        const warrantedSteaming = VesselData.warrantedTable[0].meVLSFO + VesselData.warrantedTable[0].aeFO;
        const warrantedLine = fuel.dates.map((d, i) => {
            const report = VesselData.noonReports[i];
            return report.distance > 0 ? warrantedSteaming : warrantedDaily;
        });
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fuel.dates,
                datasets: [
                    {
                        label: 'Actual Daily LSFO (MT)',
                        data: fuel.totalLSFO,
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: chartColors.primary,
                        pointBorderColor: '#0a0e27',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Warranted LSFO (MT)',
                        data: warrantedLine,
                        borderColor: chartColors.danger,
                        borderWidth: 2,
                        borderDash: [8, 4],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'LSFO (MT)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createROBDrawdownChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fuel.dates,
                datasets: [{
                    label: 'LSFO ROB (MT)',
                    data: fuel.robLSFO,
                    borderColor: chartColors.accent,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: chartColors.accent,
                    pointBorderColor: '#0a0e27',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'ROB (MT)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createMGOTrendChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fuel.dates,
                datasets: [{
                    label: 'MGO ROB (MT)',
                    data: fuel.robMGO,
                    borderColor: chartColors.secondary,
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: chartColors.secondary,
                    pointBorderColor: '#0a0e27',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'MGO ROB (MT)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createSpeedRPMScatter(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const data = Analytics.getSpeedRPMData();
        const warrantedPoints = VesselData.warrantedTable.map(w => {
            const rpmMid = parseInt(w.rpmRange.split('-')[0]) + 0.5;
            return { x: rpmMid, y: w.speed };
        });
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Actual',
                        data: data,
                        backgroundColor: chartColors.primary,
                        borderColor: chartColors.primary,
                        pointRadius: 8,
                        pointHoverRadius: 12,
                        pointBorderWidth: 2,
                        pointBorderColor: '#0a0e27'
                    },
                    {
                        label: 'Warranted',
                        data: warrantedPoints,
                        backgroundColor: chartColors.danger + '88',
                        borderColor: chartColors.danger,
                        pointRadius: 6,
                        pointStyle: 'triangle',
                        pointBorderWidth: 2,
                        pointBorderColor: '#0a0e27'
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    x: { ...defaultOptions.scales.x, title: { display: true, text: 'RPM', color: chartColors.textSecondary }, min: 60, max: 90 },
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'Speed (kts)', color: chartColors.textSecondary }, min: 8, max: 14 }
                }
            }
        });
    }

    function createPerformanceGauge(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const score = Analytics.getPerformanceScore();
        const remaining = 100 - score.overall;
        let scoreColor = chartColors.accent;
        if (score.overall < 70) scoreColor = chartColors.danger;
        else if (score.overall < 85) scoreColor = chartColors.warning;

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Score', 'Remaining'],
                datasets: [{
                    data: [score.overall, remaining],
                    backgroundColor: [scoreColor, 'rgba(255,255,255,0.04)'],
                    borderWidth: 0,
                    cutout: '80%',
                    circumference: 270,
                    rotation: 225
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 1500, easing: 'easeOutCubic' }
            },
            plugins: [{
                id: 'perfGaugeCenter',
                afterDraw(chart) {
                    const { ctx: c, width, height } = chart;
                    c.save();
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.font = "700 36px 'JetBrains Mono', monospace";
                    c.fillStyle = scoreColor;
                    c.fillText(score.overall, width / 2, height / 2 + 5);
                    c.font = "500 13px 'Inter', sans-serif";
                    c.fillStyle = chartColors.textSecondary;
                    c.fillText(`Grade: ${score.grade}`, width / 2, height / 2 + 30);
                    c.restore();
                }
            }]
        });
    }

    // ===== FUEL ANALYTICS CHARTS =====

    function createConsumptionDonut(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const sys = VesselData.lsfoBySystem;
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['AE LSFO', 'ME LSFO', 'Boiler LSFO'],
                datasets: [{
                    data: [sys.ae.amount, sys.me.amount, sys.boiler.amount],
                    backgroundColor: [chartColors.accent, chartColors.primary, chartColors.warning],
                    borderWidth: 2,
                    borderColor: '#0a0e27',
                    cutout: '65%',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { ...defaultOptions.plugins.legend, position: 'bottom' },
                    tooltip: {
                        ...defaultOptions.plugins.tooltip,
                        callbacks: { label: (c) => `${c.label}: ${c.raw.toFixed(2)} MT (${[53, 27, 20][c.dataIndex]}%)` }
                    }
                },
                animation: { duration: 1200, easing: 'easeOutCubic' }
            },
            plugins: [{
                id: 'donutCenter',
                afterDraw(chart) {
                    const { ctx: c, width, height } = chart;
                    c.save();
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.font = "700 22px 'JetBrains Mono', monospace";
                    c.fillStyle = chartColors.textPrimary;
                    c.fillText('46.99', width / 2, height / 2 - 12);
                    c.font = "400 11px 'Inter', sans-serif";
                    c.fillStyle = chartColors.textSecondary;
                    c.fillText('Total MT LSFO', width / 2, height / 2 + 10);
                    c.restore();
                }
            }]
        });
    }

    function createDailyStackedArea(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fuel.dates,
                datasets: [
                    {
                        label: 'ME LSFO',
                        data: fuel.meLSFO,
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(0, 212, 255, 0.3)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: chartColors.primary
                    },
                    {
                        label: 'AE LSFO',
                        data: fuel.aeLSFO,
                        borderColor: chartColors.accent,
                        backgroundColor: 'rgba(16, 185, 129, 0.3)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: chartColors.accent
                    },
                    {
                        label: 'Boiler LSFO',
                        data: fuel.boilerLSFO,
                        borderColor: chartColors.warning,
                        backgroundColor: 'rgba(245, 158, 11, 0.3)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: chartColors.warning
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, stacked: true, title: { display: true, text: 'LSFO (MT)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createROBDualAxis(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const fuel = Analytics.getFuelConsumption();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fuel.dates,
                datasets: [
                    {
                        label: 'LSFO ROB (MT)',
                        data: fuel.robLSFO,
                        borderColor: chartColors.accent,
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: chartColors.accent,
                        pointBorderColor: '#0a0e27',
                        pointBorderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'MGO ROB (MT)',
                        data: fuel.robMGO,
                        borderColor: chartColors.secondary,
                        backgroundColor: 'rgba(124, 58, 237, 0.08)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: chartColors.secondary,
                        pointBorderColor: '#0a0e27',
                        pointBorderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    x: defaultOptions.scales.x,
                    y: {
                        ...defaultOptions.scales.y,
                        position: 'left',
                        title: { display: true, text: 'LSFO ROB (MT)', color: chartColors.accent }
                    },
                    y1: {
                        ...defaultOptions.scales.y,
                        position: 'right',
                        title: { display: true, text: 'MGO ROB (MT)', color: chartColors.secondary },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    function createConsumptionVsWarrantedBar(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total LSFO', 'ME LSFO', 'AE LSFO', 'Boiler LSFO'],
                datasets: [
                    {
                        label: 'Actual',
                        data: [46.987, 12.477, 25.05, 9.46],
                        backgroundColor: chartColors.primary,
                        borderRadius: 4,
                        barPercentage: 0.4
                    },
                    {
                        label: 'Warranted',
                        data: [49.5, 23.5, 27.0, 0],
                        backgroundColor: chartColors.danger + '88',
                        borderRadius: 4,
                        barPercentage: 0.4
                    }
                ]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'MT', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createTimeUtilizationPie(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const util = VesselData.timeUtilization;
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [util.idleSungaiLinggi.label, util.maneuvering.label, util.idleSingapore.label],
                datasets: [{
                    data: [util.idleSungaiLinggi.percentage, util.maneuvering.percentage, util.idleSingapore.percentage],
                    backgroundColor: [chartColors.warning, chartColors.primary, chartColors.secondary],
                    borderWidth: 2,
                    borderColor: '#0a0e27',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { ...defaultOptions.plugins.legend, position: 'bottom' },
                    tooltip: {
                        ...defaultOptions.plugins.tooltip,
                        callbacks: { label: (c) => `${c.label}: ${c.raw}%` }
                    }
                }
            }
        });
    }

    // ===== WEATHER CHARTS =====

    function createBeaufortChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const weather = Analytics.getWeatherAnalysis();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weather.dates,
                datasets: [{
                    label: 'Beaufort Scale',
                    data: weather.beaufort,
                    backgroundColor: weather.beaufort.map(b => b <= 2 ? chartColors.accent : b <= 4 ? chartColors.warning : chartColors.danger),
                    borderRadius: 4,
                    barPercentage: 0.5
                }]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, min: 0, max: 8, title: { display: true, text: 'Beaufort Force', color: chartColors.textSecondary } }
                },
                plugins: {
                    ...defaultOptions.plugins,
                    tooltip: {
                        ...defaultOptions.plugins.tooltip,
                        callbacks: {
                            afterLabel: (c) => {
                                const bfDesc = ['Calm', 'Light Air', 'Light Breeze', 'Gentle Breeze', 'Moderate Breeze', 'Fresh Breeze'];
                                return bfDesc[c.raw] || '';
                            }
                        }
                    }
                }
            }
        });
    }

    function createWindSpeedChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const weather = Analytics.getWeatherAnalysis();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weather.dates,
                datasets: [{
                    label: 'Wind Speed (kts)',
                    data: weather.windSpeed,
                    borderColor: chartColors.cyan,
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: chartColors.cyan,
                    pointBorderColor: '#0a0e27',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, min: 0, max: 10, title: { display: true, text: 'Wind Speed (kts)', color: chartColors.textSecondary } }
                }
            }
        });
    }

    function createCurrentChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const reports = VesselData.noonReports.filter(r => r.currentDir !== null);
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: reports.map(r => r.dateShort),
                datasets: [{
                    label: 'Current Direction Index',
                    data: reports.map(r => r.currentDir),
                    backgroundColor: chartColors.secondary + 'cc',
                    borderRadius: 4,
                    barPercentage: 0.5
                }]
            },
            options: {
                ...defaultOptions,
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, title: { display: true, text: 'Direction Index', color: chartColors.textSecondary } }
                }
            }
        });
    }

    // ===== VOYAGE OPTIMIZATION CHARTS =====

    function createRouteRadarChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        const radarData = VoyageOptimizer.getRadarChartData();
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: radarData.labels,
                datasets: radarData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { ...defaultOptions.plugins.legend, position: 'bottom' },
                    tooltip: defaultOptions.plugins.tooltip
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: chartColors.textSecondary, backdropColor: 'transparent', font: { size: 10 } },
                        grid: { color: chartColors.gridColor },
                        pointLabels: { color: chartColors.textPrimary, font: { size: 11 } },
                        angleLines: { color: chartColors.gridColor }
                    }
                },
                animation: { duration: 1200 }
            }
        });
    }

    // ===== COMMERCIAL CHARTS =====

    function createComplianceChart(canvasId) {
        destroyChart(canvasId);
        const ctx = getCtx(canvasId);
        if (!ctx) return;
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Speed (kts)', 'LSFO (MT)', 'Daily Idle (MT)'],
                datasets: [
                    {
                        label: 'Actual',
                        data: [10.35, 46.987, 3.84],
                        backgroundColor: chartColors.primary,
                        borderRadius: 4,
                        barPercentage: 0.35
                    },
                    {
                        label: 'Warranted / CP',
                        data: [12.5, 49.5, 5.5],
                        backgroundColor: chartColors.danger + '88',
                        borderRadius: 4,
                        barPercentage: 0.35
                    }
                ]
            },
            options: {
                ...defaultOptions,
                indexAxis: 'y',
                scales: {
                    x: { ...defaultOptions.scales.x },
                    y: { ...defaultOptions.scales.y }
                }
            }
        });
    }

    // Destroy all charts
    function destroyAll() {
        Object.keys(chartInstances).forEach(id => {
            chartInstances[id].destroy();
            delete chartInstances[id];
        });
    }

    return {
        createSpeedSparkline,
        createFuelMiniBar,
        createROBGauge,
        createSpeedPerformanceChart,
        createFuelStackedBar,
        createDailyVsWarrantedChart,
        createROBDrawdownChart,
        createMGOTrendChart,
        createSpeedRPMScatter,
        createPerformanceGauge,
        createConsumptionDonut,
        createDailyStackedArea,
        createROBDualAxis,
        createConsumptionVsWarrantedBar,
        createTimeUtilizationPie,
        createBeaufortChart,
        createWindSpeedChart,
        createCurrentChart,
        createRouteRadarChart,
        createComplianceChart,
        destroyAll
    };
})();
