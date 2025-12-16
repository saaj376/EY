// Role Definitions
export enum UserRole {
  CUSTOMER = "CUSTOMER",
  SERVICE_CENTER = "SERVICE_CENTER",
  OEM_ADMIN = "OEM_ADMIN",
  OEM_ANALYST = "OEM_ANALYST",
}

// Basic Entities
export interface Vehicle {
  vin: string;
  owner_user_id: string;
  make: string;
  model: string;
  year: number;
  created_at: string;
  last_seen_at: string;
}

export interface WorkerLog {
  _id?: string;
  job_card_id: string;
  worker_name: string;
  action: string;
  notes: string;
  timestamp: string;
  metadata?: any;
}

// Telemetry & Alerts
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
  type?: string; // Frontend alias
  message?: string; // Description
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

// Process Management
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

// Service Workflow
export interface Booking {
  booking_id: string;
  vehicle_id: string;
  user_id: string;
  service_centre_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  created_at: string;

  // Enhanced Fields
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  status_timeline?: Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>;
}

export interface JobCard {
  job_card_id: string;
  booking_id: string;
  vehicle_id?: string;
  service_centre_id?: string;

  // Status & Assignment
  status: string;
  assigned_technician?: string;
  technician_notes?: string;

  // Work Details
  parts_used?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  labour_hours?: number;

  // Timeline/Logs
  created_at: string;
  updated_at?: string;
  work_timeline?: Array<{
    status: string;
    timestamp: string;
    technician?: string;
    notes: string;
  }>;
  worker_logs?: WorkerLog[];

  // Legacy
  notes: string;
}

export interface Invoice {
  invoice_id: string;
  invoice_number?: string;

  // Relations
  job_card_id: string;
  booking_id?: string;
  vehicle_id?: string;
  service_centre_id?: string;
  customer_id?: string;

  // Customer Details (Snapshot)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  // Line Items
  parts: Array<{
    name: string;
    quantity?: number;
    cost: number
  }>;
  parts_total?: number;

  // Labour
  labour_hours?: number;
  labour_rate_per_hour?: number;
  labour_cost: number;

  // Totals
  subtotal?: number;
  tax_percentage?: number;
  tax_amount?: number;
  tax: number; // Legacy or alternative name

  total_amount?: number; // New preferred field
  total: number; // Legacy field

  // Status & Payment
  status?: string;
  payment_status?: string;
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  transaction_id?: string;

  created_at: string;
}

// Dashboard & Analytics
export interface DashboardStats {
  todays_bookings: number;
  active_jobs: number;
  pending_invoices: number;
  monthly_revenue: number;
  service_centre_id: string;
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


