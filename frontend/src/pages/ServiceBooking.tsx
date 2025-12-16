import { useEffect, useState } from 'react';
import { Calendar, Wrench } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi, serviceWorkflowApi } from '../services/api';
import type { Booking, JobCard, Invoice, DashboardStats } from '../types';
import { format } from 'date-fns';

interface ServiceBookingProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const ServiceBooking = ({ role, userId, serviceCentreId }: ServiceBookingProps) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'jobs' | 'invoices'>('dashboard');

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    vehicle_id: '',
    service_centre_id: serviceCentreId,
    slot_start: '',
    slot_end: '',
  });

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
          const [statsRes, bookingsRes, jobsRes, invoicesRes] = await Promise.all([
            serviceApi.getDashboardStats(serviceCentreId, role),
            serviceApi.getBookings(serviceCentreId, role),
            serviceApi.getJobs(serviceCentreId, role),
            serviceApi.getInvoices(serviceCentreId, role),
          ]);
          setDashboardStats(statsRes.data);
          setBookings(bookingsRes.data);
          setJobs(jobsRes.data);
          setInvoices(invoicesRes.data);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, userId, serviceCentreId]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await serviceWorkflowApi.createBooking({
        ...newBooking,
        user_id: userId,
        role,
      });
      setShowBookingForm(false);
      setNewBooking({
        vehicle_id: '',
        service_centre_id: serviceCentreId,
        slot_start: '',
        slot_end: '',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.detail?.error || 'Failed to create booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
      case 'COMPLETED':
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
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Booking Form Overlay */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-xl font-semibold text-gray-50 mb-4">Create New Booking</h2>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle ID</label>
                  <input
                    type="text"
                    value={newBooking.vehicle_id}
                    onChange={(e) => setNewBooking({ ...newBooking, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Slot Start</label>
                    <input
                      type="datetime-local"
                      value={newBooking.slot_start}
                      onChange={(e) => setNewBooking({ ...newBooking, slot_start: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Slot End</label>
                    <input
                      type="datetime-local"
                      value={newBooking.slot_end}
                      onChange={(e) => setNewBooking({ ...newBooking, slot_end: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
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
                  >
                    Create Booking
                  </button>
                </div>
              </form>
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
                      <div className="text-right text-sm">
                        <div className="text-gray-300">
                          {booking.slot_start ? format(new Date(booking.slot_start), 'MMM dd, HH:mm') : 'N/A'}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          to {booking.slot_end ? format(new Date(booking.slot_end), 'HH:mm') : 'N/A'}
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
                      {job.work_timeline && job.work_timeline.length > 0 && (
                        <div className="text-right text-xs text-gray-500 max-w-xs">
                          Latest: {job.work_timeline[job.work_timeline.length - 1].notes}
                        </div>
                      )}
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
      </div>
    </div>
  );
};

export default ServiceBooking;
