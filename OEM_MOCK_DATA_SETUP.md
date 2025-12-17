# OEM Mock Data Integration Guide

## Overview
Mock data has been created for OEM admin/analyst users across all pages. When OEM users log in, they will see populated data without requiring backend API connections.

## Mock Data File Location
**File**: `frontend/src/lib/mockData.ts`

This file contains 6 exported functions that provide mock data for OEM users:

### 1. getMockVehicles(role)
Returns an array of 6 mock vehicles with the following data:
- **Vehicles**: Volkswagen ID.4, BMW i4, Lucid Air, Tesla Model S, Mercedes-Benz EQE, Audi e-tron GT
- **Data Fields**: VIN, make, model, year, registration date, last seen timestamp
- **Total Fleet**: 1,250 vehicles (shown in dashboard)

### 2. getMockAlerts(role)
Returns an array of 7 mock alerts with varying severity levels:
- **Severities**: HIGH (3 alerts), MEDIUM (3 alerts), LOW (1 alert)
- **Alert Types**: BATTERY_HEALTH_DEGRADATION, THERMAL_RUNAWAY_WARNING, MOTOR_EFFICIENCY_DROP, CYBER_ANOMALY_DETECTED, SOFTWARE_VERSION_MISMATCH, SUSPENSION_ANOMALY, BRAKE_WEAR_WARNING

### 3. getMockTelemetry(role)
Returns 30 data points of vehicle telemetry:
- **Metrics**: speed (km/h), RPM, engine temperature (°C), battery level (%), state of health (%)
- **Time Range**: Last 60 minutes (2-minute intervals)

### 4. getMockAnalytics(role)
Returns comprehensive analytics data:
- **Alert Trend**: 7-day trend with counts
- **Severity Distribution**: HIGH (45), MEDIUM (78), LOW (124)
- **Key Metrics**: Anomaly rate (2.5%), Alert rate (4.2%), Mean time to detect (215s), False positive rate (8%), RCA closure rate (87%)

### 5. getMockRCAs(role)
Returns 3 root cause analysis records with different statuses: COMPLETED, IN_PROGRESS, ESCALATED

### 6. getMockCAPAs(role)
Returns 3 corrective and preventive action records with priorities and statuses

## Integration Points
- Dashboard: OEM Command Center with fleet stats
- Vehicles: Fleet management with 6 mock vehicles
- Alerts: Fleet-wide alert management (7 alerts)
- Telemetry: Live vehicle telemetry visualization
- Analytics: Key metrics and trend charts
- RCA: Root cause analysis tracking
- CAPA: Corrective/preventive actions tracking

## How to Use
Import mock data functions and use when role is OEM_ADMIN or OEM_ANALYST

## Testing
1. Build: npm run build
2. Start: npm run dev  
3. Log in as OEM_ADMIN
4. Navigate through all pages
