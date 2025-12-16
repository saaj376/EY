import axios from 'axios';
import type {
  Vehicle,
  Telemetry,
  Alert,
  Diagnosis,
  Booking,
  JobCard,
  Invoice,
  CAPA,
  Analytics,
  UserRole,
  DashboardStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add role header to requests
export const setAuthRole = (role: UserRole) => {
  api.defaults.headers.common['X-Role'] = role;
};

// Telemetry
export const telemetryApi = {
  ingest: (data: Telemetry, role: UserRole) =>
    api.post('/telemetry', data, { headers: { 'X-Role': role } }),

  getLive: (vehicleId: string, role: UserRole) =>
    api.get(`/telemetry/live/${vehicleId}`, { headers: { 'X-Role': role } }),

  getHistory: (vehicleId: string, limit = 50, role: UserRole) =>
    api.get(`/telemetry/history/${vehicleId}`, {
      params: { limit },
      headers: { 'X-Role': role }
    }),
};

// User Views
export const userApi = {
  getVehicles: (userId: string, role: UserRole) =>
    api.get<Vehicle[]>(`/user/vehicles?user_id=${userId}`, { headers: { 'X-Role': role } }),

  getAlerts: (userId: string, role: UserRole) =>
    api.get<Alert[]>(`/user/alerts?user_id=${userId}`, { headers: { 'X-Role': role } }),

  getDiagnosis: (userId: string, role: UserRole) =>
    api.get<Diagnosis[]>(`/user/diagnosis?user_id=${userId}`, { headers: { 'X-Role': role } }),

  getBookings: (userId: string, role: UserRole) =>
    api.get<Booking[]>(`/user/bookings?user_id=${userId}`, { headers: { 'X-Role': role } }),

  getJobs: (userId: string, role: UserRole) =>
    api.get<JobCard[]>(`/user/jobs?user_id=${userId}`, { headers: { 'X-Role': role } }),

  getInvoices: (userId: string, role: UserRole) =>
    api.get<Invoice[]>(`/user/invoices?user_id=${userId}`, { headers: { 'X-Role': role } }),
};

// Service Views
export const serviceApi = {
  getDashboardStats: (serviceCentreId: string, role: UserRole) =>
    api.get<DashboardStats>(`/service/dashboard/stats?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  getServiceCentres: (role: UserRole) =>
    api.get('/service/centres', { headers: { 'X-Role': role } }),

  getBookings: (serviceCentreId: string, role: UserRole) =>
    api.get<Booking[]>(`/service/bookings?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  getJobs: (serviceCentreId: string, role: UserRole) =>
    api.get<JobCard[]>(`/service/jobs?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  getJobDetails: (jobId: string, role: UserRole) =>
    api.get<JobCard>(`/service/job/${jobId}/details`, { headers: { 'X-Role': role } }),

  getInvoices: (serviceCentreId: string, role: UserRole) =>
    api.get<Invoice[]>(`/service/invoices?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  getInvoice: (invoiceId: string, role: UserRole) =>
    api.get<Invoice>(`/service/invoice/${invoiceId}`, { headers: { 'X-Role': role } }),

  getAlerts: (serviceCentreId: string, role: UserRole) =>
    api.get<Alert[]>(`/service/alerts?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  getCAPA: (role: UserRole) =>
    api.get<CAPA[]>(`/service/capa`, { headers: { 'X-Role': role } }),

  getBookingTimeline: (bookingId: string, role: UserRole) =>
    api.get(`/service/booking/timeline?booking_id=${bookingId}`, { headers: { 'X-Role': role } }),

  getNotifications: (serviceCentreId: string, role: UserRole) =>
    api.get(`/service/notifications?service_centre_id=${serviceCentreId}`, { headers: { 'X-Role': role } }),

  checkAvailability: (serviceCentreId: string, start: string, end: string, role: UserRole) =>
    api.get(`/service/availability`, {
      params: { service_centre_id: serviceCentreId, slot_start: start, slot_end: end },
      headers: { 'X-Role': role }
    }),

  getServiceCentreSlots: (serviceCentreId: string, date: string, role: UserRole) =>
    api.get(`/service/centres/slots`, {
      params: { service_centre_id: serviceCentreId, date },
      headers: { 'X-Role': role }
    }),
};

// RCA (unchanged)
export const rcaApi = {
  create: (payload: {
    alert_id: string;
    vehicle_id: string;
    root_cause: string;
    analysis_method?: string;
    role: UserRole;
  }) => api.post('/rca', payload),
};

// CAPA (unchanged)
export const capaApi = {
  create: (payload: {
    rca_id: string;
    action_type: string;
    description: string;
    owner_team: string;
    target_date: string;
    role: UserRole;
  }) => api.post('/capa', payload),
};

// Service Workflow
export const serviceWorkflowApi = {
  createBooking: (payload: {
    vehicle_id: string;
    user_id: string;
    service_centre_id: string;
    slot_start: string;
    slot_end: string;
    role: UserRole;
  }) => api.post('/service/booking', payload),

  cancelBooking: (payload: {
    booking_id: string;
    reason?: string;
    role: UserRole;
  }) => api.post('/service/booking/cancel', payload),

  createJob: (payload: {
    booking_id: string;
    notes?: string;
    assigned_technician?: string;
    role: UserRole;
  }) => api.post('/service/job/create', payload),

  updateJobStatus: (jobId: string, payload: { status: string; notes?: string; technician?: string; role: UserRole }) =>
    api.put(`/service/job/${jobId}/status`, payload),

  addPartsToJob: (jobId: string, payload: { parts: any[]; added_by?: string; role: UserRole }) =>
    api.post(`/service/job/${jobId}/parts`, payload),

  updateLabourHours: (jobId: string, payload: { hours: number; technician?: string; role: UserRole }) =>
    api.put(`/service/job/${jobId}/labour`, payload),

  createInvoice: (payload: {
    job_card_id: string;
    parts?: Array<{ name: string; quantity: number; cost: number }>;
    labour_cost?: number;
    tax?: number;
    labour_rate_per_hour?: number;
    role: UserRole;
  }) => api.post('/service/invoice/create', payload),

  updatePayment: (invoiceId: string, payload: { payment_status: string; payment_method?: string; transaction_id?: string; role: UserRole }) =>
    api.put(`/service/invoice/${invoiceId}/payment`, payload),
};


// Analytics
export const analyticsApi = {
  getAnalytics: (role: UserRole) =>
    api.get<Analytics>('/analytics', { headers: { 'X-Role': role } }),
};

// Notifications
export const notificationsApi = {
  getUserNotifications: (userId: string, role: UserRole, filters?: { category?: string, status?: string, channel?: string }) =>
    api.get('/notifications/user', {
      params: { user_id: userId, ...filters },
      headers: { 'X-Role': role }
    }),

  getServiceCentreNotifications: (serviceCentreId: string, role: UserRole, status?: string) =>
    api.get('/notifications/service-centre', {
      params: { service_centre_id: serviceCentreId, status },
      headers: { 'X-Role': role }
    }),

  getSecurityNotifications: (role: UserRole) =>
    api.get('/notifications/oem/security', { headers: { 'X-Role': role } }),

  getAllOEMNotifications: (role: UserRole) =>
    api.get('/notifications/oem/all', { headers: { 'X-Role': role } }),

  getSMSLogs: (role: UserRole) =>
    api.get('/notifications/oem/sms', { headers: { 'X-Role': role } }),
};

export default api;

