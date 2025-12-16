export enum UserRole {
  CUSTOMER = "CUSTOMER",
  SERVICE_CENTER = "SERVICE_CENTER",
  OEM_ADMIN = "OEM_ADMIN",
  OEM_ANALYST = "OEM_ANALYST",
}

export interface Vehicle {
  vin: string;
  owner_user_id: string;
  make: string;
  model: string;
  year: number;
  created_at: string;
  last_seen_at: string;
}

export interface Telemetry {
  vehicle_id: string;
  timestamp: string;
  speed_kmph: number;
  rpm: number;
  engine_temp_c: number;
  coolant_temp_c: number;
  brake_wear_percent: number;
  battery_voltage_v: number;
  fuel_level_percent: number;
  latitude: number;
  longitude: number;
  engine_status: string;
}

export interface Alert {
  vehicle_id: string;
  timestamp: string;
  alert_type: string;
  value: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  resolved: boolean;
  feedback?: string;
}

export interface Diagnosis {
  alert_id: string;
  probable_cause: string;
  recommendation: string;
  confidence: number;
  created_at: string;
}

export interface RCA {
  rca_id: string;
  alert_id: string;
  vehicle_id: string;
  root_cause: string;
  analysis_method: string;
  status: string;
  created_at: string;
}

export interface CAPA {
  capa_id: string;
  rca_id: string;
  action_type: string;
  description: string;
  owner_team: string;
  target_date: string;
  status: string;
  created_at: string;
}

export interface Booking {
  booking_id: string;
  vehicle_id: string;
  user_id: string;
  service_centre_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  created_at: string;
}

export interface JobCard {
  job_card_id: string;
  booking_id: string;
  notes: string;
  status: string;
  created_at: string;
}

export interface Invoice {
  invoice_id: string;
  job_card_id: string;
  parts: Array<{ name: string; cost: number }>;
  labour_cost: number;
  tax: number;
  total: number;
  created_at: string;
}

export interface Analytics {
  anomaly_score_stats: {
    count: number;
    mean_score: number;
    min_score: number;
    max_score: number;
    anomaly_rate: number;
  };
  alert_rate: number;
  mean_time_to_detect: number;
  anomaly_to_rca_rate: number;
  false_positive_rate: number;
  alert_trend: Array<{ _id: string; count: number }>;
  severity_distribution: Array<{ _id: string; count: number }>;
  rca_closure_rate: {
    total_rca: number;
    closed_rca: number;
    closure_rate: number;
  };
  overdue_capa: CAPA[];
}


