
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Car,
    Activity,
    Clock,
    Wrench,
    ChevronRight,
    PhoneCall
} from 'lucide-react';
import { userApi } from '../../services/api';
import type { Vehicle, Alert, Booking } from '../../types';
import { UserRole } from '../../types';

interface CustomerDashboardProps {
    userId: string;
}

const CustomerDashboard = ({ userId }: CustomerDashboardProps) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vehiclesRes, alertsRes, bookingsRes] = await Promise.all([
                    userApi.getVehicles(userId, UserRole.CUSTOMER),
                    userApi.getAlerts(userId, UserRole.CUSTOMER),
                    userApi.getBookings(userId, UserRole.CUSTOMER),
                ]);
                setVehicles(vehiclesRes.data);
                setAlerts(alertsRes.data);
                setBookings(bookingsRes.data);
            } catch (error) {
                console.error('Error fetching customer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    const activeAlerts = alerts.filter(a => !a.resolved);
    const highSeverityAlerts = activeAlerts.filter(a => a.severity === 'HIGH');
    const upcomingBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "OPEN").slice(0, 3);

    // Assuming first vehicle is primary for overview if multiple
    const primaryVehicle = vehicles[0];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Welcome back! You have <span className="font-semibold text-primary-700">{vehicles.length} vehicle(s)</span> active.
                </p>
            </div>

            {/* Vehicle Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vehicle Status */}
                <div className="card lg:col-span-2 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Car className="h-5 w-5 mr-2 text-primary-600" />
                                Vehicle Status
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {primaryVehicle ? `${primaryVehicle.year} ${primaryVehicle.make} ${primaryVehicle.model}` : 'No vehicle selected'}
                            </p>
                        </div>
                        {primaryVehicle && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${highSeverityAlerts.length > 0
                                    ? 'bg-red-100 text-red-800'
                                    : activeAlerts.length > 0
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                {highSeverityAlerts.length > 0 ? 'Critical' : activeAlerts.length > 0 ? 'Warning' : 'Normal'}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                            <Activity className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                            <p className="text-2xl font-bold text-gray-900">--</p>
                            <p className="text-xs text-gray-500">Speed</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-bold text-gray-900">--</p>
                            <p className="text-xs text-gray-500">RPM</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-bold text-gray-900">--</p>
                            <p className="text-xs text-gray-500">Temp</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                            <p className="text-2xl font-bold text-gray-900">--</p>
                            <p className="text-xs text-gray-500">Fuel</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Link to="/telemetry" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                            View Live Telemetry <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                </div>

                {/* Quick Actions / Alerts Summary */}
                <div className="space-y-6">
                    {/* Voice Escalation Indicator */}
                    {highSeverityAlerts.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-pulse">
                            <div className="flex items-center">
                                <PhoneCall className="h-6 w-6 text-red-600 mr-3" />
                                <div>
                                    <p className="text-sm font-bold text-red-800">Voice Call Initiated</p>
                                    <p className="text-xs text-red-600 mt-1">Connecting to support...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/service" className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                                        <Wrench className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <span className="ml-3 font-medium text-gray-800">Book Service</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                            <Link to="/telemetry" className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-200 rounded-lg group-hover:bg-purple-300 transition-colors">
                                        <Activity className="h-5 w-5 text-purple-700" />
                                    </div>
                                    <span className="ml-3 font-medium text-gray-800">All Metrics</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Alerts List */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
                        <Link to="/alerts" className="text-primary-600 hover:text-primary-700 text-sm">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {activeAlerts.slice(0, 3).map((alert, idx) => (
                            <div key={idx} className={`flex items-start p-3 rounded-lg ${alert.severity === 'HIGH' ? 'bg-red-50' : 'bg-gray-50'}`}>
                                <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'HIGH' ? 'text-red-500' :
                                        alert.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                                    }`} />
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{alert.alert_type}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${alert.severity === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                                    }`}>
                                    {alert.severity}
                                </span>
                            </div>
                        ))}
                        {activeAlerts.length === 0 && <p className="text-gray-400 text-center py-4">No active alerts</p>}
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Service Bookings</h2>
                        <Link to="/service" className="text-primary-600 hover:text-primary-700 text-sm">Manage</Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingBookings.map((booking, idx) => (
                            <div key={idx} className="flex items-center p-3 border border-gray-100 rounded-lg">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(booking.slot_start).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(booking.slot_start).toLocaleTimeString()} - {new Date(booking.slot_end).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {upcomingBookings.length === 0 && <p className="text-gray-400 text-center py-4">No upcoming bookings</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
