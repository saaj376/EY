import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi, serviceWorkflowApi } from '../services/api';
import type { Booking, JobCard, Invoice } from '../types';
import { format } from 'date-fns';

interface ServiceBookingProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const ServiceBooking = ({ role, userId, serviceCentreId }: ServiceBookingProps) => {
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

  useEffect(() => {
    const fetchData = async () => {
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
          const [bookingsRes, jobsRes] = await Promise.all([
            serviceApi.getBookings(serviceCentreId, role),
            serviceApi.getJobs(serviceCentreId, role),
          ]);
          setBookings(bookingsRes.data);
          setJobs(jobsRes.data);
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
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading service data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-1">Manage service bookings and workflows</p>
        </div>
        {role === UserRole.CUSTOMER && (
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="btn-primary"
          >
            + New Booking
          </button>
        )}
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Booking</h2>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle ID
              </label>
              <input
                type="text"
                value={newBooking.vehicle_id}
                onChange={(e) => setNewBooking({ ...newBooking, vehicle_id: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot Start
                </label>
                <input
                  type="datetime-local"
                  value={newBooking.slot_start}
                  onChange={(e) => setNewBooking({ ...newBooking, slot_start: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot End
                </label>
                <input
                  type="datetime-local"
                  value={newBooking.slot_end}
                  onChange={(e) => setNewBooking({ ...newBooking, slot_end: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Create Booking
              </button>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
        </div>
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No bookings found</p>
          ) : (
            bookings.map((booking, index) => {
              // Handle both booking_id field and _id field (MongoDB ObjectId)
              const bookingId = booking.booking_id 
                ? String(booking.booking_id) 
                : (booking as any)._id 
                  ? String((booking as any)._id) 
                  : `booking-${index}`;
              const displayId = bookingId.length > 8 ? bookingId.slice(-8) : bookingId;
              return (
              <div key={bookingId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">Booking #{displayId}</h3>
                      <span className={`badge ${getStatusColor(booking.status || 'PENDING')}`}>
                        {booking.status || 'PENDING'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="block text-gray-500">Vehicle</span>
                        <span className="font-medium">{booking.vehicle_id || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Start</span>
                        <span className="font-medium">
                          {booking.slot_start ? format(new Date(booking.slot_start), 'MMM dd, HH:mm') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500">End</span>
                        <span className="font-medium">
                          {booking.slot_end ? format(new Date(booking.slot_end), 'MMM dd, HH:mm') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Service Centre</span>
                        <span className="font-medium">{booking.service_centre_id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Job Cards */}
      {jobs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Job Cards</h2>
          </div>
          <div className="space-y-4">
            {jobs.map((job, index) => {
              const jobId = job.job_card_id 
                ? String(job.job_card_id) 
                : (job as any)._id 
                  ? String((job as any)._id) 
                  : `job-${index}`;
              const displayId = jobId.length > 8 ? jobId.slice(-8) : jobId;
              return (
              <div key={jobId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Wrench className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">Job #{displayId}</h3>
                      <span className={`badge ${getStatusColor(job.status || 'PENDING')}`}>
                        {job.status || 'PENDING'}
                      </span>
                    </div>
                    {job.notes && (
                      <p className="text-sm text-gray-600 mt-2">{job.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Invoices */}
      {role === UserRole.CUSTOMER && invoices.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          </div>
          <div className="space-y-4">
            {invoices.map((invoice, index) => {
              const invoiceId = invoice.invoice_id 
                ? String(invoice.invoice_id) 
                : (invoice as any)._id 
                  ? String((invoice as any)._id) 
                  : `invoice-${index}`;
              const displayId = invoiceId.length > 8 ? invoiceId.slice(-8) : invoiceId;
              const partsTotal = invoice.parts?.reduce((sum, p) => sum + (p.cost || 0), 0) || 0;
              return (
              <div key={invoiceId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">Invoice #{displayId}</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-500">Parts</span>
                        <span className="font-medium">
                          ${partsTotal.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Labour</span>
                        <span className="font-medium">${(invoice.labour_cost || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Tax</span>
                        <span className="font-medium">${(invoice.tax || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Total</span>
                        <span className="font-bold text-lg text-primary-600">
                          ${(invoice.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBooking;


