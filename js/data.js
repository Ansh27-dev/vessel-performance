// ============================================================
// DATA MODULE - M/V XYZ (DE XI) Vessel Performance Data
// Real data from vessel noon reports: 22-30 Apr 2026
// Voyage: Singapore EOPL → Sungai Linggi (Ballast)
// ============================================================

const VesselData = (() => {
    // --- Vessel Information ---
    const vesselInfo = {
        name: 'M/V XYZ',
        alias: 'M/T DE XI',
        imo: '9876543',
        mmsi: '563001234',
        flag: 'Singapore',
        type: 'Oil/Chemical Tanker',
        dwt: 74999,
        built: 2019,
        class: 'Lloyd\'s Register',
        callSign: '9V2XY',
        owner: 'Pacific Maritime Holdings',
        charterer: 'Global Energy Trading Corp.'
    };

    // --- Voyage Information ---
    const voyageInfo = {
        voyageNo: 'VY-2026-0047',
        departure: 'Singapore EOPL',
        departureLat: 2.0317,
        departureLng: 104.8283,
        arrival: 'Sungai Linggi',
        arrivalLat: 2.2633,
        arrivalLng: 101.9983,
        condition: 'Ballast',
        cpSpeed: 12.5,
        cpSpeedLabel: 'ECO',
        totalDistance: 234.03,
        averageSpeed: 10.35,
        deliveryDate: '2026-04-22T00:01:00',
        periodStart: '2026-04-22',
        periodEnd: '2026-04-30',
        totalDays: 9,
        steamingDays: 2,
        idleDays: 7,
        status: 'Completed'
    };

    // --- Daily Noon Report Data ---
    const noonReports = [
        {
            date: '2026-04-22',
            dateShort: '22-Apr',
            lat: 2.0317,
            lng: 104.8283,
            latStr: "02° 01.9' N",
            lngStr: "104° 49.7' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: null,
            windSpd: null,
            beaufort: null,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: null,
            currentSpd: null,
            location: 'Singapore EOPL'
        },
        {
            date: '2026-04-23',
            dateShort: '23-Apr',
            lat: 1.2983,
            lng: 103.3317,
            latStr: "01° 17.9' N",
            lngStr: "103° 19.9' E",
            operation: 'Maneuvering',
            distance: 127.02,
            avgSpeed: 11.3,
            cpSpeed: 12.5,
            rpm: 80,
            slip: 5.5,
            windDir: 5,
            windSpd: 6,
            beaufort: 2,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 8,
            currentSpd: null,
            location: 'Malacca Strait'
        },
        {
            date: '2026-04-24',
            dateShort: '24-Apr',
            lat: 2.2633,
            lng: 101.9983,
            latStr: "02° 15.8' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle/Maneuvering',
            distance: 107.01,
            avgSpeed: 11.7,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 5.6,
            windDir: 5,
            windSpd: 4,
            beaufort: 2,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 11,
            currentSpd: null,
            location: 'En route to Sungai Linggi'
        },
        {
            date: '2026-04-25',
            dateShort: '25-Apr',
            lat: 2.2633,
            lng: 101.9983,
            latStr: "02° 15.8' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 8,
            windSpd: 1,
            beaufort: 3,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 4,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        },
        {
            date: '2026-04-26',
            dateShort: '26-Apr',
            lat: 2.2633,
            lng: 101.9983,
            latStr: "02° 15.8' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 4,
            windSpd: 3,
            beaufort: 2,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 10,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        },
        {
            date: '2026-04-27',
            dateShort: '27-Apr',
            lat: 2.2633,
            lng: 101.9983,
            latStr: "02° 15.8' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 4,
            windSpd: 3,
            beaufort: 2,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 10,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        },
        {
            date: '2026-04-28',
            dateShort: '28-Apr',
            lat: 2.2633,
            lng: 101.9983,
            latStr: "02° 15.8' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 6,
            windSpd: 2,
            beaufort: 2,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 10,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        },
        {
            date: '2026-04-29',
            dateShort: '29-Apr',
            lat: 2.2650,
            lng: 101.9983,
            latStr: "02° 15.9' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 7,
            windSpd: 2,
            beaufort: 3,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 10,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        },
        {
            date: '2026-04-30',
            dateShort: '30-Apr',
            lat: 2.2650,
            lng: 101.9983,
            latStr: "02° 15.9' N",
            lngStr: "101° 59.9' E",
            operation: 'Idle',
            distance: 0,
            avgSpeed: 0,
            cpSpeed: 12.5,
            rpm: 0,
            slip: 0,
            windDir: 8,
            windSpd: 6,
            beaufort: 3,
            waveHeight: null,
            swellDir: null,
            swellHeight: null,
            currentDir: 10,
            currentSpd: null,
            location: 'Sungai Linggi Anchorage'
        }
    ];

    // --- Engine / Fuel Data ---
    const engineFuelData = [
        {
            date: '2026-04-22',
            dateShort: '22-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.19,
            boilerLSFO: 0.69,
            totalLSFO: 2.880,
            mgo: 3.970,
            rpm: 0,
            robLSFO: 970.68,
            robMGO: 242.98
        },
        {
            date: '2026-04-23',
            dateShort: '23-Apr',
            operation: 'Maneuvering',
            steamingHours: 11.2,
            distance: 127.02,
            speed: 11.3,
            meLSFO: 9.107,
            aeLSFO: 3.71,
            boilerLSFO: 0.83,
            totalLSFO: 13.647,
            mgo: 0,
            rpm: 80,
            robLSFO: 959.73,
            robMGO: 246.54
        },
        {
            date: '2026-04-24',
            dateShort: '24-Apr',
            operation: 'Idle/Maneuvering',
            steamingHours: 9.1,
            distance: 107.01,
            speed: 11.7,
            meLSFO: 3.370,
            aeLSFO: 3.20,
            boilerLSFO: 0.87,
            totalLSFO: 10.440,
            mgo: 0.1,
            rpm: 0,
            robLSFO: 949.29,
            robMGO: 246.44
        },
        {
            date: '2026-04-25',
            dateShort: '25-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.70,
            boilerLSFO: 1.17,
            totalLSFO: 3.870,
            mgo: 0.004,
            rpm: 0,
            robLSFO: 945.42,
            robMGO: 246.44
        },
        {
            date: '2026-04-26',
            dateShort: '26-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.60,
            boilerLSFO: 1.15,
            totalLSFO: 3.750,
            mgo: 0,
            rpm: 0,
            robLSFO: 941.67,
            robMGO: 246.44
        },
        {
            date: '2026-04-27',
            dateShort: '27-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.68,
            boilerLSFO: 1.19,
            totalLSFO: 3.870,
            mgo: 0,
            rpm: 0,
            robLSFO: 937.80,
            robMGO: 246.44
        },
        {
            date: '2026-04-28',
            dateShort: '28-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.67,
            boilerLSFO: 1.21,
            totalLSFO: 3.880,
            mgo: 0.1,
            rpm: 0,
            robLSFO: 933.92,
            robMGO: 246.34
        },
        {
            date: '2026-04-29',
            dateShort: '29-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.68,
            boilerLSFO: 1.21,
            totalLSFO: 3.890,
            mgo: 0.1,
            rpm: 0,
            robLSFO: 930.03,
            robMGO: 246.24
        },
        {
            date: '2026-04-30',
            dateShort: '30-Apr',
            operation: 'Idle',
            steamingHours: 0,
            distance: 0,
            speed: 0,
            meLSFO: 0,
            aeLSFO: 2.62,
            boilerLSFO: 1.14,
            totalLSFO: 3.760,
            mgo: 0,
            rpm: 0,
            robLSFO: 926.27,
            robMGO: 246.24
        }
    ];

    // --- Warranted Speed & Consumption Table (Ballast) ---
    const warrantedTable = [
        { speed: 12.5, label: 'ECO', rpmRange: '79-80', meVLSFO: 23.5, aeFO: 3, boiler: 0 },
        { speed: 12.0, label: '', rpmRange: '78-79', meVLSFO: 22.8, aeFO: 3, boiler: 0 },
        { speed: 11.5, label: '', rpmRange: '75-77', meVLSFO: 22.2, aeFO: 3, boiler: 0 },
        { speed: 11.0, label: '', rpmRange: '74-75', meVLSFO: 21.6, aeFO: 3, boiler: 0 },
        { speed: 10.5, label: '', rpmRange: '72-73', meVLSFO: 21.1, aeFO: 3, boiler: 0 },
        { speed: 10.0, label: '', rpmRange: '71-72', meVLSFO: 20.6, aeFO: 3, boiler: 0 }
    ];

    // --- Port/Special Operation Consumption ---
    const idleConsumption = {
        totalPerDay: 5.5,
        aePerDay: 3.0,
        boilerPerDay: 2.5,
        description: 'Idle at Anchorage'
    };

    // --- Bunker ROB Summary ---
    const bunkerSummary = {
        lsfo: {
            opening: 970.68,
            closing: 926.27,
            totalConsumed: 46.987,
            warranted: 49.5,
            saved: 2.513
        },
        mgo: {
            opening: 242.98,
            closing: 246.24,
            totalConsumed: 4.274,
            received: 7.54
        }
    };

    // --- LSFO Consumption by System ---
    const lsfoBySystem = {
        ae: { amount: 25.05, percentage: 53 },
        me: { amount: 12.477, percentage: 27 },
        boiler: { amount: 9.46, percentage: 20 }
    };

    // --- Time Utilization ---
    const timeUtilization = {
        idleSungaiLinggi: { percentage: 67, days: 6, label: 'Idle at Sungai Linggi' },
        maneuvering: { percentage: 22, days: 2, label: 'Maneuvering/Transit' },
        idleSingapore: { percentage: 11, days: 1, label: 'Idle at Singapore EOPL' }
    };

    // --- Voyage Summary ---
    const voyageSummary = [
        { date: '22-Apr', distance: 0, operation: 'Idle at SGP EOPL', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '23-Apr', distance: 127.02, operation: 'Maneuvering', speed: 11.3, remark: 'Maneuvering Only', flag: 'maneuvering' },
        { date: '24-Apr', distance: 107.01, operation: 'Maneuvering/Anchor', speed: 11.7, remark: 'Maneuvering Only', flag: 'maneuvering' },
        { date: '25-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '26-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '27-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '28-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '29-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' },
        { date: '30-Apr', distance: 0, operation: 'Idle at Sungai Linggi', speed: 0, remark: 'Below Warranted', flag: 'idle' }
    ];

    // --- Route Waypoints for Map ---
    const routeWaypoints = [
        { lat: 2.0317, lng: 104.8283, name: 'Singapore EOPL', type: 'departure', date: '22-Apr' },
        { lat: 1.6000, lng: 104.2000, name: 'Singapore Strait Exit', type: 'waypoint', date: '22-Apr' },
        { lat: 1.2983, lng: 103.3317, name: 'Malacca Strait Entry', type: 'waypoint', date: '23-Apr' },
        { lat: 1.5000, lng: 102.8000, name: 'Malacca Strait Mid', type: 'waypoint', date: '23-Apr' },
        { lat: 1.9000, lng: 102.4000, name: 'Approach Sungai Linggi', type: 'waypoint', date: '24-Apr' },
        { lat: 2.2633, lng: 101.9983, name: 'Sungai Linggi Anchorage', type: 'arrival', date: '24-Apr' }
    ];

    // --- Alternative Routes for Voyage Optimization ---
    const alternativeRoutes = [
        {
            id: 'original',
            name: 'Original Route (Direct)',
            distance: 234.03,
            eta: '18.7 hrs',
            fuelEstimate: 24.09,
            weatherRisk: 'Low',
            riskScore: 15,
            color: '#00d4ff',
            waypoints: [
                { lat: 2.0317, lng: 104.8283 },
                { lat: 1.6000, lng: 104.2000 },
                { lat: 1.2983, lng: 103.3317 },
                { lat: 1.5000, lng: 102.8000 },
                { lat: 1.9000, lng: 102.4000 },
                { lat: 2.2633, lng: 101.9983 }
            ]
        },
        {
            id: 'alt1',
            name: 'Northern Route (Coastal)',
            distance: 252.8,
            eta: '20.2 hrs',
            fuelEstimate: 26.1,
            weatherRisk: 'Low',
            riskScore: 20,
            color: '#f59e0b',
            waypoints: [
                { lat: 2.0317, lng: 104.8283 },
                { lat: 1.8000, lng: 104.3000 },
                { lat: 1.6500, lng: 103.6000 },
                { lat: 1.9500, lng: 103.0000 },
                { lat: 2.2000, lng: 102.4000 },
                { lat: 2.2633, lng: 101.9983 }
            ]
        },
        {
            id: 'alt2',
            name: 'Southern Route (Deep Water)',
            distance: 248.5,
            eta: '19.9 hrs',
            fuelEstimate: 25.6,
            weatherRisk: 'Very Low',
            riskScore: 10,
            color: '#10b981',
            waypoints: [
                { lat: 2.0317, lng: 104.8283 },
                { lat: 1.4000, lng: 104.1000 },
                { lat: 1.1000, lng: 103.2000 },
                { lat: 1.3000, lng: 102.5000 },
                { lat: 1.8000, lng: 102.1000 },
                { lat: 2.2633, lng: 101.9983 }
            ]
        }
    ];

    // --- Deviation Analysis ---
    const deviationAnalysis = [
        {
            type: 'operational',
            icon: 'fa-anchor',
            severity: 'info',
            title: 'Speed Below Warranted – Maneuvering Restrictions',
            detail: 'Speed below warranted due to maneuvering restrictions in Malacca Strait. Vessel operated at 11.3–11.7 kts during transit legs vs. warranted 12.5 kts. Speed deviation is attributed to navigational constraints, not engine deficiency.',
            impact: 'Negligible – Transit completed within acceptable parameters.'
        },
        {
            type: 'operational',
            icon: 'fa-clock',
            severity: 'warning',
            title: '7 Days Idle at Anchor – Awaiting Instructions',
            detail: '7 days idle at anchor at Sungai Linggi awaiting load instructions. This is NOT a vessel performance issue but an operational/commercial delay. Idle consumption averaged 3.75–3.89 MT LSFO/day.',
            impact: 'Significant – 26.89 MT LSFO consumed during idle period. Potential off-hire claim.'
        },
        {
            type: 'weather',
            icon: 'fa-cloud-sun',
            severity: 'success',
            title: 'No Heavy Weather Impact',
            detail: 'No heavy weather recorded throughout the voyage. Beaufort scale ranged 2–3. Wind speeds 1–6 kts. No adverse swell or wave conditions reported.',
            impact: 'None – Weather conditions were favorable throughout the voyage.'
        },
        {
            type: 'engine',
            icon: 'fa-gear',
            severity: 'info',
            title: 'ME Only Operated During Transit Legs',
            detail: 'Main Engine only operated during transit legs (22% of voyage time). ME consumed 12.477 MT LSFO. AE and Boiler consumed 34.51 MT LSFO during both transit and idle periods.',
            impact: 'Low – Engine performance within normal parameters when operating.'
        }
    ];

    // --- Alerts ---
    const alerts = [
        { id: 1, type: 'warning', icon: 'fa-triangle-exclamation', title: 'Extended Idle Time', message: '7 days idle at Sungai Linggi anchorage. Fuel burn: 26.89 MT LSFO.', time: '2h ago', date: '2026-04-30' },
        { id: 2, type: 'info', icon: 'fa-gauge-high', title: 'Speed Deviation Detected', message: 'Avg speed 10.35 kts vs CP warranted 12.5 kts (-17.2%).', time: '5h ago', date: '2026-04-30' },
        { id: 3, type: 'success', icon: 'fa-leaf', title: 'Fuel Savings Achieved', message: 'LSFO consumption 46.987 MT vs warranted 49.5 MT. Saved 2.513 MT.', time: '8h ago', date: '2026-04-30' },
        { id: 4, type: 'info', icon: 'fa-ship', title: 'Voyage Completed', message: 'VY-2026-0047 Singapore EOPL → Sungai Linggi completed.', time: '1d ago', date: '2026-04-30' },
        { id: 5, type: 'warning', icon: 'fa-file-invoice-dollar', title: 'Potential Off-Hire Event', message: 'Extended anchorage idle time may trigger off-hire clause review.', time: '1d ago', date: '2026-04-29' }
    ];

    // --- Commercial Claims Analysis ---
    const claimsAnalysis = {
        speed: {
            actual: 10.35,
            warranted: 12.5,
            deviation: -17.2,
            verdict: 'No Valid Claim',
            verdictClass: 'success',
            explanation: 'Vessel averaged 10.35 kts vs warranted 12.5 kts. However, speed deviation is due to maneuvering and idle time — NOT a valid speed claim. When steaming, vessel achieved 11.3–11.7 kts under maneuvering conditions.'
        },
        fuel: {
            actual: 46.987,
            warranted: 49.5,
            saved: 2.513,
            verdict: 'Favorable to Charterer',
            verdictClass: 'success',
            explanation: 'LSFO consumed 46.987 MT vs warranted 49.5 MT. Vessel SAVED 2.513 MT — favorable to charterer. No overconsumption claim applies.'
        },
        idleTime: {
            days: 7,
            location: 'Sungai Linggi Anchorage',
            fuelConsumed: 26.89,
            verdict: 'Review Required',
            verdictClass: 'warning',
            explanation: '7 days at anchor at Sungai Linggi. Potential off-hire claim if owner-attributable. Review charter party clause for idle time provisions and determine responsibility.'
        }
    };

    // --- Fuel Prices (estimated for cost calculations) ---
    const fuelPrices = {
        lsfo: 620,  // USD per MT
        mgo: 870    // USD per MT
    };

    // --- KPI Calculations ---
    const kpis = {
        activeVessels: 1,
        avgSpeedVsCP: ((10.35 / 12.5) * 100).toFixed(1),
        fuelEfficiencyScore: ((1 - (46.987 / 49.5)) * 100 + 80).toFixed(0),
        voyageStatus: 'Completed',
        daysAtSea: 9,
        fuelSaved: 2.513,
        fuelSavedCost: (2.513 * 620).toFixed(0),
        idleFuelCost: (26.89 * 620).toFixed(0),
        totalFuelCost: ((46.987 * 620) + (4.274 * 870)).toFixed(0)
    };

    // --- Wind Direction Labels ---
    const windDirLabels = {
        1: 'N', 2: 'NNE', 3: 'NE', 4: 'ENE', 5: 'E',
        6: 'ESE', 7: 'SE', 8: 'SSE', 9: 'S', 10: 'SSW',
        11: 'SW', 12: 'WSW', 13: 'W', 14: 'WNW', 15: 'NW', 16: 'NNW'
    };

    // --- Fleet Data (simulated additional vessels for dashboard) ---
    const fleetOverview = [
        { name: 'M/V XYZ', status: 'Idle', location: 'Sungai Linggi', speed: 0, fuelROB: 926.27, condition: 'Ballast', voyageProgress: 100 },
        { name: 'M/V ALPHA', status: 'Steaming', location: 'South China Sea', speed: 13.2, fuelROB: 1245.8, condition: 'Laden', voyageProgress: 62 },
        { name: 'M/V BETA', status: 'Loading', location: 'Fujairah', speed: 0, fuelROB: 890.5, condition: 'Ballast', voyageProgress: 0 },
        { name: 'M/V GAMMA', status: 'Steaming', location: 'Indian Ocean', speed: 12.8, fuelROB: 1102.3, condition: 'Laden', voyageProgress: 45 }
    ];

    // Public API
    return {
        vesselInfo,
        voyageInfo,
        noonReports,
        engineFuelData,
        warrantedTable,
        idleConsumption,
        bunkerSummary,
        lsfoBySystem,
        timeUtilization,
        voyageSummary,
        routeWaypoints,
        alternativeRoutes,
        deviationAnalysis,
        alerts,
        claimsAnalysis,
        fuelPrices,
        kpis,
        windDirLabels,
        fleetOverview
    };
})();
