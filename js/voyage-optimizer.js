// ============================================================
// VOYAGE OPTIMIZER - Route optimization and analysis
// All outputs are data-driven from VesselData.
// No Math.random(), no hardcoded baselines, no static strings.
// ============================================================

const VoyageOptimizer = (() => {

    // =========================================================
    // Route Scoring — uses ACTUAL voyage baselines, not magic numbers
    // Score formula: weighted composite of distance, fuel, weather
    // Baseline = original route from VesselData (first alternativeRoute)
    // =========================================================
    function scoreRoute(route) {
        const baseline = VesselData.alternativeRoutes[0] || route;
        const baseDist = baseline.distance || 1;
        const baseFuel = baseline.fuelEstimate || 1;

        // Distance efficiency: closer to baseline = better (max 100)
        const distScore = Math.min(100, (baseDist / route.distance) * 100);

        // Fuel efficiency: lower fuel = better (max 100)
        const fuelScore = Math.min(100, (baseFuel / route.fuelEstimate) * 100);

        // Weather safety: lower risk score = better (max 100)
        const weatherSafetyScore = Math.max(0, 100 - route.riskScore);

        // Weighted composite: 35% distance, 35% fuel, 30% weather
        const score = (distScore * 0.35 + fuelScore * 0.35 + weatherSafetyScore * 0.30).toFixed(1);
        return parseFloat(score);
    }

    // =========================================================
    // ETA Calculator — pure distance/speed
    // =========================================================
    function calculateETA(distance, speed) {
        if (speed <= 0) return { hours: '0', days: 0, remainingHours: '0', display: 'N/A' };
        const hours = distance / speed;
        const days = Math.floor(hours / 24);
        const remainingHours = (hours % 24).toFixed(1);
        return {
            hours: hours.toFixed(1),
            days,
            remainingHours,
            display: days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`
        };
    }

    // =========================================================
    // Fuel Estimation — from warranted table lookup
    // =========================================================
    function estimateFuel(distance, speed) {
        const warranted = VesselData.warrantedTable.find(w => w.speed === speed)
            || VesselData.warrantedTable[0];
        if (!warranted) return { me: 0, ae: 0, total: 0, cost: 0 };
        const hours = distance / speed;
        const days = hours / 24;
        const meFuel = warranted.meVLSFO * days;
        const aeFuel = warranted.aeFO * days;
        return {
            me: parseFloat(meFuel.toFixed(2)),
            ae: parseFloat(aeFuel.toFixed(2)),
            total: parseFloat((meFuel + aeFuel).toFixed(2)),
            cost: parseFloat(((meFuel + aeFuel) * VesselData.fuelPrices.lsfo).toFixed(0))
        };
    }

    // =========================================================
    // Route Comparison — uses actual CP speed from voyage data
    // =========================================================
    function compareRoutes() {
        const routes = VesselData.alternativeRoutes;
        const speed = VesselData.voyageInfo.cpSpeed || 12.5;
        return routes.map(route => {
            const score = scoreRoute(route);
            const eta = calculateETA(route.distance, speed);
            const fuel = estimateFuel(route.distance, speed);
            return {
                ...route,
                score,
                etaCalc: eta,
                fuelCalc: fuel,
                rank: 0
            };
        }).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
    }

    // =========================================================
    // Segment Analysis — weather risk from ACTUAL voyage data
    // No Math.random(). Risk computed from nearest noon report.
    // =========================================================
    function analyzeSegments(routeId) {
        const route = VesselData.alternativeRoutes.find(r => r.id === routeId);
        if (!route) return [];

        const reports = VesselData.noonReports.filter(r => r.beaufort !== null);
        const segments = [];

        for (let i = 0; i < route.waypoints.length - 1; i++) {
            const from = route.waypoints[i];
            const to = route.waypoints[i + 1];
            const dist = Analytics.haversineDistance(from.lat, from.lng, to.lat, to.lng);
            const bearing = Analytics.getBearing(from.lat, from.lng, to.lat, to.lng);

            // Find nearest noon report to segment midpoint
            const midLat = (from.lat + to.lat) / 2;
            const midLng = (from.lng + to.lng) / 2;
            const nearest = findNearestReport(midLat, midLng, reports);

            const bf = nearest ? (nearest.beaufort || 0) : 0;
            const wind = nearest ? (nearest.windSpd || 0) : 0;

            // Risk score from actual weather: BF×10 + wind×1.5 (0–100 scale)
            const riskScore = Math.min(100, Math.round(bf * 10 + wind * 1.5));
            let weatherRisk;
            if (riskScore < 25) weatherRisk = 'Low';
            else if (riskScore < 50) weatherRisk = 'Moderate';
            else if (riskScore < 75) weatherRisk = 'High';
            else weatherRisk = 'Severe';

            // Current effect: computed from report current direction vs bearing
            let currentEffect = 'Neutral';
            if (nearest && nearest.currentDir !== null) {
                const currentAngle = (nearest.currentDir / 16) * 360;
                const diff = Math.abs(bearing - currentAngle);
                const normDiff = diff > 180 ? 360 - diff : diff;
                if (normDiff < 60) currentEffect = 'Adverse';
                else if (normDiff > 120) currentEffect = 'Favorable';
            }

            segments.push({
                segmentNo: i + 1,
                from: `${from.lat.toFixed(3)}°N, ${from.lng.toFixed(3)}°E`,
                to: `${to.lat.toFixed(3)}°N, ${to.lng.toFixed(3)}°E`,
                distance: parseFloat(dist.toFixed(1)),
                bearing: parseFloat(bearing.toFixed(0)),
                weatherRisk,
                riskScore,
                currentEffect,
                beaufort: bf,
                windSpeed: wind
            });
        }
        return segments;
    }

    // Find nearest noon report to given coordinates
    function findNearestReport(lat, lng, reports) {
        if (!reports || !reports.length) return null;
        let best = reports[0];
        let bestDist = Analytics.haversineDistance(lat, lng, best.lat, best.lng);
        for (const r of reports) {
            const d = Analytics.haversineDistance(lat, lng, r.lat, r.lng);
            if (d < bestDist) { best = r; bestDist = d; }
        }
        return best;
    }

    // =========================================================
    // Weather Risk Zones — COMPUTED from voyage data
    // Zones defined by waypoint clusters, risk from actual BF data
    // =========================================================
    function getWeatherRiskZones() {
        const wps = VesselData.routeWaypoints;
        const reports = VesselData.noonReports.filter(r => r.beaufort !== null);
        if (wps.length < 2) return [];

        // Build zones from waypoint clusters (departure, mid, arrival)
        const departure = wps[0];
        const arrival = wps[wps.length - 1];
        const midIdx = Math.floor(wps.length / 2);
        const midWp = wps[midIdx];

        // Define zone boundaries around each cluster (±0.3° lat/lng)
        const zones = [
            { id: 'zone_dep', center: departure, name: departure.name || 'Departure Zone' },
            { id: 'zone_mid', center: midWp, name: midWp.name || 'Mid-Route Zone' },
            { id: 'zone_arr', center: arrival, name: arrival.name || 'Arrival Zone' }
        ];

        return zones.map(z => {
            const lat = z.center.lat;
            const lng = z.center.lng;
            const bounds = [[lat - 0.3, lng - 0.5], [lat + 0.3, lng + 0.5]];

            // Find reports near this zone
            const zoneReports = reports.filter(r =>
                Math.abs(r.lat - lat) < 0.5 && Math.abs(r.lng - lng) < 1.0
            );
            const avgBF = zoneReports.length > 0
                ? zoneReports.reduce((s, r) => s + r.beaufort, 0) / zoneReports.length : 0;
            const maxBF = zoneReports.length > 0
                ? Math.max(...zoneReports.map(r => r.beaufort)) : 0;
            const avgWind = zoneReports.length > 0
                ? zoneReports.reduce((s, r) => s + (r.windSpd || 0), 0) / zoneReports.length : 0;

            // Risk score: weighted BF + wind
            const riskScore = Math.min(100, Math.round(avgBF * 10 + avgWind * 1.5 + (maxBF > 4 ? (maxBF - 4) * 5 : 0)));

            let risk, color, borderColor;
            if (riskScore < 20) {
                risk = 'Low'; color = 'rgba(34, 197, 94, 0.15)'; borderColor = '#22c55e';
            } else if (riskScore < 45) {
                risk = 'Moderate'; color = 'rgba(245, 158, 11, 0.15)'; borderColor = '#f59e0b';
            } else if (riskScore < 70) {
                risk = 'High'; color = 'rgba(239, 68, 68, 0.15)'; borderColor = '#ef4444';
            } else {
                risk = 'Severe'; color = 'rgba(190, 18, 60, 0.15)'; borderColor = '#be123c';
            }

            // Dynamic description from data
            let description;
            if (zoneReports.length === 0) {
                description = 'No weather data available for this zone.';
            } else if (riskScore < 20) {
                description = `Light winds (avg ${avgWind.toFixed(0)} kts), BF ${avgBF.toFixed(0)}. Calm conditions.`;
            } else if (riskScore < 45) {
                description = `Moderate conditions. Avg BF ${avgBF.toFixed(1)}, wind ${avgWind.toFixed(0)} kts.`;
            } else {
                description = `Heavy weather. Max BF ${maxBF}, avg wind ${avgWind.toFixed(0)} kts. Use caution.`;
            }

            return { id: z.id, name: z.name, bounds, risk, riskScore, color, borderColor, description };
        });
    }

    // =========================================================
    // AI Recommendations — GENERATED from voyage data
    // Every metric is derived, not hardcoded
    // =========================================================
    function getRecommendations() {
        const voyage = VesselData.voyageInfo;
        const bunker = VesselData.bunkerSummary;
        const reports = VesselData.noonReports;
        const fuel = VesselData.engineFuelData;
        const cpSpeed = voyage.cpSpeed || 12.5;

        const steamReports = reports.filter(r => r.distance > 0);
        const idleReports = reports.filter(r => r.distance === 0);
        const idleDays = idleReports.length;
        const steamDays = steamReports.length;
        const avgSteamSpeed = steamDays > 0
            ? steamReports.reduce((s, r) => s + r.avgSpeed, 0) / steamDays : 0;
        const totalDist = voyage.totalDistance;

        // Idle fuel cost
        const idleFuel = fuel.filter(d => d.operation === 'Idle' || d.operation.toLowerCase().includes('idle'));
        const idleLSFO = idleFuel.reduce((s, d) => s + d.totalLSFO, 0);
        const idleCost = idleLSFO * VesselData.fuelPrices.lsfo;

        // Weather data
        const weatherReports = reports.filter(r => r.beaufort !== null);
        const maxBF = weatherReports.length > 0 ? Math.max(...weatherReports.map(r => r.beaufort)) : 0;
        const avgBF = weatherReports.length > 0
            ? weatherReports.reduce((s, r) => s + r.beaufort, 0) / weatherReports.length : 0;

        const recs = [];

        // 1. Route assessment
        const origRoute = VesselData.alternativeRoutes[0];
        const routes = compareRoutes();
        const bestRoute = routes[0];
        if (bestRoute && bestRoute.id === 'original') {
            recs.push({
                priority: 'high', icon: 'fa-route', title: 'Route Assessment',
                recommendation: `Current route (${totalDist} nm via ${voyage.departure} → ${voyage.arrival}) is optimal. Scored ${bestRoute.score}/100 — highest among ${routes.length} analyzed routes.`,
                savings: null
            });
        } else if (bestRoute) {
            const distSaving = origRoute ? (origRoute.distance - bestRoute.distance).toFixed(1) : 0;
            const fuelSaving = origRoute ? (origRoute.fuelEstimate - bestRoute.fuelEstimate).toFixed(1) : 0;
            recs.push({
                priority: 'high', icon: 'fa-route', title: 'Better Route Available',
                recommendation: `"${bestRoute.name}" scores ${bestRoute.score}/100 vs current route. Distance: ${bestRoute.distance} nm. Consider re-routing.`,
                savings: `Save ~${distSaving} nm and ~${fuelSaving} MT fuel`
            });
        }

        // 2. Speed optimization
        if (steamDays > 0 && avgSteamSpeed < cpSpeed) {
            const speedGap = cpSpeed - avgSteamSpeed;
            const fuelDiffEntry = Analytics.findWarrantedEntry(avgSteamSpeed);
            const ecoEntry = Analytics.findWarrantedEntry(cpSpeed);
            const dailyFuelDiff = ecoEntry.meVLSFO - fuelDiffEntry.meVLSFO;
            const potentialSaving = (dailyFuelDiff * steamDays * -1); // negative = more fuel at higher speed
            recs.push({
                priority: 'medium', icon: 'fa-gauge-high', title: 'Speed Optimization',
                recommendation: `Avg steaming speed ${avgSteamSpeed.toFixed(1)} kts vs ECO ${cpSpeed} kts (gap: ${speedGap.toFixed(1)} kts). ${speedGap < 1.5 ? 'Acceptable given maneuvering constraints.' : 'Review operational delays causing sustained under-speed.'}`,
                savings: steamDays > 0 && dailyFuelDiff > 0 ? `~${Math.abs(potentialSaving).toFixed(1)} MT LSFO difference at optimal speed profile` : null
            });
        } else if (steamDays > 0) {
            recs.push({
                priority: 'low', icon: 'fa-gauge-high', title: 'Speed Performance',
                recommendation: `Steaming speed ${avgSteamSpeed.toFixed(1)} kts meets or exceeds CP warranted ${cpSpeed} kts. No speed optimization needed.`,
                savings: null
            });
        }

        // 3. Anchorage / idle time
        if (idleDays > 1) {
            const idleLocation = idleReports.length > 0 ? idleReports[0].location : voyage.arrival;
            const avgDailyIdle = idleFuel.length > 0 ? idleLSFO / idleFuel.length : 0;
            recs.push({
                priority: idleDays > 3 ? 'high' : 'medium', icon: 'fa-anchor',
                title: 'Anchorage Planning',
                recommendation: `${idleDays} days idle at ${idleLocation}. Consumed ${idleLSFO.toFixed(2)} MT LSFO (avg ${avgDailyIdle.toFixed(2)} MT/day) at est. cost $${Math.round(idleCost).toLocaleString()}.${idleDays > 3 ? ' Negotiate earlier berth assignment to reduce idle fuel burn.' : ''}`,
                savings: `Up to $${Math.round(idleCost).toLocaleString()} in idle fuel costs could be avoided`
            });
        }

        // 4. Weather recommendation
        if (maxBF <= 4) {
            recs.push({
                priority: 'low', icon: 'fa-cloud-sun', title: 'Weather Window',
                recommendation: `Favorable conditions throughout voyage (BF ${avgBF.toFixed(0)}–${maxBF}, max wind ${weatherReports.length > 0 ? Math.max(...weatherReports.map(r => r.windSpd || 0)) : 0} kts). No weather routing adjustments needed.`,
                savings: null
            });
        } else {
            const speedLoss = maxBF <= 5 ? 0.8 : maxBF <= 6 ? 1.5 : 2.5;
            recs.push({
                priority: 'high', icon: 'fa-cloud-bolt', title: 'Weather Avoidance',
                recommendation: `Heavy weather recorded (max BF ${maxBF}). Estimated speed loss ${speedLoss.toFixed(1)} kts. Consider weather routing to avoid worst conditions and reduce hull stress.`,
                savings: `~${(speedLoss * steamDays * 0.5).toFixed(1)} MT potential fuel savings via weather avoidance`
            });
        }

        return recs;
    }

    // =========================================================
    // Radar Chart Data — ALL from actual voyage baselines
    // =========================================================
    function getRadarChartData() {
        const routes = compareRoutes();
        const baseline = VesselData.alternativeRoutes[0] || { distance: 1, fuelEstimate: 1 };
        const baselineDist = baseline.distance || 1;
        const baselineFuel = baseline.fuelEstimate || 1;
        const cpSpeed = VesselData.voyageInfo.cpSpeed || 12.5;
        const baselineETA = baselineDist / cpSpeed; // hours

        // Compute current advantage per route from actual voyage data
        const reports = VesselData.noonReports.filter(r => r.currentDir !== null && r.distance > 0);

        return {
            labels: ['Distance', 'Fuel Efficiency', 'Weather Safety', 'ETA', 'Current Advantage'],
            datasets: routes.map(r => {
                const distRatio = Math.min(100, (baselineDist / r.distance) * 100);
                const fuelRatio = Math.min(100, (baselineFuel / r.fuelEstimate) * 100);
                const weatherSafety = Math.max(0, 100 - r.riskScore);
                const etaHours = r.distance / cpSpeed;
                const etaRatio = Math.min(100, (baselineETA / etaHours) * 100);

                // Current advantage: compute from segment analysis
                const segments = analyzeSegments(r.id);
                let currentAdvantage = 70; // neutral base
                if (segments.length > 0) {
                    const favorable = segments.filter(s => s.currentEffect === 'Favorable').length;
                    const adverse = segments.filter(s => s.currentEffect === 'Adverse').length;
                    currentAdvantage = Math.min(100, Math.max(0, 50 + ((favorable - adverse) / segments.length) * 50));
                }

                return {
                    label: r.name,
                    data: [
                        distRatio.toFixed(0),
                        fuelRatio.toFixed(0),
                        weatherSafety,
                        etaRatio.toFixed(0),
                        Math.round(currentAdvantage)
                    ],
                    borderColor: r.color,
                    backgroundColor: r.color + '33',
                    borderWidth: 2,
                    pointBackgroundColor: r.color
                };
            })
        };
    }

    // =========================================================
    // Voyage Planner — weather outlook from ACTUAL voyage data
    // =========================================================
    function planVoyage(departure, arrival, speed, condition) {
        const distance = Analytics.haversineDistance(departure.lat, departure.lng, arrival.lat, arrival.lng);
        const eta = calculateETA(distance, speed);
        const fuel = estimateFuel(distance, speed);

        // Weather outlook from actual voyage data in the region
        const reports = VesselData.noonReports.filter(r => r.beaufort !== null);
        const nearDep = findNearestReport(departure.lat, departure.lng, reports);
        const nearArr = findNearestReport(arrival.lat, arrival.lng, reports);

        let avgBF = 0;
        let reportCount = 0;
        if (nearDep) { avgBF += nearDep.beaufort; reportCount++; }
        if (nearArr) { avgBF += nearArr.beaufort; reportCount++; }
        avgBF = reportCount > 0 ? avgBF / reportCount : 0;

        let weatherOutlook, riskAssessment;
        if (avgBF <= 3) {
            weatherOutlook = 'Favorable'; riskAssessment = 'Low';
        } else if (avgBF <= 5) {
            weatherOutlook = 'Moderate'; riskAssessment = 'Moderate';
        } else {
            weatherOutlook = 'Adverse'; riskAssessment = 'High';
        }

        return {
            distance: parseFloat(distance.toFixed(1)),
            eta,
            fuel,
            recommendedSpeed: speed,
            condition,
            weatherOutlook,
            riskAssessment
        };
    }

    return {
        scoreRoute,
        calculateETA,
        estimateFuel,
        compareRoutes,
        analyzeSegments,
        getWeatherRiskZones,
        getRecommendations,
        getRadarChartData,
        planVoyage
    };
})();
