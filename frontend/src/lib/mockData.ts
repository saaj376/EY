import { UserRole } from "../types";

export const getMockVehicles = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return [
      {
        vin: "WVWZZ3CZ9KE123456",
        owner_user_id: "OEM_FLEET",
        make: "Volkswagen",
        model: "ID.4",
        year: 2024,
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        vin: "WBA1A1C56KV654321",
        owner_user_id: "OEM_FLEET",
        make: "BMW",
        model: "i4",
        year: 2024,
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        vin: "LUYXXXX9E3L012345",
        owner_user_id: "OEM_FLEET",
        make: "Lucid",
        model: "Air",
        year: 2023,
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      {
        vin: "TSLA1234567890ABC",
        owner_user_id: "OEM_FLEET",
        make: "Tesla",
        model: "Model S",
        year: 2024,
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        vin: "METEST1234567ABCD",
        owner_user_id: "OEM_FLEET",
        make: "Mercedes-Benz",
        model: "EQE",
        year: 2023,
        created_at: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        vin: "AUDABC12345678DEF",
        owner_user_id: "OEM_FLEET",
        make: "Audi",
        model: "e-tron GT",
        year: 2024,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_seen_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
  return [];
};

export const getMockAlerts = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return [
      {
        vehicle_id: "WVWZZ3CZ9KE123456",
        alert_type: "BATTERY_HEALTH_DEGRADATION",
        severity: "HIGH" as const,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Battery capacity dropped below 85%",
        value: 82.5,
      },
      {
        vehicle_id: "WBA1A1C56KV654321",
        alert_type: "THERMAL_RUNAWAY_WARNING",
        severity: "HIGH" as const,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Abnormal temperature rise detected in battery pack",
        value: 98.2,
      },
      {
        vehicle_id: "LUYXXXX9E3L012345",
        alert_type: "MOTOR_EFFICIENCY_DROP",
        severity: "MEDIUM" as const,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Motor efficiency declined from baseline",
        value: 87.3,
      },
      {
        vehicle_id: "TSLA1234567890ABC",
        alert_type: "CYBER_ANOMALY_DETECTED",
        severity: "HIGH" as const,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Unusual network behavior detected in vehicle ECU",
        value: 0.92,
      },
      {
        vehicle_id: "METEST1234567ABCD",
        alert_type: "SOFTWARE_VERSION_MISMATCH",
        severity: "MEDIUM" as const,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        resolved: true,
        message: "Software version mismatch between modules - Updated",
        value: 2.1,
      },
      {
        vehicle_id: "AUDABC12345678DEF",
        alert_type: "SUSPENSION_ANOMALY",
        severity: "MEDIUM" as const,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Suspension stiffness changed unexpectedly",
        value: 1.35,
      },
      {
        vehicle_id: "WVWZZ3CZ9KE123456",
        alert_type: "BRAKE_WEAR_WARNING",
        severity: "LOW" as const,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        message: "Brake pad wear level at 70%",
        value: 70,
      },
    ];
  }
  return [];
};

export const getMockTelemetry = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    const data = [];
    for (let i = 30; i > 0; i--) {
      data.push({
        vehicle_id: "WVWZZ3CZ9KE123456",
        timestamp: new Date(Date.now() - i * 2 * 60 * 1000).toISOString(),
        speed_kmph: 60 + Math.random() * 40,
        rpm: 3000 + Math.random() * 2000,
        engine_temp_c: 85 + Math.random() * 15,
        coolant_temp_c: 80 + Math.random() * 10,
        brake_wear_percent: 25 + Math.random() * 5,
        battery_voltage_v: 12.5 + Math.random() * 0.5,
        fuel_level_percent: 85 - (i * 0.5),
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        engine_status: "RUNNING",
      });
    }
    return data;
  }
  return [];
};

export const getMockAnalytics = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return {
      alert_trend: [
        { _id: "2024-12-10", count: 12 },
        { _id: "2024-12-11", count: 15 },
        { _id: "2024-12-12", count: 18 },
        { _id: "2024-12-13", count: 22 },
        { _id: "2024-12-14", count: 28 },
        { _id: "2024-12-15", count: 25 },
        { _id: "2024-12-16", count: 32 },
      ],
      severity_distribution: [
        { _id: "HIGH", count: 45 },
        { _id: "MEDIUM", count: 78 },
        { _id: "LOW", count: 124 },
      ],
      rca_closure_rate: {
        total_rca: 23,
        closed_rca: 20,
        closure_rate: 0.87
      },
      overdue_capa: [],
      anomaly_score_stats: {
        count: 1250,
        mean_score: 0.18,
        min_score: 0.05,
        max_score: 0.95,
        anomaly_rate: 0.025,
      },
      alert_rate: 0.042,
      mean_time_to_detect: 215000,
      anomaly_to_rca_rate: 0.34,
      false_positive_rate: 0.08,
    };
  }
  return null;
};

export const getMockRCAs = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return [
      {
        rca_id: "RCA001",
        alert_id: "ALT001",
        vehicle_id: "WVWZZ3CZ9KE123456",
        root_cause: "Battery cell degradation from thermal stress",
        analysis_method: "5_WHYS",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
      },
      {
        rca_id: "RCA002",
        alert_id: "ALT002",
        vehicle_id: "WBA1A1C56KV654321",
        root_cause: "Software bug in thermal monitoring",
        analysis_method: "FISHBONE",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
      },
      {
        rca_id: "RCA003",
        alert_id: "ALT003",
        vehicle_id: "TSLA1234567890ABC",
        root_cause: "Suspected cyber intrusion attempt",
        analysis_method: "FMEA",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "ESCALATED",
      },
    ];
  }
  return [];
};

export const getMockCAPAs = (role: UserRole) => {
  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return [
      {
        capa_id: "CAPA001",
        rca_id: "RCA001",
        action_type: "CORRECTIVE",
        description: "Redesign thermal management coolant pathway to reduce restriction",
        owner_team: "Engineering",
        target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        capa_id: "CAPA002",
        rca_id: "RCA002",
        action_type: "PREVENTIVE",
        description: "Update firmware to version 2.2.0 with corrected sensor calibration",
        owner_team: "Software",
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        capa_id: "CAPA003",
        rca_id: "RCA003",
        action_type: "CORRECTIVE",
        description: "Implement enhanced CAN bus authentication and encryption",
        owner_team: "Cybersecurity",
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
        created_at: new Date().toISOString(),
      },
    ];
  }
  return [];
};
