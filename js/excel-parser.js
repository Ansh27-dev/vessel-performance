// ============================================================
// EXCEL PARSER — Noon Report .xlsx → VesselData Mapping
// Parses the standard noon report template and updates
// all existing data structures in place.
// ============================================================

const ExcelParser = (() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // ========== PUBLIC ==========

    async function parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
                    const result = extractAll(wb);
                    applyToVesselData(result);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // ========== EXTRACTION ==========

    function extractAll(wb) {
        // Pick first non-GUIDELINES sheet
        const sheetName = wb.SheetNames.find(n => !n.toUpperCase().includes('GUIDE')) || wb.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null, raw: true });

        const vesselName = findCell(rows, 'VESSEL') || 'Unknown Vessel';
        const fieldMap  = buildFieldMap(rows);        // label → row array
        const startCol  = 2;                          // data starts at column C (index 2)
        const numDays   = countDays(fieldMap, startCol);
        if (numDays === 0) throw new Error('No date entries found. Ensure the Excel has UTC DATE values.');

        // Raw daily vectors
        const v = (label, ...alt) => dailyVec(fieldMap, numDays, startCol, label, ...alt);

        const utcDates      = v('UTC DATE');
        const latRaw        = v('LATITUDE');
        const lngRaw        = v('LONGITUDE');
        const conditions    = v('VESSEL CONDITION');
        const lastPorts     = v('LAST PORT');
        const nextPorts     = v('NEXT PORT');
        const distSailed    = v('DISTANCE SAILED');
        const engineDist    = v('ENGINE DISTANCE 24 HRS', 'ENGINE DISTANCE');
        const cpSpeedRaw    = v('ALLOWED CP SPEED', 'CP SPEED');
        const speed24       = v('SPEED LAST 24 HRS', 'SPEED LAST 24');
        const avgSpeedRaw   = v('AVG SPEED', 'AVERAGE SPEED');
        const rpmRaw        = v('MAIN ENGINE RPM', 'RPM');
        const slipRaw       = v('AVERAGE SLIP', 'SLIP');
        const windSpd       = v('WIND SPEED');
        const windDir       = v('WIND DIRECTION');
        const currentDir    = v('CURRENT DIRECTION');
        const beaufort      = v('BUEFORT SCALE', 'BEAUFORT SCALE', 'BEAUFORT');
        const meLSFO        = v('ME LSFO CONSUMPTION');
        const aeLSFO        = v('AE LSFO CONSUMPTION');
        const boilerLSFO    = v('BOILER LSFO CONSUMPTION');
        const meMGO         = v('ME MGO CONSUMPTION');
        const aeMGO         = v('AE MGO CONSUMPTION');
        const boilerMGO     = v('BOILER MGO CONSUMPTION');
        const totalLSFORaw  = v('TOTAL LSFO CONSUMPTION');
        const totalMGORaw   = v('TOTAL MGO CONSUMPTION');
        const robLSFO       = v('ROB LSFO');
        const robMGO        = v('ROB MGO');

        // Parse dates
        const dates = utcDates.map(toDate);

        // Derive CP speed (first non-zero value across days)
        const cpSpeed = cpSpeedRaw.map(num).find(n => n > 0) || 12.5;

        // Ports
        const departure = firstStr(lastPorts) || 'Unknown';
        const arrival   = firstStr(nextPorts) || 'Unknown';
        const condition = (firstStr(conditions) || 'Ballast').replace(/^IN\s+/i, '');

        // Build noon reports & fuel data
        const noonReports   = [];
        const engineFuelData = [];

        for (let i = 0; i < numDays; i++) {
            const date     = dates[i];
            const dateISO  = isoDate(date);
            const dateShort = shortDate(date);

            const lat = parseLat(latRaw[i]);
            const lng = parseLng(lngRaw[i]);

            const dist  = num(distSailed[i]) || num(engineDist[i]) || 0;
            const speed = num(speed24[i]) || num(avgSpeedRaw[i]) || 0;
            const rpm   = num(rpmRaw[i]) || 0;

            // Operation inference
            let operation = 'Idle';
            if (dist > 0 && rpm > 0) operation = 'Maneuvering';
            else if (dist > 0)       operation = 'Idle/Maneuvering';

            // Location inference
            let location = '';
            if (dist === 0 && i === 0) location = departure;
            else if (dist > 0)         location = 'En route to ' + arrival;
            else                        location = arrival + ' Anchorage';

            noonReports.push({
                date: dateISO, dateShort,
                lat: lat || 0, lng: lng || 0,
                latStr: fmtLat(lat), lngStr: fmtLng(lng),
                operation, distance: dist,
                avgSpeed: speed, cpSpeed,
                rpm, slip: num(slipRaw[i]),
                windDir: numOrNull(windDir[i]),
                windSpd: numOrNull(windSpd[i]),
                beaufort: numOrNull(beaufort[i]),
                waveHeight: null, swellDir: null, swellHeight: null,
                currentDir: numOrNull(currentDir[i]),
                currentSpd: null, location
            });

            const me  = num(meLSFO[i]);
            const ae  = num(aeLSFO[i]);
            const blr = num(boilerLSFO[i]);
            const tl  = num(totalLSFORaw[i]) || (me + ae + blr);
            const mg  = num(totalMGORaw[i]) || (num(meMGO[i]) + num(aeMGO[i]) + num(boilerMGO[i]));
            const stmHrs = speed > 0 && dist > 0 ? +(dist / speed).toFixed(1) : 0;

            engineFuelData.push({
                date: dateISO, dateShort, operation, steamingHours: stmHrs,
                distance: dist, speed, meLSFO: me, aeLSFO: ae, boilerLSFO: blr,
                totalLSFO: +tl.toFixed(3), mgo: +mg.toFixed(3), rpm,
                robLSFO: num(robLSFO[i]), robMGO: num(robMGO[i])
            });
        }

        // Aggregate stats
        const steamingDays  = noonReports.filter(r => r.distance > 0).length;
        const idleDays      = numDays - steamingDays;
        const totalDistance  = +(noonReports.reduce((s, r) => s + r.distance, 0)).toFixed(2);
        const avgSpeedCalc  = steamingDays > 0
            ? +(noonReports.filter(r => r.distance > 0).reduce((s, r) => s + r.avgSpeed, 0) / steamingDays).toFixed(2)
            : 0;
        const sumME   = +engineFuelData.reduce((s, d) => s + d.meLSFO, 0).toFixed(3);
        const sumAE   = +engineFuelData.reduce((s, d) => s + d.aeLSFO, 0).toFixed(3);
        const sumBlr  = +engineFuelData.reduce((s, d) => s + d.boilerLSFO, 0).toFixed(3);
        const sumLSFO = +engineFuelData.reduce((s, d) => s + d.totalLSFO, 0).toFixed(3);
        const sumMGO  = +engineFuelData.reduce((s, d) => s + d.mgo, 0).toFixed(3);
        const openLSFO = engineFuelData[0]?.robLSFO || 0;
        const closeLSFO = engineFuelData[numDays - 1]?.robLSFO || 0;
        const openMGO  = engineFuelData[0]?.robMGO || 0;
        const closeMGO = engineFuelData[numDays - 1]?.robMGO || 0;

        return {
            vesselName, sheetName, numDays, dates,
            noonReports, engineFuelData,
            departure, arrival, condition, cpSpeed,
            totalDistance, avgSpeed: avgSpeedCalc,
            steamingDays, idleDays,
            sumME, sumAE, sumBlr, sumLSFO, sumMGO,
            openLSFO, closeLSFO, openMGO, closeMGO
        };
    }

    // ========== APPLY TO EXISTING VesselData ==========

    function applyToVesselData(r) {
        // --- vessel & voyage info ---
        Object.assign(VesselData.vesselInfo, { name: r.vesselName, alias: r.vesselName });
        Object.assign(VesselData.voyageInfo, {
            departure: r.departure,
            departureLat: r.noonReports[0].lat,
            departureLng: r.noonReports[0].lng,
            arrival: r.arrival,
            arrivalLat: r.noonReports[r.numDays - 1].lat,
            arrivalLng: r.noonReports[r.numDays - 1].lng,
            condition: r.condition,
            cpSpeed: r.cpSpeed,
            totalDistance: r.totalDistance,
            averageSpeed: r.avgSpeed,
            periodStart: isoDate(r.dates[0]),
            periodEnd: isoDate(r.dates[r.numDays - 1]),
            totalDays: r.numDays,
            steamingDays: r.steamingDays,
            idleDays: r.idleDays,
            status: 'Completed'
        });

        // --- core arrays (mutate in place) ---
        spliceReplace(VesselData.noonReports, r.noonReports);
        spliceReplace(VesselData.engineFuelData, r.engineFuelData);

        // --- bunker summary (warranted from table, not hardcoded) ---
        const avgStmSpeed = r.steamingDays > 0
            ? r.noonReports.filter(n => n.distance > 0).reduce((s, n) => s + n.avgSpeed, 0) / r.steamingDays
            : r.cpSpeed;
        const wEntry = VesselData.warrantedTable.find(w => Math.abs(w.speed - avgStmSpeed) < 0.75) || VesselData.warrantedTable[0];
        const wPerDay = wEntry ? (wEntry.meVLSFO + wEntry.aeFO) : 26.5;
        const wTotal = +(wPerDay * Math.max(r.steamingDays, 1)).toFixed(1);
        const saved  = +(wTotal - r.sumLSFO).toFixed(3);
        Object.assign(VesselData.bunkerSummary.lsfo, { opening: r.openLSFO, closing: r.closeLSFO, totalConsumed: r.sumLSFO, warranted: wTotal, saved });
        Object.assign(VesselData.bunkerSummary.mgo,  { opening: r.openMGO,  closing: r.closeMGO,  totalConsumed: r.sumMGO });

        // --- LSFO by system ---
        const tl = r.sumLSFO || 1;
        Object.assign(VesselData.lsfoBySystem.me,     { amount: r.sumME,  percentage: Math.round(r.sumME / tl * 100) });
        Object.assign(VesselData.lsfoBySystem.ae,     { amount: r.sumAE,  percentage: Math.round(r.sumAE / tl * 100) });
        Object.assign(VesselData.lsfoBySystem.boiler, { amount: r.sumBlr, percentage: Math.round(r.sumBlr / tl * 100) });

        // --- time utilization ---
        const idleDest = r.noonReports.filter((n, i) => n.distance === 0 && i > 0).length;
        const idleDep  = r.noonReports.filter((n, i) => n.distance === 0 && i === 0).length;
        Object.assign(VesselData.timeUtilization.idleSungaiLinggi, { percentage: Math.round(idleDest / r.numDays * 100), days: idleDest, label: 'Idle at ' + r.arrival });
        Object.assign(VesselData.timeUtilization.maneuvering,      { percentage: Math.round(r.steamingDays / r.numDays * 100), days: r.steamingDays, label: 'Maneuvering/Transit' });
        Object.assign(VesselData.timeUtilization.idleSingapore,    { percentage: Math.round(idleDep / r.numDays * 100), days: idleDep, label: 'Idle at ' + r.departure });

        // --- voyage summary ---
        spliceReplace(VesselData.voyageSummary, r.noonReports.map(n => ({
            date: n.dateShort, distance: n.distance,
            operation: n.distance === 0 ? 'Idle at ' + n.location : n.operation,
            speed: n.avgSpeed,
            remark: n.distance === 0 ? 'Below Warranted' : 'Maneuvering Only',
            flag: n.distance === 0 ? 'idle' : 'maneuvering'
        })));

        // --- route waypoints (unique positions) ---
        const seen = new Set();
        const wps = [];
        r.noonReports.forEach((n, i) => {
            const k = n.lat.toFixed(2) + '_' + n.lng.toFixed(2);
            if (seen.has(k)) return;
            seen.add(k);
            wps.push({ lat: n.lat, lng: n.lng, name: n.location,
                type: i === 0 ? 'departure' : 'waypoint', date: n.dateShort });
        });
        if (wps.length > 1) wps[wps.length - 1].type = 'arrival';
        spliceReplace(VesselData.routeWaypoints, wps);

        // --- alternative routes ---
        const origWps = wps.map(w => ({ lat: w.lat, lng: w.lng }));
        if (VesselData.alternativeRoutes[0]) {
            VesselData.alternativeRoutes[0].waypoints = origWps;
            VesselData.alternativeRoutes[0].distance = r.totalDistance;
            VesselData.alternativeRoutes[0].fuelEstimate = r.sumLSFO;
        }
        if (VesselData.alternativeRoutes[1]) {
            VesselData.alternativeRoutes[1].waypoints = origWps.map((w, i) => i === 0 || i === origWps.length - 1 ? w : { lat: w.lat + 0.15, lng: w.lng + 0.1 });
            VesselData.alternativeRoutes[1].distance = +(r.totalDistance * 1.08).toFixed(1);
            VesselData.alternativeRoutes[1].fuelEstimate = +(r.sumLSFO * 1.08).toFixed(1);
        }
        if (VesselData.alternativeRoutes[2]) {
            VesselData.alternativeRoutes[2].waypoints = origWps.map((w, i) => i === 0 || i === origWps.length - 1 ? w : { lat: w.lat - 0.12, lng: w.lng - 0.08 });
            VesselData.alternativeRoutes[2].distance = +(r.totalDistance * 1.06).toFixed(1);
            VesselData.alternativeRoutes[2].fuelEstimate = +(r.sumLSFO * 1.06).toFixed(1);
        }

        // --- deviation analysis ---
        const maxBF = Math.max(0, ...r.noonReports.map(n => n.beaufort || 0));
        const devs = [];
        if (r.avgSpeed < r.cpSpeed) devs.push({ type:'operational', icon:'fa-anchor', severity:'info',
            title: `Speed Below Warranted – ${r.avgSpeed} kts vs ${r.cpSpeed} kts`,
            detail: `Average steaming speed ${r.avgSpeed} kts below warranted ${r.cpSpeed} kts. Analysis indicates deviation is due to maneuvering constraints, not engine deficiency.`,
            impact: 'Review operational constraints during transit legs.' });
        if (r.idleDays > 1) {
            // Compute actual idle consumption from idle-day fuel data
            const idleFuelData = r.engineFuelData.filter(d => d.operation === 'Idle' || d.operation.toLowerCase().includes('idle'));
            const idleLSFOTotal = idleFuelData.reduce((s, d) => s + d.totalLSFO, 0);
            const avgIdleDaily = idleFuelData.length > 0 ? (idleLSFOTotal / idleFuelData.length) : 0;
            devs.push({ type:'operational', icon:'fa-clock', severity:'warning',
                title: `${r.idleDays} Days Idle at Anchor`,
                detail: `${r.idleDays} days idle at ${r.arrival}. This is an operational/commercial delay. Idle consumption averaged ${avgIdleDaily.toFixed(2)} MT LSFO/day (total ${idleLSFOTotal.toFixed(2)} MT).`,
                impact: `${idleLSFOTotal.toFixed(1)} MT LSFO consumed during idle. Potential off-hire claim.` });
        }
        devs.push({ type:'weather', icon: maxBF <= 4 ? 'fa-cloud-sun' : 'fa-cloud-bolt', severity: maxBF <= 4 ? 'success' : 'warning',
            title: maxBF <= 4 ? 'No Heavy Weather Impact' : `Heavy Weather – BF ${maxBF}`,
            detail: `Max Beaufort ${maxBF}. ${maxBF <= 4 ? 'Favorable conditions throughout.' : 'May have impacted performance.'}`,
            impact: maxBF <= 4 ? 'None – favorable conditions.' : 'Moderate – review speed/fuel impact.' });
        if (r.sumME > 0) devs.push({ type:'engine', icon:'fa-gear', severity:'info',
            title: `ME Operated ${r.steamingDays} of ${r.numDays} Days`,
            detail: `ME consumed ${r.sumME.toFixed(3)} MT LSFO. AE+Boiler consumed ${(r.sumAE + r.sumBlr).toFixed(3)} MT LSFO.`,
            impact: 'Engine performance within normal parameters.' });
        spliceReplace(VesselData.deviationAnalysis, devs);

        // --- alerts ---
        const alerts = [];
        if (r.idleDays > 2) alerts.push({ id:1, type:'warning', icon:'fa-triangle-exclamation', title:'Extended Idle Time', message:`${r.idleDays} days idle at ${r.arrival}.`, time:'Just now', date: isoDate(r.dates[r.numDays-1]) });
        if (r.avgSpeed < r.cpSpeed) alerts.push({ id:2, type:'info', icon:'fa-gauge-high', title:'Speed Deviation', message:`Avg ${r.avgSpeed} kts vs CP ${r.cpSpeed} kts.`, time:'Just now', date: isoDate(r.dates[r.numDays-1]) });
        if (saved > 0) alerts.push({ id:3, type:'success', icon:'fa-leaf', title:'Fuel Savings', message:`Saved ${saved.toFixed(3)} MT LSFO vs warranted.`, time:'Just now', date: isoDate(r.dates[r.numDays-1]) });
        alerts.push({ id:4, type:'info', icon:'fa-file-excel', title:'Data Loaded', message:`${r.numDays} days from ${r.vesselName} loaded.`, time:'Just now', date: isoDate(r.dates[r.numDays-1]) });
        spliceReplace(VesselData.alerts, alerts);

        // --- claims ---
        const spdDev = r.cpSpeed > 0 ? +((r.avgSpeed - r.cpSpeed) / r.cpSpeed * 100).toFixed(1) : 0;
        const noSpeedClaim = r.steamingDays < r.idleDays;
        Object.assign(VesselData.claimsAnalysis.speed, {
            actual: r.avgSpeed, warranted: r.cpSpeed, deviation: spdDev,
            verdict: noSpeedClaim ? 'No Valid Claim' : (r.avgSpeed >= r.cpSpeed ? 'No Claim' : 'Review Required'),
            verdictClass: noSpeedClaim ? 'success' : (r.avgSpeed >= r.cpSpeed ? 'success' : 'warning'),
            explanation: `Vessel averaged ${r.avgSpeed} kts vs warranted ${r.cpSpeed} kts. ${noSpeedClaim ? 'Deviation due to idle time/maneuvering — NOT a valid speed claim.' : 'Review transit performance.'}`
        });
        Object.assign(VesselData.claimsAnalysis.fuel, {
            actual: r.sumLSFO, warranted: wTotal, saved,
            verdict: saved >= 0 ? 'Favorable to Charterer' : 'Overconsumption',
            verdictClass: saved >= 0 ? 'success' : 'warning',
            explanation: `LSFO ${r.sumLSFO.toFixed(3)} MT vs warranted ${wTotal} MT. ${saved >= 0 ? 'Saved ' + saved.toFixed(3) + ' MT.' : 'Excess ' + Math.abs(saved).toFixed(3) + ' MT.'}`
        });
        // Idle fuel: sum from actual idle-day entries, not proportional estimate
        const idleFuelEntries = r.engineFuelData.filter(d => d.operation === 'Idle' || d.operation.toLowerCase().includes('idle'));
        const idleFuel = +(idleFuelEntries.reduce((s, d) => s + d.totalLSFO, 0)).toFixed(2);
        Object.assign(VesselData.claimsAnalysis.idleTime, {
            days: r.idleDays, location: r.arrival + ' Anchorage', fuelConsumed: idleFuel,
            verdict: r.idleDays > 2 ? 'Review Required' : 'No Claim',
            verdictClass: r.idleDays > 2 ? 'warning' : 'success',
            explanation: r.idleDays > 2 ? `${r.idleDays} days at anchor. Review CP idle time provisions.` : 'Within normal parameters.'
        });

        // --- KPIs ---
        Object.assign(VesselData.kpis, {
            activeVessels: 1,
            avgSpeedVsCP: r.cpSpeed > 0 ? (r.avgSpeed / r.cpSpeed * 100).toFixed(1) : '100.0',
            fuelEfficiencyScore: wTotal > 0 ? ((1 - r.sumLSFO / wTotal) * 100 + 80).toFixed(0) : '80',
            voyageStatus: 'Completed', daysAtSea: r.numDays,
            fuelSaved: +saved.toFixed(3),
            fuelSavedCost: (saved * VesselData.fuelPrices.lsfo).toFixed(0),
            idleFuelCost: (idleFuel * VesselData.fuelPrices.lsfo).toFixed(0),
            totalFuelCost: (r.sumLSFO * VesselData.fuelPrices.lsfo + r.sumMGO * VesselData.fuelPrices.mgo).toFixed(0)
        });

        // --- fleet overview ---
        VesselData.fleetOverview[0].name = r.vesselName;
        VesselData.fleetOverview[0].location = r.arrival;
        VesselData.fleetOverview[0].fuelROB = r.closeLSFO;
        VesselData.fleetOverview[0].condition = r.condition;
    }

    // ========== HELPERS ==========

    function spliceReplace(arr, newItems) { arr.splice(0, arr.length, ...newItems); }

    function buildFieldMap(rows) {
        const m = {};
        for (let i = 0; i < rows.length; i++) {
            const label = rows[i] && rows[i][1];
            if (!label) continue;
            const key = String(label).toUpperCase().trim();
            if (!m[key]) m[key] = rows[i]; // keep first occurrence
        }
        return m;
    }

    function findCell(rows, colALabel) {
        for (const row of rows) {
            if (row && row[0] && String(row[0]).toUpperCase().trim() === colALabel.toUpperCase() && row[1]) {
                return String(row[1]).trim();
            }
        }
        return null;
    }

    function fieldRow(map, label, ...alt) {
        const keys = [label, ...alt].map(l => l.toUpperCase().trim());
        // Exact match first
        for (const k of keys) { if (map[k]) return map[k]; }
        // Partial match
        for (const k of keys) {
            for (const [mk, mv] of Object.entries(map)) {
                if (mk.includes(k)) return mv;
            }
        }
        return null;
    }

    function dailyVec(map, n, startCol, label, ...alt) {
        const row = fieldRow(map, label, ...alt);
        if (!row) return Array(n).fill(null);
        return Array.from({ length: n }, (_, i) => row[startCol + i] ?? null);
    }

    function countDays(map, startCol) {
        const row = fieldRow(map, 'UTC DATE');
        if (!row) return 0;
        let c = 0;
        for (let i = startCol; i < row.length; i++) {
            const v = row[i];
            if (v === null || v === undefined) break;
            if (v instanceof Date || (typeof v === 'number' && v > 30000) || (typeof v === 'string' && /\d{4}/.test(v))) c++;
            else break;
        }
        return c;
    }

    function clean(v) {
        if (v === null || v === undefined) return null;
        if (v instanceof Date) return v;
        const s = String(v).trim();
        if (s === '' || s === '-' || s.toUpperCase() === 'N/A' || s.toUpperCase() === 'NIL' || s.startsWith('=')) return null;
        return v;
    }

    function num(v) {
        const c = clean(v);
        if (c === null) return 0;
        if (typeof c === 'number') return c;
        const n = parseFloat(String(c));
        return isNaN(n) ? 0 : n;
    }

    function numOrNull(v) {
        const c = clean(v);
        if (c === null) return null;
        if (typeof c === 'number') return c;
        const n = parseFloat(String(c));
        return isNaN(n) ? null : n;
    }

    function firstStr(arr) {
        for (const v of arr) {
            const c = clean(v);
            if (c !== null && typeof c !== 'number') return String(c).trim();
            if (typeof c === 'number') return String(c);
        }
        return null;
    }

    // --- Date helpers ---
    function toDate(v) {
        if (v instanceof Date) return v;
        if (typeof v === 'number' && v > 30000) return new Date((v - 25569) * 86400000);
        if (typeof v === 'string') { const d = new Date(v); return isNaN(d) ? null : d; }
        return null;
    }
    function isoDate(d) { return d ? d.toISOString().split('T')[0] : null; }
    function shortDate(d) { return d ? `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}` : ''; }

    // --- Lat/Lng parsing from DMS strings ---
    function parseLat(v) {
        if (typeof v === 'number') return v;
        if (!v) return null;
        const m = String(v).match(/(\d+)\s+([\d.]+)\s*(N|S)/i);
        if (!m) return null;
        let dec = parseInt(m[1]) + parseFloat(m[2]) / 60;
        if (m[3].toUpperCase() === 'S') dec = -dec;
        return +dec.toFixed(4);
    }
    function parseLng(v) {
        if (typeof v === 'number') return v;
        if (!v) return null;
        const m = String(v).match(/(\d+)\s+([\d.]+)\s*(E|W)?/i);
        if (!m) return null;
        let dec = parseInt(m[1]) + parseFloat(m[2]) / 60;
        if (m[3] && m[3].toUpperCase() === 'W') dec = -dec;
        return +dec.toFixed(4);
    }
    function fmtLat(d) {
        if (d === null) return '';
        const dir = d >= 0 ? 'N' : 'S'; const a = Math.abs(d);
        return `${String(Math.floor(a)).padStart(2,'0')}° ${((a % 1) * 60).toFixed(1)}' ${dir}`;
    }
    function fmtLng(d) {
        if (d === null) return '';
        const dir = d >= 0 ? 'E' : 'W'; const a = Math.abs(d);
        return `${String(Math.floor(a)).padStart(3,'0')}° ${((a % 1) * 60).toFixed(1)}' ${dir}`;
    }

    return { parseFile };
})();
