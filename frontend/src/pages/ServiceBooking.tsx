import { useEffect, useState } from 'react';
import { Calendar, Wrench, Edit2, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi, serviceWorkflowApi, telemetryApi } from '../services/api';
import type { Booking, JobCard, Invoice, DashboardStats, Telemetry, Alert } from '../types';
import { format } from 'date-fns';

interface ServiceBookingProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const ServiceBooking = ({ role, userId, serviceCentreId }: ServiceBookingProps) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'jobs' | 'invoices' | 'alerts'>('dashboard');

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Slot Booking State
  const [newBooking, setNewBooking] = useState({
    vehicle_id: '',
    service_centre_id: serviceCentreId || '', // Default to props or empty
    slot_start: '',
    slot_end: '',
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Service Centre Selection State
  const [serviceCentres, setServiceCentres] = useState<any[]>([]);
  const [loadingCentres, setLoadingCentres] = useState(false);

  // Job Management State
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [jobUpdate, setJobUpdate] = useState({
    status: '',
    technician: '',
    notes: '',
  });

  // Telemetry Modal State
  const [viewingVehicle, setViewingVehicle] = useState<{ vehicleId: string, risk?: string } | null>(null);
  const [vehicleTelemetry, setVehicleTelemetry] = useState<Telemetry | null>(null);
  const [_vehicleAlerts, _setVehicleAlerts] = useState<Alert[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Calculate stats for customer view since they don't get the backend stats endpoint
  const customerStats = role === UserRole.CUSTOMER ? {
    active_bookings: bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length,
    active_jobs: jobs.filter(j => j.status !== 'COMPLETED').length,
    unpaid_invoices: invoices.filter(i => i.payment_status === 'UNPAID').length,
    total_spent: invoices.filter(i => i.payment_status === 'PAID').reduce((sum, i) => sum + (i.total_amount || 0), 0)
  } : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (role === UserRole.CUSTOMER) {
          const [bookingsRes, jobsRes, invoicesRes] = await Promise.all([
            userApi.getBookings(userId, role),
            userApi.getJobs(userId, role),
            userApi.getInvoices(userId, role),
          ]);
          setBookings(bookingsRes.data);
          setJobs(jobsRes.data);
          setInvoices(invoicesRes.data);
        } else if (role === UserRole.SERVICE_CENTER) {
          const [statsRes, bookingsRes, jobsRes, invoicesRes, alertsRes] = await Promise.all([
            serviceApi.getDashboardStats(serviceCentreId, role),
            serviceApi.getBookings(serviceCentreId, role),
            serviceApi.getJobs(serviceCentreId, role),
            serviceApi.getInvoices(serviceCentreId, role),
            serviceApi.getAlerts(serviceCentreId, role),
          ]);
          setDashboardStats(statsRes.data);
          setBookings(bookingsRes.data);
          setJobs(jobsRes.data);
          setInvoices(invoicesRes.data);
          setAlerts(alertsRes.data);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, userId, serviceCentreId]);

  // Fetch Service Centres when opening modal (for Customer)
  useEffect(() => {
    if (showBookingForm && role === UserRole.CUSTOMER) {
      const fetchCentres = async () => {
        setLoadingCentres(true);
        try {
          const res = await serviceApi.getServiceCentres(role);
          setServiceCentres(res.data);
        } catch (error) {
          console.error('Error fetching service centres:', error);
        } finally {
          setLoadingCentres(false);
        }
      };
      fetchCentres();
    }
  }, [showBookingForm, role]);

  // Fetch slots when date changes (and centre is selected)
  useEffect(() => {
    // Determine which ID to use: selected in form (Customer) or props (Service Center)
    const targetCentreId = role === UserRole.CUSTOMER ? newBooking.service_centre_id : serviceCentreId;

    if (showBookingForm && selectedDate && targetCentreId) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const response = await serviceApi.getServiceCentreSlots(targetCentreId, selectedDate, role);
          const slots = Array.isArray(response.data) ? response.data : (response.data && response.data.slots ? response.data.slots : []);
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error fetching slots:', error);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [showBookingForm, selectedDate, newBooking.service_centre_id, serviceCentreId, role]);

  // Fetch Telemetry when viewing vehicle
  useEffect(() => {
    if (viewingVehicle) {
      const fetchTelemetry = async () => {
        setLoadingTelemetry(true);
        try {
          // In a real app, we might check live or history. Fetching live for now.
          const telemRes = await telemetryApi.getLive(viewingVehicle.vehicleId, role);
          setVehicleTelemetry(telemRes.data);

          // Also fetch alerts for this vehicle context if possible, 
          // reusing serviceApi.getAlerts but that takes centre_id. 
          // For now, let's assume we show what's available or leave alerts empty if no endpoint.
          // Or we use userApi.getAlerts if we had the user ID, but we might not for generic vehicle.
          // Let's rely on telemetry data first.
        } catch (error) {
          console.error('Error fetching vehicle telemetry:', error);
        } finally {
          setLoadingTelemetry(false);
        }
      };
      fetchTelemetry();
    }
  }, [viewingVehicle, role]);


  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.slot_start) {
      alert('Please select a time slot.');
      return;
    }
    const targetCentreId = role === UserRole.CUSTOMER ? newBooking.service_centre_id : serviceCentreId;
    if (!targetCentreId) {
      alert('Please select a service centre.');
      return;
    }

    try {
      await serviceWorkflowApi.createBooking({
        ...newBooking,
        service_centre_id: targetCentreId,
        user_id: userId,
        role,
      });
      setShowBookingForm(false);
      setNewBooking({
        vehicle_id: '',
        service_centre_id: role === UserRole.SERVICE_CENTER ? serviceCentreId : '', // Reset correctly
        slot_start: '',
        slot_end: '',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.detail?.error || 'Failed to create booking');
    }
  };

  const handleOpenJobParams = (job: JobCard) => {
    setEditingJob(job);
    setJobUpdate({
      status: job.status || 'OPEN',
      technician: job.assigned_technician || '',
      notes: job.technician_notes || '',
    });
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      await serviceWorkflowApi.updateJobStatus(editingJob.job_card_id, {
        status: jobUpdate.status,
        notes: jobUpdate.notes,
        technician: jobUpdate.technician,
        role,
      });
      alert('Job updated successfully');
      setEditingJob(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!editingJob) return;
    if (!confirm('Generate invoice for this completed job?')) return;

    try {
      await serviceWorkflowApi.createInvoice({
        job_card_id: editingJob.job_card_id,
        labour_cost: 150, // Mock labour cost
        parts: [], // Mock parts
        role
      });
      alert('Invoice generated successfully');
      setEditingJob(null);
      window.location.reload();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
      case 'COMPLETED':
      case 'WORK_COMPLETED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-300 border-red-500/20';
      case 'PENDING':
      case 'UNPAID':
      case 'OPEN':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading service data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-50">Service Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            {role === UserRole.SERVICE_CENTER ? 'Service Centre Portal' : 'My Service History'}
          </p>
        </div>

        {role === UserRole.CUSTOMER && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            + New Booking
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {role === UserRole.SERVICE_CENTER && dashboardStats ? (
          <>
            <div className="card p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-400">Bookings Today</div>
              <div className="text-2xl font-bold text-gray-100">{dashboardStats.todays_bookings}</div>
            </div>
            <div className="card p-4 border-l-4 border-amber-500">
              <div className="text-sm text-gray-400">Active Jobs</div>
              <div className="text-2xl font-bold text-gray-100">{dashboardStats.active_jobs}</div>
            </div>
            <div className="card p-4 border-l-4 border-red-500">
              <div className="text-sm text-gray-400">Pending Invoices</div>
              <div className="text-2xl font-bold text-gray-100">{dashboardStats.pending_invoices}</div>
            </div>
            <div className="card p-4 border-l-4 border-emerald-500">
              <div className="text-sm text-gray-400">Revenue (MTD)</div>
              <div className="text-2xl font-bold text-gray-100">${dashboardStats.monthly_revenue.toLocaleString()}</div>
            </div>
          </>
        ) : customerStats ? (
          <>
            <div className="card p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-400">Active Bookings</div>
              <div className="text-2xl font-bold text-gray-100">{customerStats.active_bookings}</div>
            </div>
            <div className="card p-4 border-l-4 border-amber-500">
              <div className="text-sm text-gray-400">Active Jobs</div>
              <div className="text-2xl font-bold text-gray-100">{customerStats.active_jobs}</div>
            </div>
            <div className="card p-4 border-l-4 border-red-500">
              <div className="text-sm text-gray-400">Due Invoices</div>
              <div className="text-2xl font-bold text-gray-100">{customerStats.unpaid_invoices}</div>
            </div>
            <div className="card p-4 border-l-4 border-emerald-500">
              <div className="text-sm text-gray-400">Total Spent</div>
              <div className="text-2xl font-bold text-gray-100">${customerStats.total_spent.toLocaleString()}</div>
            </div>
          </>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 flex space-x-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
        >
          Job Cards
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'invoices' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
        >
          Invoices
        </button>
        {role === UserRole.SERVICE_CENTER && (
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Alerts
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Booking Form Overlay (Slot Based) */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-semibold text-gray-50 mb-4">Create New Booking</h2>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle ID</label>
                  <input
                    type="text"
                    value={newBooking.vehicle_id}
                    onChange={(e) => setNewBooking({ ...newBooking, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter Vehicle VIN/ID"
                    required
                  />
                </div>

                {/* Service Centre Selection (Customer only) */}
                {role === UserRole.CUSTOMER && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Service Centre</label>
                    {loadingCentres ? (
                      <div className="text-sm text-gray-500">Loading service centres...</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {serviceCentres.map((centre: any) => (
                          <button
                            key={centre._id}
                            type="button"
                            onClick={() => setNewBooking({ ...newBooking, service_centre_id: centre._id })}
                            className={`p-3 rounded-lg border text-left transition-colors flex justify-between items-center ${newBooking.service_centre_id === centre._id
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                              }`}
                          >
                            <div>
                              <div className="font-medium">{centre.name}</div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" /> {centre.location}
                              </div>
                            </div>
                            {newBooking.service_centre_id === centre._id && (
                              <div className="text-blue-500 text-xs font-bold">SELECTED</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    disabled={role === UserRole.CUSTOMER && !newBooking.service_centre_id}
                  />
                </div>

                {/* Slots Grid */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Available Time Slots</label>
                    {loadingSlots ? (
                      <div className="text-center py-4 text-gray-500">Loading slots...</div>
                    ) : ((availableSlots?.length ?? 0) === 0) ? (
                      <div className="text-center py-4 text-gray-500">No slots available for this date.</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(availableSlots || []).map((slot, idx) => {
                          const isSelected = newBooking.slot_start === slot.start;
                          const isAvailable = slot.is_available;

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setNewBooking({
                                ...newBooking,
                                slot_start: slot.start,
                                slot_end: slot.end
                              })}
                              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${isSelected
                                ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/50'
                                : !isAvailable
                                  ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed opacity-60'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                }`}
                            >
                              {format(new Date(slot.start), 'HH:mm')} - {format(new Date(slot.end), 'HH:mm')}
                              <div className="text-xs mt-1 font-normal opacity-70">
                                {isAvailable ? `${slot.available_slots} slots left` : 'Full'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Slot Confirmation */}
                {newBooking.slot_start && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
                    Selected: {format(new Date(newBooking.slot_start), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    disabled={!newBooking.slot_start}
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Job Modal */}
        {editingJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-xl font-semibold text-gray-50 mb-4">Manage Job Card</h2>
              <form onSubmit={handleUpdateJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={jobUpdate.status}
                    onChange={(e) => setJobUpdate({ ...jobUpdate, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WORK_COMPLETED">Work Completed</option>
                    <option value="COMPLETED">Closed / Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={jobUpdate.technician}
                    onChange={(e) => setJobUpdate({ ...jobUpdate, technician: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter technician name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Technician Notes</label>
                  <textarea
                    value={jobUpdate.notes}
                    onChange={(e) => setJobUpdate({ ...jobUpdate, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={4}
                    placeholder="Update job progress or notes..."
                  />
                </div>
                <div className="flex justify-between space-x-3 mt-6">
                  {/* Invoice Button for Completed Jobs */}
                  {editingJob.status === 'WORK_COMPLETED' && (
                    <button
                      type="button"
                      onClick={handleGenerateInvoice}
                      className="px-4 py-2 rounded-lg text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    >
                      Generate Invoice
                    </button>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingJob(null)}
                      className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Update Job
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vehicle Telemetry Modal */}
        {viewingVehicle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-50">Vehicle Telemetry</h2>
                  <p className="text-gray-400 text-sm mt-1">Vehicle ID: {viewingVehicle.vehicleId}</p>
                </div>
                <button
                  onClick={() => setViewingVehicle(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {loadingTelemetry ? (
                <div className="text-center py-8 text-gray-400">Loading live telemetry...</div>
              ) : vehicleTelemetry ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">Speed</div>
                      <div className="text-xl font-mono text-blue-300">{(vehicleTelemetry as any).speed || (vehicleTelemetry as any).speed_kmh || 0} km/h</div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">RPM</div>
                      <div className="text-xl font-mono text-purple-300">{vehicleTelemetry.rpm}</div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">Engine Temp</div>
                      <div className="text-xl font-mono text-orange-300">{(vehicleTelemetry as any).engine_temp || (vehicleTelemetry as any).engine_temp_c || 0}°C</div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">Fuel Level</div>
                      <div className="text-xl font-mono text-emerald-300">{(vehicleTelemetry as any).fuel_level || (vehicleTelemetry as any).fuel_level_percent || 0}%</div>
                    </div>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">Battery</div>
                      <div className="text-xl font-mono text-yellow-300">{(vehicleTelemetry as any).battery_voltage || (vehicleTelemetry as any).battery_voltage_v || 0}V</div>
                    </div>
                  </div>

                  {/* Alerts / Risks */}
                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                      Active Risks & Alerts
                    </h3>
                    {/* Placeholder for alerts as we don't have a direct endpoint in this context yet */}
                    <div className="text-sm text-gray-500 italic">
                      No active critical alerts detected for this session.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No telemetry data available for this vehicle.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings List */}
        {activeTab === 'bookings' && (
          <div className="text-sm text-gray-400">
            {bookings.length === 0 ? (
              <p className="text-center py-8">No bookings found</p>
            ) : (
              bookings.map((booking, index) => {
                const bookingId = booking.booking_id || (booking as any)._id || `booking-${index}`;
                const displayId = bookingId.slice(-8);
                return (
                  <div key={bookingId} className="card p-4 mb-4 hover:border-gray-600 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <span className="font-mono text-blue-400">#{displayId}</span>
                          <span className={`badge border ${getStatusColor(booking.status || 'PENDING')}`}>
                            {booking.status || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-gray-300 font-medium pl-8">
                          {booking.vehicle_id}
                          {booking.vehicle_make && <span className="text-gray-500 font-normal"> • {booking.vehicle_make} {booking.vehicle_model}</span>}
                        </div>
                        {role === UserRole.SERVICE_CENTER && booking.customer_name && (
                          <div className="text-xs text-gray-500 pl-8">
                            Customer: {booking.customer_name} ({booking.customer_phone})
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right text-sm">
                          <div className="text-gray-300">
                            {booking.slot_start ? format(new Date(booking.slot_start), 'MMM dd, HH:mm') : 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            to {booking.slot_end ? format(new Date(booking.slot_end), 'HH:mm') : 'N/A'}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {/* View Telemetry Button */}
                          {role === UserRole.SERVICE_CENTER && (
                            <button
                              onClick={() => setViewingVehicle({ vehicleId: booking.vehicle_id })}
                              className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
                            >
                              <Activity className="h-3 w-3" />
                              <span>Telemetry</span>
                            </button>
                          )}

                          {/* Start Job Button */}
                          {role === UserRole.SERVICE_CENTER && booking.status === 'CONFIRMED' && (
                            <button
                              onClick={async () => {
                                if (confirm('Start job for this booking?')) {
                                  try {
                                    await serviceWorkflowApi.createJob({
                                      booking_id: bookingId,
                                      notes: 'Job started from portal',
                                      role
                                    });
                                    alert('Job started successfully');
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error starting job:', error);
                                    alert('Failed to start job');
                                  }
                                }
                              }}
                              className="flex items-center space-x-1 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 rounded transition-colors border border-emerald-500/30"
                            >
                              <Wrench className="h-3 w-3" />
                              <span>Start Job</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Jobs List */}
        {activeTab === 'jobs' && (
          <div className="text-sm text-gray-400">
            {jobs.length === 0 ? (
              <p className="text-center py-8">No job cards found</p>
            ) : (
              jobs.map((job, index) => {
                const jobId = job.job_card_id || (job as any)._id || `job-${index}`;
                const displayId = jobId.slice(-8);
                return (
                  <div key={jobId} className="card p-4 mb-4 hover:border-gray-600 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <Wrench className="h-5 w-5 text-amber-500" />
                          <span className="font-mono text-amber-500">#{displayId}</span>
                          <span className={`badge border ${getStatusColor(job.status || 'OPEN')}`}>
                            {job.status || 'OPEN'}
                          </span>
                        </div>
                        <div className="text-gray-300 pl-8">
                          {job.technician_notes || job.notes || 'No description'}
                        </div>
                        {job.assigned_technician && (
                          <div className="text-xs text-gray-500 pl-8">
                            Tech: {job.assigned_technician}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex space-x-2">
                          {role === UserRole.SERVICE_CENTER && (
                            <>
                              <button
                                onClick={() => setViewingVehicle({ vehicleId: job.vehicle_id || '' })}
                                className="flex items-center space-x-1 text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded transition-colors"
                              >
                                <Activity className="h-3 w-3" />
                                <span>Telemetry</span>
                              </button>

                              <button
                                onClick={() => handleOpenJobParams(job)}
                                className="flex items-center space-x-1 text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded transition-colors"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Manage</span>
                              </button>
                            </>
                          )}
                        </div>

                        {job.work_timeline && job.work_timeline.length > 0 && (
                          <div className="text-right text-xs text-gray-500 max-w-xs">
                            Latest: {job.work_timeline[job.work_timeline.length - 1].notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Invoices List */}
        {activeTab === 'invoices' && (
          <div className="text-sm text-gray-400">
            {invoices.length === 0 ? (
              <p className="text-center py-8">No invoices found</p>
            ) : (
              invoices.map((invoice, index) => {
                const invoiceId = invoice.invoice_id || (invoice as any)._id || `invoice-${index}`;
                const displayId = invoice.invoice_number || invoiceId.slice(-8);

                return (
                  <div key={invoiceId} className="card p-4 mb-4 hover:border-gray-600 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-purple-400">{displayId}</span>
                          <span className={`badge border ${getStatusColor(invoice.payment_status || 'UNPAID')}`}>
                            {invoice.payment_status || 'UNPAID'}
                          </span>
                        </div>
                        {role === UserRole.SERVICE_CENTER && invoice.customer_name && (
                          <div className="text-xs text-gray-500">
                            Billed to: {invoice.customer_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {invoice.parts?.length || 0} items • {invoice.labour_hours || 0} hrs labour
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-100" style={{ fontFamily: '"Space Mono", monospace' }}>
                          ${(invoice.total_amount || invoice.total || 0).toFixed(2)}
                        </div>
                        {invoice.due_date && (
                          <div className="text-xs text-red-400 mt-1">Due: {format(new Date(invoice.due_date), 'MMM dd')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {/* Alerts List */}
        {activeTab === 'alerts' && (
          <div className="text-sm text-gray-400">
            {alerts.length === 0 ? (
              <p className="text-center py-8">No active alerts found.</p>
            ) : (
              alerts.map((alert, index) => (
                <div key={index} className="card p-4 mb-4 hover:border-gray-600 transition-colors border-l-4 border-l-red-500/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-red-300 font-medium">{alert.type || 'Vehicle Alert'}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 uppercase border border-red-500/20">
                          {alert.severity || 'HIGH'}
                        </span>
                      </div>
                      <p className="text-gray-300">{alert.message}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Vehicle: {alert.vehicle_id} • {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceBooking;


