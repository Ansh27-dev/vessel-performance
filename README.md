# VoyageIQ — Vessel Performance & Voyage Optimization

VoyageIQ is a maritime analytics web application built to monitor vessel performance from Excel-based reports and support voyage optimization through data-driven insights.

The platform helps shipping operators, chartering teams, technical teams, and vessel masters analyze speed, fuel consumption, ROB trends, weather influence, and route efficiency in a single dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [System Modules](#system-modules)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Analytics Logic](#key-analytics-logic)
- [Setup and Run](#setup-and-run)
- [Usage](#usage)
- [Future Scope](#future-scope)
- [Live Demo](#live-demo)
- [Repository](#repository)

---

## Overview

VoyageIQ is designed to solve two major maritime operations problems:

1. **Vessel Performance Monitoring**
   - Compare actual vessel performance against charter party warranted values.
   - Track daily speed, fuel consumption, ROB, and weather impact.

2. **Voyage Optimization**
   - Help plan more efficient voyages.
   - Assess route options, weather risk, and fuel efficiency.

The application uses an Excel upload workflow so vessel operational data can be imported and analyzed instantly.

---

## Problem Statement

Shipping companies need a practical tool that can:

- monitor actual vessel performance against warranted performance,
- identify underperformance and fuel inefficiencies,
- assess voyage delays and idle time,
- analyze weather influence on vessel behavior,
- and support route planning and optimization decisions.

VoyageIQ was built to address these needs with a clean, interactive, and hackathon-ready solution.

---

## Key Features

| Feature | Description |
|--------|-------------|
| Excel Upload | Upload report files in `.xlsx` / `.xls` format |
| Performance Analytics | Compare actual speed and fuel consumption with CP warranted values |
| Fuel Monitoring | Track ME, AE, and Boiler fuel usage |
| ROB Tracking | Analyze remaining on board fuel trends over time |
| Weather Analysis | Visualize weather conditions and their effect on voyage performance |
| Route Optimization | Compare voyage route options using data-driven route scoring |
| Commercial Insights | Highlight performance deviations and claim-relevant observations |
| Interactive Dashboard | View KPIs, charts, maps, and voyage summaries in one place |
| Report Generation | Present voyage-wise performance in a structured dashboard format |

---

## How It Works

### Workflow

| Step | Action |
|------|--------|
| 1 | User uploads a vessel Excel report |
| 2 | The system parses the Excel file |
| 3 | Important fields are extracted automatically |
| 4 | Internal voyage data is updated |
| 5 | Analytics calculations are performed |
| 6 | Charts, KPIs, and maps refresh on the dashboard |
| 7 | User reviews voyage performance and optimization insights |

### Input Source

VoyageIQ currently focuses on **Excel-based operational reports**, especially noon reports that contain vessel movement, speed, fuel, ROB, and weather-related data.

---

## System Modules

| Module | Purpose |
|--------|---------|
| `data.js` | Stores voyage, vessel, and report data |
| `excel-parser.js` | Reads and extracts data from Excel files |
| `analytics.js` | Computes performance, fuel, and weather insights |
| `voyage-optimizer.js` | Handles route comparison and voyage optimization logic |
| `charts.js` | Renders visual analytics charts |
| `maps.js` | Displays voyage maps and route visualizations |
| `app.js` | Controls page navigation and application flow |
| `styles.css` | Main UI styling |
| `charts.css` | Chart and map container styling |
| `index.html` | Main application entry point |

---

## Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | HTML, CSS, JavaScript |
| Charts | Chart.js |
| Maps | Leaflet.js |
| Excel Parsing | SheetJS (`xlsx`) |
| Deployment | Netlify |

---
