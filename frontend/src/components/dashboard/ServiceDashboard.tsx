
import { useEffect, useState } from 'react';
import {
    Calendar,
    AlertOctagon,
    FileText,
    CheckSquare
} from 'lucide-react';
import { serviceApi } from '../../services/api';
import type { Booking, Alert } from '../../types';
import { UserRole } from '../../types';

interface ServiceDashboardProps {
    serviceCentreId: string;
}

const ServiceDashboard = ({ serviceCentreId }: ServiceDashboardProps) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookingsRes, alertsRes] = await Promise.all([
                    serviceApi.getBookings(serviceCentreId, UserRole.SERVICE_CENTER),
                    serviceApi.getAlerts(serviceCentreId, UserRole.SERVICE_CENTER),
                ]);
                setBookings(bookingsRes.data);
                setAlerts(alertsRes.data);
            } catch (error) {
                console.error('Error fetching service data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [serviceCentreId]);

    if (loading) return <div className="text-center py-12 text-gray-300">Loading...</div>;

    const todayBookings = bookings.filter(b => {
        const date = new Date(b.slot_start);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    });

    const highSeverityAlerts = alerts.filter(a => a.severity === 'HIGH' && !a.resolved);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-50">Service Centre Dashboard</h1>
                <p className="text-gray-300 mt-1">
                    {todayBookings.length} bookings scheduled for today.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats */}
                <div className="card bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-400 font-medium">Today's Jobs</p>
                            <p className="text-3xl font-bold text-gray-50 mt-1">{todayBookings.length}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-400" />
                    </div>
                </div>
                <div className="card bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-400 font-medium">Critical Alerts</p>
                            <p className="text-3xl font-bold text-gray-50 mt-1">{highSeverityAlerts.length}</p>
                        </div>
                        <AlertOctagon className="h-8 w-8 text-red-400" />
                    </div>
                </div>
                <div className="card bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-400 font-medium">Completed</p>
                            <p className="text-3xl font-bold text-gray-50 mt-1">
                                {bookings.filter(b => b.status === "COMPLETED").length}
                            </p>
                        </div>
                        <CheckSquare className="h-8 w-8 text-green-400" />
                    </div>
                </div>
                <div className="card bg-gray-800 border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-400 font-medium">Pending Invoices</p>
                            <p className="text-3xl font-bold text-gray-50 mt-1">--</p>
                        </div>
                        <FileText className="h-8 w-8 text-purple-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 card bg-gray-800 border-gray-700">
                    <h2 className="text-lg font-bold text-gray-50 mb-4">Today's Schedule</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-900 text-gray-300 uppercase border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Vehicle</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {todayBookings.map((booking) => (
                                    <tr key={booking.booking_id} className="hover:bg-gray-800">
                                        <td className="px-4 py-3 font-medium">
                                            {new Date(booking.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">{booking.vehicle_id}</td>
                                        <td className="px-4 py-3 text-gray-300">{booking.user_id}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.status === 'CONFIRMED' ? 'bg-blue-600/30 text-blue-300' :
                                                booking.status === 'COMPLETED' ? 'bg-green-600/30 text-green-300' : 'bg-gray-700 text-gray-200'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-400 hover:text-blue-300 font-medium text-xs">open job card</button>
                                        </td>
                                    </tr>
                                ))}
                                {todayBookings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-300">No bookings for today</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* High Priority Alerts */}
                <div className="card bg-gray-800 border-gray-700">
                    <h2 className="text-lg font-bold text-gray-50 mb-4">Incoming Alerts (High Priority)</h2>
                    <div className="space-y-4">
                        {highSeverityAlerts.map((alert, idx) => (
                            <div key={idx} className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                                <div className="flex items-start">
                                    <AlertOctagon className="h-5 w-5 text-red-400 mt-0.5" />
                                    <div className="ml-3">
                                        <p className="text-sm font-bold text-gray-50">{alert.alert_type}</p>
                                        <p className="text-xs text-gray-300 mt-1">Vehicle: {alert.vehicle_id}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                                        <div className="mt-2">
                                            <button className="text-xs bg-red-600/20 border border-red-600 text-red-400 px-2 py-1 rounded hover:bg-red-600/30">
                                                Contact Owner
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!highSeverityAlerts.length && <p className="text-gray-300 text-center py-4">No high severity alerts</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDashboard;



