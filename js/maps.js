// ============================================================
// MAPS MODULE - Leaflet map configurations
// Shows voyage route Singapore EOPL → Sungai Linggi
// ============================================================

const Maps = (() => {
    const mapInstances = {};

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

    const colors = {
        primary: '#00d4ff',
        accent: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        secondary: '#7c3aed'
    };

    function destroyMap(containerId) {
        if (mapInstances[containerId]) {
            mapInstances[containerId].remove();
            delete mapInstances[containerId];
        }
    }

    // --- Custom Icons ---
    function createIcon(color, iconClass, size = 28) {
        return L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="
                width:${size}px; height:${size}px; border-radius:50%;
                background: ${color}; border: 3px solid rgba(255,255,255,0.9);
                display:flex; align-items:center; justify-content:center;
                box-shadow: 0 0 15px ${color}88, 0 2px 8px rgba(0,0,0,0.4);
                font-size:${size * 0.42}px; color:#fff;
            "><i class="fas ${iconClass}"></i></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2 - 5]
        });
    }

    // --- Weather Map (Page 4) ---
    function createWeatherMap(containerId) {
        destroyMap(containerId);
        const container = document.getElementById(containerId);
        if (!container) return;

        const map = L.map(containerId, {
            center: [1.8, 103.2],
            zoom: 7,
            zoomControl: true,
            scrollWheelZoom: true
        });

        L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 18 }).addTo(map);

        // Route polyline
        const waypoints = VesselData.routeWaypoints.map(w => [w.lat, w.lng]);
        const routeLine = L.polyline(waypoints, {
            color: colors.primary,
            weight: 3,
            opacity: 0.9,
            dashArray: null
        }).addTo(map);

        // Animated route glow
        L.polyline(waypoints, {
            color: colors.primary,
            weight: 8,
            opacity: 0.15
        }).addTo(map);

        // Waypoint markers
        VesselData.routeWaypoints.forEach(wp => {
            let icon, popupColor;
            if (wp.type === 'departure') {
                icon = createIcon(colors.accent, 'fa-play', 32);
                popupColor = colors.accent;
            } else if (wp.type === 'arrival') {
                icon = createIcon(colors.danger, 'fa-anchor', 32);
                popupColor = colors.danger;
            } else {
                icon = createIcon(colors.primary, 'fa-location-dot', 22);
                popupColor = colors.primary;
            }

            L.marker([wp.lat, wp.lng], { icon })
                .bindPopup(`
                    <div style="font-family:'Inter',sans-serif; min-width:180px;">
                        <div style="font-weight:600; color:${popupColor}; margin-bottom:4px; font-size:13px;">${wp.name}</div>
                        <div style="font-size:11px; color:#94a3b8;">
                            <div>Date: ${wp.date}</div>
                            <div>Lat: ${wp.lat.toFixed(4)}°N</div>
                            <div>Lng: ${wp.lng.toFixed(4)}°E</div>
                            <div>Type: ${wp.type.charAt(0).toUpperCase() + wp.type.slice(1)}</div>
                        </div>
                    </div>
                `, { className: 'dark-popup' })
                .addTo(map);
        });

        // Weather risk zones
        const zones = VoyageOptimizer.getWeatherRiskZones();
        zones.forEach(zone => {
            L.rectangle(zone.bounds, {
                color: zone.borderColor,
                weight: 1,
                fillColor: zone.color,
                fillOpacity: 0.3,
                dashArray: '5, 5'
            }).bindPopup(`
                <div style="font-family:'Inter',sans-serif;">
                    <div style="font-weight:600; color:${zone.borderColor}; margin-bottom:4px;">${zone.name}</div>
                    <div style="font-size:11px; color:#94a3b8;">
                        Risk: ${zone.risk} (Score: ${zone.riskScore})<br/>
                        ${zone.description}
                    </div>
                </div>
            `, { className: 'dark-popup' }).addTo(map);
        });

        // BF scale legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <div style="background:rgba(10,14,39,0.9); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); font-family:'Inter',sans-serif; font-size:11px;">
                    <div style="font-weight:600; color:#e2e8f0; margin-bottom:6px;">Beaufort Scale</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;"><span style="width:10px;height:10px;border-radius:2px;background:${colors.accent};display:inline-block;"></span><span style="color:#94a3b8;">BF 0-2 (Calm)</span></div>
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;"><span style="width:10px;height:10px;border-radius:2px;background:${colors.warning};display:inline-block;"></span><span style="color:#94a3b8;">BF 3-4 (Light)</span></div>
                    <div style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:${colors.danger};display:inline-block;"></span><span style="color:#94a3b8;">BF 5+ (Moderate+)</span></div>
                </div>
            `;
            return div;
        };
        legend.addTo(map);

        mapInstances[containerId] = map;
        setTimeout(() => map.invalidateSize(), 300);
        return map;
    }

    // --- Voyage Optimization Map (Page 5) ---
    function createOptimizationMap(containerId) {
        destroyMap(containerId);
        const container = document.getElementById(containerId);
        if (!container) return;

        const map = L.map(containerId, {
            center: [1.8, 103.2],
            zoom: 7,
            zoomControl: true,
            scrollWheelZoom: true
        });

        L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 18 }).addTo(map);

        // Draw all routes
        const routes = VesselData.alternativeRoutes;
        routes.forEach((route, idx) => {
            const coords = route.waypoints.map(w => [w.lat, w.lng]);
            const isOriginal = route.id === 'original';

            // Glow
            L.polyline(coords, {
                color: route.color,
                weight: isOriginal ? 10 : 6,
                opacity: 0.12
            }).addTo(map);

            // Main line
            L.polyline(coords, {
                color: route.color,
                weight: isOriginal ? 4 : 2.5,
                opacity: isOriginal ? 0.95 : 0.7,
                dashArray: isOriginal ? null : '8, 6'
            }).addTo(map);

            // Route label
            const midIdx = Math.floor(coords.length / 2);
            L.marker(coords[midIdx], {
                icon: L.divIcon({
                    className: 'route-label',
                    html: `<div style="
                        background: rgba(10,14,39,0.9); border: 1px solid ${route.color};
                        padding: 3px 8px; border-radius: 4px; font-family:'Inter',sans-serif;
                        font-size:10px; color:${route.color}; white-space:nowrap;
                        box-shadow: 0 0 8px ${route.color}44;
                    ">${route.name.split(' ')[0]} ${route.name.split(' ')[1] || ''} (${route.distance} nm)</div>`,
                    iconAnchor: [60, -10]
                })
            }).addTo(map);
        });

        // Departure and arrival markers
        const dep = VesselData.routeWaypoints[0];
        const arr = VesselData.routeWaypoints[VesselData.routeWaypoints.length - 1];

        L.marker([dep.lat, dep.lng], { icon: createIcon(colors.accent, 'fa-play', 34) })
            .bindPopup(`<div style="font-family:'Inter',sans-serif;"><strong style="color:${colors.accent};">Departure</strong><br/><span style="color:#94a3b8;">${dep.name}<br/>22 Apr 2026</span></div>`, { className: 'dark-popup' })
            .addTo(map);

        L.marker([arr.lat, arr.lng], { icon: createIcon(colors.danger, 'fa-anchor', 34) })
            .bindPopup(`<div style="font-family:'Inter',sans-serif;"><strong style="color:${colors.danger};">Arrival</strong><br/><span style="color:#94a3b8;">${arr.name}<br/>24 Apr 2026</span></div>`, { className: 'dark-popup' })
            .addTo(map);

        // Weather risk zones
        const zones = VoyageOptimizer.getWeatherRiskZones();
        zones.forEach(zone => {
            L.rectangle(zone.bounds, {
                color: zone.borderColor,
                weight: 1,
                fillColor: zone.color,
                fillOpacity: 0.2,
                dashArray: '5, 5'
            }).addTo(map);
        });

        // Route legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <div style="background:rgba(10,14,39,0.9); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); font-family:'Inter',sans-serif; font-size:11px;">
                    <div style="font-weight:600; color:#e2e8f0; margin-bottom:6px;">Routes</div>
                    ${routes.map(r => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                        <span style="width:20px;height:3px;background:${r.color};display:inline-block;${r.id !== 'original' ? 'border-top:2px dashed ' + r.color : ''}"></span>
                        <span style="color:#94a3b8;">${r.name}</span>
                    </div>`).join('')}
                </div>
            `;
            return div;
        };
        legend.addTo(map);

        mapInstances[containerId] = map;
        setTimeout(() => map.invalidateSize(), 300);
        return map;
    }

    // --- Voyage Planner Map (Page 8) ---
    function createPlannerMap(containerId) {
        destroyMap(containerId);
        const container = document.getElementById(containerId);
        if (!container) return;

        const map = L.map(containerId, {
            center: [3, 105],
            zoom: 6,
            zoomControl: true,
            scrollWheelZoom: true
        });

        L.tileLayer(tileUrl, { attribution: tileAttribution, maxZoom: 18 }).addTo(map);

        // Common ports
        const ports = [
            { lat: 1.29, lng: 103.85, name: 'Singapore' },
            { lat: 2.26, lng: 102.00, name: 'Sungai Linggi' },
            { lat: 1.43, lng: 104.15, name: 'Pasir Gudang' },
            { lat: 3.97, lng: 103.43, name: 'Kuantan' },
            { lat: 5.28, lng: 103.13, name: 'Kemaman' },
            { lat: 1.79, lng: 102.47, name: 'Tanjung Bruas' }
        ];

        ports.forEach(p => {
            L.marker([p.lat, p.lng], {
                icon: createIcon('#94a3b8', 'fa-anchor', 20)
            }).bindPopup(`<div style="font-family:'Inter',sans-serif;"><strong style="color:#e2e8f0;">${p.name}</strong><br/><span style="color:#94a3b8;">${p.lat.toFixed(2)}°N, ${p.lng.toFixed(2)}°E</span></div>`, { className: 'dark-popup' })
                .addTo(map);
        });

        mapInstances[containerId] = map;
        setTimeout(() => map.invalidateSize(), 300);
        return map;
    }

    // Invalidate all maps
    function invalidateAll() {
        Object.values(mapInstances).forEach(m => m.invalidateSize());
    }

    return {
        createWeatherMap,
        createOptimizationMap,
        createPlannerMap,
        invalidateAll,
        destroyMap
    };
})();
