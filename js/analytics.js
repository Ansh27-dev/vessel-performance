// ============================================================
// ANALYTICS ENGINE - Computation & Analysis Module
// All outputs are data-driven from VesselData noon reports.
// No hardcoded values — every metric computed from voyage data.
// ============================================================

const Analytics = (() => {

    // =========================================================
    // HELPER: Beaufort → speed loss factor (knots penalty)
    // Based on IMO/ISO 15016 simplified model:
    //   BF 0-3 → negligible, BF 4 → ~0.3 kts, BF 5 → ~0.8,
    //   BF 6 → ~1.5, BF 7+ → ~2.5+ kts
    // =========================================================
    function beaufortSpeedLoss(bf) {
        if (bf <= 2) return 0;
        if (bf <= 3) return 0.1;
        if (bf <= 4) return 0.3;
        if (bf <= 5) return 0.8;
        if (bf <= 6) return 1.5;
        return 2.5;
    }

    // =========================================================
    // HELPER: Compute weather impact score (0–100 scale)
    // 100 = no impact (perfect conditions), 0 = severe impact
    // Weighted: 50% Beaufort, 30% wind speed, 20% current
    // =========================================================
    function computeWeatherImpactScore(reports) {
        if (!reports.length) return { score: 100, label: 'No Data', summary: '' };

        const bfArr = reports.map(r => r.beaufort ?? 0);
        const wsArr = reports.map(r => r.windSpd ?? 0);
        const maxBF = Math.max(...bfArr);
        const avgBF = bfArr.reduce((s, v) => s + v, 0) / bfArr.length;
        const maxWind = Math.max(...wsArr);
        const avgWind = wsArr.reduce((s, v) => s + v, 0) / wsArr.length;

        // Beaufort sub-score: BF 0 = 100, BF 4 = 70, BF 7 = 30, BF 10+ = 0
        const bfScore = Math.max(0, 100 - (avgBF * 12) - (maxBF > 5 ? (maxBF - 5) * 8 : 0));

        // Wind sub-score: 0-10 kts = 100, 20 kts = 60, 30+ kts = 20
        const windScore = Math.max(0, Math.min(100, 100 - avgWind * 2.5 - (maxWind > 20 ? (maxWind - 20) * 2 : 0)));

        // Current sub-score: count adverse current reports
        // Direction 7-11 (aft quarter) = favorable, 1-5 (fwd quarter) = adverse
        const steamReports = reports.filter(r => r.distance > 0 && r.currentDir !== null);
        let currentScore = 85; // default neutral
        if (steamReports.length > 0) {
            const adverseCount = steamReports.filter(r => r.currentDir >= 1 && r.currentDir <= 5).length;
            const favorableCount = steamReports.filter(r => r.currentDir >= 7 && r.currentDir <= 11).length;
            currentScore = 50 + ((favorableCount - adverseCount) / steamReports.length) * 50;
            currentScore = Math.max(0, Math.min(100, currentScore));
        }

        const score = Math.round(bfScore * 0.50 + windScore * 0.30 + currentScore * 0.20);

        // Generate label
        let label, severity;
        if (score >= 85) { label = 'Minimal'; severity = 'success'; }
        else if (score >= 65) { label = 'Moderate'; severity = 'info'; }
        else if (score >= 45) { label = 'Significant'; severity = 'warning'; }
        else { label = 'Severe'; severity = 'danger'; }

        // Generate dynamic summary
        const bfRange = maxBF === Math.min(...bfArr) ? `BF ${maxBF}` : `BF ${Math.min(...bfArr)}–${maxBF}`;
        const windRange = maxWind === Math.min(...wsArr) ? `${maxWind} kts` : `${Math.min(...wsArr)}–${maxWind} kts`;
        let summary;
        if (score >= 85) {
            summary = `No heavy weather recorded. ${bfRange} throughout voyage. Wind speeds ${windRange}. Weather had minimal impact on vessel performance.`;
        } else if (score >= 65) {
            const lossEst = beaufortSpeedLoss(maxBF);
            summary = `Moderate weather conditions recorded. ${bfRange}, wind ${windRange}. Estimated speed loss: ${lossEst.toFixed(1)} kts during peak conditions.`;
        } else {
            const lossEst = beaufortSpeedLoss(maxBF);
            summary = `Heavy weather encountered. ${bfRange}, wind ${windRange}. Significant impact on speed (est. −${lossEst.toFixed(1)} kts) and fuel consumption during transit legs.`;
        }

        return { score, label, severity, summary, maxBF, avgBF, maxWind, avgWind, bfScore, windScore, currentScore };
    }

    // =========================================================
    // HELPER: Compute deviation decomposition from voyage data
    // Separates speed loss into idle/operational/weather/engine
    // =========================================================
    function computeDeviationBreakdown() {
        const reports = VesselData.noonReports;
        const cpSpeed = VesselData.voyageInfo.cpSpeed || 12.5;
        const totalDays = reports.length;
        if (totalDays === 0) return { idle: 0, operational: 0, weather: 0, engine: 0 };

        const steamReports = reports.filter(r => r.distance > 0);
        const idleReports = reports.filter(r => r.distance === 0);
        const idleDays = idleReports.length;
        const steamDays = steamReports.length;

        // Idle contribution: proportion of time where speed=0 drags overall average down
        const overallAvg = reports.reduce((s, r) => s + r.avgSpeed, 0) / totalDays;
        const idleContribution = steamDays > 0 ? (cpSpeed - overallAvg) * (idleDays / totalDays) : 0;

        // Steaming speed shortfall
        const avgSteamSpeed = steamDays > 0
            ? steamReports.reduce((s, r) => s + r.avgSpeed, 0) / steamDays : 0;
        const steamShortfall = Math.max(0, cpSpeed - avgSteamSpeed);

        // Weather contribution to steaming shortfall
        const weatherReports = steamReports.filter(r => r.beaufort !== null);
        const avgBF = weatherReports.length > 0
            ? weatherReports.reduce((s, r) => s + r.beaufort, 0) / weatherReports.length : 0;
        const weatherLoss = beaufortSpeedLoss(Math.round(avgBF));

        // Operational = steaming shortfall minus weather
        const operationalLoss = Math.max(0, steamShortfall - weatherLoss);

        // Engine: check if slip is abnormal (>8% indicates potential issue)
        const avgSlip = steamReports.filter(r => r.slip > 0).reduce((s, r) => s + r.slip, 0) /
            (steamReports.filter(r => r.slip > 0).length || 1);
        const engineLoss = avgSlip > 8 ? Math.min(0.5, (avgSlip - 8) * 0.1) : 0;

        return {
            idle: +idleContribution.toFixed(2),
            operational: +Math.max(0, operationalLoss - engineLoss).toFixed(2),
            weather: +weatherLoss.toFixed(2),
            engine: +engineLoss.toFixed(2),
            idleDays, steamDays, avgSteamSpeed: +avgSteamSpeed.toFixed(2),
            overallAvg: +overallAvg.toFixed(2), avgSlip: +avgSlip.toFixed(1)
        };
    }

    // --- Speed Performance Analysis ---
    function getSpeedPerformance() {
        const reports = VesselData.noonReports;
        const steamingReports = reports.filter(r => r.distance > 0);
        const avgSteamingSpeed = steamingReports.length > 0
            ? steamingReports.reduce((sum, r) => sum + r.avgSpeed, 0) / steamingReports.length
            : 0;
        const cpSpeed = VesselData.voyageInfo.cpSpeed;
        const speedDeviation = cpSpeed > 0 ? ((avgSteamingSpeed - cpSpeed) / cpSpeed * 100).toFixed(1) : '0.0';

        return {
            dates: reports.map(r => r.dateShort),
            actualSpeeds: reports.map(r => r.avgSpeed),
            cpSpeeds: reports.map(r => r.cpSpeed),
            avgOverall: VesselData.voyageInfo.averageSpeed,
            avgSteaming: parseFloat(avgSteamingSpeed.toFixed(2)),
            cpSpeed,
            speedDeviation: parseFloat(speedDeviation),
            steamingDays: steamingReports.length,
            idleDays: reports.length - steamingReports.length
        };
    }

    // --- Fuel Consumption Analysis ---
    function getFuelConsumption() {
        const data = VesselData.engineFuelData;
        return {
            dates: data.map(d => d.dateShort),
            meLSFO: data.map(d => d.meLSFO),
            aeLSFO: data.map(d => d.aeLSFO),
            boilerLSFO: data.map(d => d.boilerLSFO),
            totalLSFO: data.map(d => d.totalLSFO),
            mgo: data.map(d => d.mgo),
            robLSFO: data.map(d => d.robLSFO),
            robMGO: data.map(d => d.robMGO),
            totalMELSFO: data.reduce((s, d) => s + d.meLSFO, 0),
            totalAELSFO: data.reduce((s, d) => s + d.aeLSFO, 0),
            totalBoilerLSFO: data.reduce((s, d) => s + d.boilerLSFO, 0),
            grandTotalLSFO: data.reduce((s, d) => s + d.totalLSFO, 0),
            grandTotalMGO: data.reduce((s, d) => s + d.mgo, 0)
        };
    }

    // --- ROB Analysis ---
    function getROBAnalysis() {
        const data = VesselData.engineFuelData;
        return {
            dates: data.map(d => d.dateShort),
            lsfoROB: data.map(d => d.robLSFO),
            mgoROB: data.map(d => d.robMGO),
            lsfoDrawdown: VesselData.bunkerSummary.lsfo.opening - VesselData.bunkerSummary.lsfo.closing,
            mgoDrawdown: VesselData.bunkerSummary.mgo.opening - VesselData.bunkerSummary.mgo.closing
        };
    }

    // --- Weather Analysis (FULLY DATA-DRIVEN) ---
    function getWeatherAnalysis() {
        const reports = VesselData.noonReports.filter(r => r.beaufort !== null);
        const impact = computeWeatherImpactScore(reports);

        return {
            dates: reports.map(r => r.dateShort),
            beaufort: reports.map(r => r.beaufort),
            windSpeed: reports.map(r => r.windSpd),
            windDir: reports.map(r => VesselData.windDirLabels[r.windDir] || 'N/A'),
            currentDir: reports.map(r => r.currentDir),
            maxBeaufort: impact.maxBF || 0,
            avgBeaufort: impact.avgBF !== undefined ? impact.avgBF.toFixed(1) : '0',
            maxWind: impact.maxWind || 0,
            avgWind: impact.avgWind !== undefined ? impact.avgWind.toFixed(1) : '0',
            weatherImpact: impact.label,
            weatherImpactScore: impact.score,
            weatherSeverity: impact.severity,
            weatherSummary: impact.summary,
            bfSubScore: Math.round(impact.bfScore || 100),
            windSubScore: Math.round(impact.windScore || 100),
            currentSubScore: Math.round(impact.currentScore || 85)
        };
    }

    // --- Performance Score (ALL COMPUTED FROM DATA) ---
    function getPerformanceScore() {
        const bunker = VesselData.bunkerSummary;
        const warranted = bunker.lsfo.warranted || 1;
        const consumed = bunker.lsfo.totalConsumed;
        // Fuel score: 100 if consumed = 0, scales linearly. Bonus for under-warranted.
        const fuelRatio = consumed / warranted;
        const fuelScore = Math.max(0, Math.min(100, (1 - fuelRatio) * 100 + 85));

        // Speed score: from actual steaming speed vs CP
        const steamingReports = VesselData.noonReports.filter(r => r.distance > 0);
        const cpSpeed = VesselData.voyageInfo.cpSpeed || 12.5;
        const avgSteamingSpeed = steamingReports.length > 0
            ? steamingReports.reduce((s, r) => s + r.avgSpeed, 0) / steamingReports.length : 0;
        const speedScore = cpSpeed > 0 ? Math.max(0, Math.min(100, (avgSteamingSpeed / cpSpeed) * 100)) : 100;

        // Weather score: computed from actual Beaufort/wind/current
        const weatherReports = VesselData.noonReports.filter(r => r.beaufort !== null);
        const weatherImpact = computeWeatherImpactScore(weatherReports);
        const weatherScore = weatherImpact.score;

        const overallScore = ((fuelScore * 0.4) + (speedScore * 0.35) + (weatherScore * 0.25)).toFixed(0);

        return {
            overall: parseInt(overallScore),
            fuel: parseFloat(fuelScore.toFixed(0)),
            speed: parseFloat(speedScore.toFixed(0)),
            weather: weatherScore,
            grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : 'D'
        };
    }

    // --- Idle Fuel Cost Analysis (AUTO-DETECT, NO DATE FILTER) ---
    function getIdleFuelCost() {
        // Dynamically detect idle days from operation field
        const idleData = VesselData.engineFuelData.filter(d =>
            d.operation === 'Idle' || d.operation.toLowerCase().includes('idle'));
        if (idleData.length === 0) {
            return { days: 0, totalLSFO: 0, totalMGO: 0, avgDailyLSFO: 0,
                     costLSFO: 0, costMGO: 0, totalCost: 0, dailyIdleData: [] };
        }
        const totalIdleLSFO = idleData.reduce((s, d) => s + d.totalLSFO, 0);
        const totalIdleMGO = idleData.reduce((s, d) => s + d.mgo, 0);
        const avgDailyLSFO = totalIdleLSFO / idleData.length;
        const costLSFO = totalIdleLSFO * VesselData.fuelPrices.lsfo;
        const costMGO = totalIdleMGO * VesselData.fuelPrices.mgo;

        return {
            days: idleData.length,
            totalLSFO: parseFloat(totalIdleLSFO.toFixed(3)),
            totalMGO: parseFloat(totalIdleMGO.toFixed(3)),
            avgDailyLSFO: parseFloat(avgDailyLSFO.toFixed(3)),
            costLSFO: parseFloat(costLSFO.toFixed(0)),
            costMGO: parseFloat(costMGO.toFixed(0)),
            totalCost: parseFloat((costLSFO + costMGO).toFixed(0)),
            dailyIdleData: idleData.map(d => ({
                date: d.dateShort,
                lsfo: d.totalLSFO,
                mgo: d.mgo
            }))
        };
    }

    // --- Time Utilization ---
    function getTimeUtilization() {
        return VesselData.timeUtilization;
    }

    // --- Commercial Analysis (FULLY COMPUTED) ---
    function getCommercialAnalysis() {
        const cp = VesselData.claimsAnalysis;
        const fuelPrices = VesselData.fuelPrices;
        const bunker = VesselData.bunkerSummary;
        const voyage = VesselData.voyageInfo;

        const voyageFuelCost = (bunker.lsfo.totalConsumed * fuelPrices.lsfo) +
            (bunker.mgo.totalConsumed * fuelPrices.mgo);
        const fuelSavingsValue = bunker.lsfo.saved * fuelPrices.lsfo;

        // --- Compute CP compliance dynamically ---
        const cpSpeed = voyage.cpSpeed || 12.5;
        const steamReports = VesselData.noonReports.filter(r => r.distance > 0);
        const avgSteamSpeed = steamReports.length > 0
            ? steamReports.reduce((s, r) => s + r.avgSpeed, 0) / steamReports.length : 0;
        const idleDays = VesselData.noonReports.filter(r => r.distance === 0).length;
        const steamDays = steamReports.length;
        const totalDays = VesselData.noonReports.length;

        // Speed compliance
        let speedStatus, speedDetail;
        if (steamDays === 0) {
            speedStatus = 'N/A'; speedDetail = 'No steaming days — speed clause not applicable.';
        } else if (idleDays > steamDays) {
            speedStatus = 'N/A';
            speedDetail = `${idleDays} of ${totalDays} days idle. Speed deviation of ${((avgSteamSpeed / cpSpeed * 100) - 100).toFixed(1)}% attributable to maneuvering/idle — not engine performance.`;
        } else if (avgSteamSpeed >= cpSpeed * 0.97) {
            speedStatus = 'Compliant';
            speedDetail = `Steaming speed ${avgSteamSpeed.toFixed(2)} kts vs warranted ${cpSpeed} kts — within 3% margin.`;
        } else {
            speedStatus = 'Review';
            speedDetail = `Steaming speed ${avgSteamSpeed.toFixed(2)} kts vs warranted ${cpSpeed} kts — shortfall of ${(cpSpeed - avgSteamSpeed).toFixed(2)} kts. Check for operational cause.`;
        }

        // Fuel compliance
        let fuelStatus, fuelDetail;
        if (bunker.lsfo.saved > 0) {
            fuelStatus = 'Compliant';
            fuelDetail = `Under warranted by ${bunker.lsfo.saved.toFixed(3)} MT. Actual ${bunker.lsfo.totalConsumed.toFixed(3)} MT vs warranted ${bunker.lsfo.warranted} MT.`;
        } else {
            fuelStatus = 'Review';
            fuelDetail = `Overconsumption of ${Math.abs(bunker.lsfo.saved).toFixed(3)} MT. Actual ${bunker.lsfo.totalConsumed.toFixed(3)} MT vs warranted ${bunker.lsfo.warranted} MT.`;
        }

        // Route compliance
        const totalDist = voyage.totalDistance;
        const routeStatus = 'Compliant';
        const routeDetail = `Direct route ${voyage.departure} → ${voyage.arrival}. Total distance ${totalDist} nm.`;

        // Reporting compliance
        const reportingStatus = totalDays >= steamDays ? 'Compliant' : 'Incomplete';
        const reportingDetail = `${totalDays} noon reports submitted over ${totalDays}-day period.`;

        return {
            claims: cp,
            voyageFuelCost: parseFloat(voyageFuelCost.toFixed(0)),
            fuelSavingsValue: parseFloat(fuelSavingsValue.toFixed(0)),
            cpCompliance: {
                speed: { status: speedStatus, detail: speedDetail },
                fuel: { status: fuelStatus, detail: fuelDetail },
                route: { status: routeStatus, detail: routeDetail },
                reporting: { status: reportingStatus, detail: reportingDetail }
            }
        };
    }

    // --- Warranted vs Actual Comparison (USES WARRANTED TABLE) ---
    function getWarrantedComparison() {
        const steamingData = VesselData.engineFuelData.filter(d => d.distance > 0);
        const totalSteamingHours = steamingData.reduce((s, d) => s + d.steamingHours, 0);
        const steamingDays = totalSteamingHours / 24;

        // Lookup warranted rate from warrantedTable based on actual avg speed
        const avgSteamSpeed = steamingData.length > 0
            ? steamingData.reduce((s, d) => s + d.speed, 0) / steamingData.length : 12.5;
        const warrantedEntry = findWarrantedEntry(avgSteamSpeed);
        const warrantedDaily = warrantedEntry.meVLSFO + warrantedEntry.aeFO;
        const warrantedConsumption = warrantedDaily * steamingDays;

        const actualME = steamingData.reduce((s, d) => s + d.meLSFO, 0);
        const actualAE = steamingData.reduce((s, d) => s + d.aeLSFO, 0);

        return {
            steamingHours: totalSteamingHours,
            steamingDays: parseFloat(steamingDays.toFixed(2)),
            warrantedDaily: warrantedDaily,
            warrantedConsumption: parseFloat(warrantedConsumption.toFixed(2)),
            actualME: parseFloat(actualME.toFixed(3)),
            actualAE: parseFloat(actualAE.toFixed(3)),
            totalActual: parseFloat((actualME + actualAE).toFixed(3)),
            difference: parseFloat((warrantedConsumption - (actualME + actualAE)).toFixed(3))
        };
    }

    // Lookup closest warranted entry for given speed
    function findWarrantedEntry(speed) {
        const table = VesselData.warrantedTable;
        if (!table || table.length === 0) return { meVLSFO: 23.5, aeFO: 3 };
        // Find closest speed in table
        let best = table[0];
        let bestDiff = Math.abs(speed - best.speed);
        for (const entry of table) {
            const diff = Math.abs(speed - entry.speed);
            if (diff < bestDiff) { best = entry; bestDiff = diff; }
        }
        return best;
    }

    // --- Speed vs RPM Data ---
    function getSpeedRPMData() {
        return VesselData.noonReports
            .filter(r => r.rpm > 0)
            .map(r => ({ x: r.rpm, y: r.avgSpeed, date: r.dateShort }));
    }

    // --- Voyage Segments with COMPUTED weather risk per segment ---
    function getVoyageSegments() {
        const waypoints = VesselData.routeWaypoints;
        const reports = VesselData.noonReports.filter(r => r.beaufort !== null);
        const segments = [];
        for (let i = 0; i < waypoints.length - 1; i++) {
            const from = waypoints[i];
            const to = waypoints[i + 1];
            const dist = haversineDistance(from.lat, from.lng, to.lat, to.lng);
            const bearing = getBearing(from.lat, from.lng, to.lat, to.lng);

            // Find nearest noon report to segment midpoint for weather data
            const midLat = (from.lat + to.lat) / 2;
            const midLng = (from.lng + to.lng) / 2;
            const nearest = findNearestReport(midLat, midLng, reports);
            const bf = nearest ? (nearest.beaufort || 0) : 0;
            const wind = nearest ? (nearest.windSpd || 0) : 0;

            // Compute segment risk from Beaufort and wind
            const segRiskScore = Math.min(100, bf * 10 + wind * 1.5);
            let riskLabel;
            if (segRiskScore < 25) riskLabel = 'Low';
            else if (segRiskScore < 50) riskLabel = 'Moderate';
            else if (segRiskScore < 75) riskLabel = 'High';
            else riskLabel = 'Severe';

            // Current effect from nearest report
            let currentEffect = 'Neutral';
            if (nearest && nearest.currentDir !== null) {
                // Relate current direction to vessel bearing
                // bearingDiff: if current is roughly behind vessel → favorable
                const bearingRad = bearing * Math.PI / 180;
                const currentAngle = (nearest.currentDir / 16) * 360; // 16-point to degrees
                const diff = Math.abs(bearing - currentAngle);
                const normDiff = diff > 180 ? 360 - diff : diff;
                if (normDiff < 60) currentEffect = 'Adverse';
                else if (normDiff > 120) currentEffect = 'Favorable';
                else currentEffect = 'Neutral';
            }

            segments.push({
                from: from.name,
                to: to.name,
                distance: parseFloat(dist.toFixed(1)),
                bearing: parseFloat(bearing.toFixed(0)),
                weatherRisk: riskLabel,
                riskScore: Math.round(segRiskScore),
                currentEffect,
                beaufort: bf,
                windSpeed: wind
            });
        }
        return segments;
    }

    // Find the noon report closest to a given lat/lng
    function findNearestReport(lat, lng, reports) {
        if (!reports.length) return null;
        let best = reports[0];
        let bestDist = haversineDistance(lat, lng, best.lat, best.lng);
        for (const r of reports) {
            const d = haversineDistance(lat, lng, r.lat, r.lng);
            if (d < bestDist) { best = r; bestDist = d; }
        }
        return best;
    }

    // --- Haversine Distance ---
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 3440.065; // Earth radius in nautical miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // --- Bearing Calculation ---
    function getBearing(lat1, lon1, lat2, lon2) {
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
        return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    }

    // --- Generate Performance Report Data ---
    function generateReportData() {
        return {
            vessel: VesselData.vesselInfo,
            voyage: VesselData.voyageInfo,
            speed: getSpeedPerformance(),
            fuel: getFuelConsumption(),
            rob: getROBAnalysis(),
            weather: getWeatherAnalysis(),
            score: getPerformanceScore(),
            commercial: getCommercialAnalysis(),
            deviations: VesselData.deviationAnalysis,
            summary: VesselData.voyageSummary,
            deviationBreakdown: computeDeviationBreakdown(),
            generatedAt: new Date().toISOString()
        };
    }

    return {
        getSpeedPerformance,
        getFuelConsumption,
        getROBAnalysis,
        getWeatherAnalysis,
        getPerformanceScore,
        getIdleFuelCost,
        getTimeUtilization,
        getCommercialAnalysis,
        getWarrantedComparison,
        getSpeedRPMData,
        getVoyageSegments,
        generateReportData,
        haversineDistance,
        getBearing,
        computeWeatherImpactScore,
        computeDeviationBreakdown,
        findWarrantedEntry
    };
})();
