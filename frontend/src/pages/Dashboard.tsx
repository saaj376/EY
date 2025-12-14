import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Car, 
  Activity, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Wrench
} from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi } from '../services/api';
import type { Vehicle, Alert, Booking } from '../types';

interface DashboardProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const Dashboard = ({ role, userId, serviceCentreId }: DashboardProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === UserRole.CUSTOMER) {
          const [vehiclesRes, alertsRes, bookingsRes] = await Promise.all([
            userApi.getVehicles(userId, role),
            userApi.getAlerts(userId, role),
            userApi.getBookings(userId, role),
          ]);
          setVehicles(vehiclesRes.data);
          setAlerts(alertsRes.data);
          setBookings(bookingsRes.data);
        } else if (role === UserRole.SERVICE_CENTER) {
          const [bookingsRes, alertsRes] = await Promise.all([
            serviceApi.getBookings(serviceCentreId, role),
            serviceApi.getAlerts(serviceCentreId, role),
          ]);
          setBookings(bookingsRes.data);
          setAlerts(alertsRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, userId, serviceCentreId]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const activeAlerts = alerts.filter(a => !a.resolved);
  const highSeverityAlerts = activeAlerts.filter(a => a.severity === 'HIGH');
  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the Vehicle Intelligence Platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {role === UserRole.CUSTOMER && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Vehicles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{vehicles.length}</p>
              </div>
              <Car className="h-12 w-12 text-primary-500" />
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeAlerts.length}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Severity</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{highSeverityAlerts.length}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingBookings.length}</p>
            </div>
            <Clock className="h-12 w-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
          <Link to="/alerts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {activeAlerts.slice(0, 5).map((alert, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  alert.severity === 'HIGH' ? 'bg-red-100' :
                  alert.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'HIGH' ? 'text-red-600' :
                    alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{alert.alert_type}</p>
                  <p className="text-sm text-gray-500">
                    Vehicle: {alert.vehicle_id} • {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`badge ${
                alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {alert.severity}
              </span>
            </div>
          ))}
          {activeAlerts.length === 0 && (
            <p className="text-center text-gray-500 py-8">No active alerts</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/telemetry" className="card hover:shadow-md transition-shadow">
          <Activity className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View Telemetry</h3>
          <p className="text-sm text-gray-600">Monitor real-time vehicle data</p>
        </Link>
        <Link to="/service" className="card hover:shadow-md transition-shadow">
          <Wrench className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Service Booking</h3>
          <p className="text-sm text-gray-600">Schedule vehicle service</p>
        </Link>
        <Link to="/analytics" className="card hover:shadow-md transition-shadow">
          <TrendingUp className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
          <p className="text-sm text-gray-600">View performance metrics</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

