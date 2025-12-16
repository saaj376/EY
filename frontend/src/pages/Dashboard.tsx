import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Car, 
  Activity, 
  TrendingUp, 
  Clock,
  XCircle,
  Wrench
} from 'lucide-react';
import { UserRole } from '../types';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import ServiceDashboard from '../components/dashboard/ServiceDashboard';
import OEMDashboard from '../components/dashboard/OEMDashboard';

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
    return <div className="py-12 text-center text-gray-400">Loading dashboard…</div>;
  }

  if (role === UserRole.SERVICE_CENTER) {
    return <ServiceDashboard serviceCentreId={serviceCentreId} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-50">System Status</h1>
        <p className="mt-1 text-sm text-gray-400">
          Real-time telemetry and fleet operational metrics.
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-400">
          Current monitoring period: <span className="font-semibold">Live</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {role === UserRole.CUSTOMER && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                  Total Fleet
                </p>
                <p className="mt-3 text-4xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
                  {vehicles.length}
                </p>
                <p className="mt-1 text-xs text-emerald-400">Active units deployed</p>
              </div>
              <div className="rounded-xl bg-gray-800/80 p-3">
                <Car className="h-7 w-7 text-sky-400" />
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                Critical Alerts
              </p>
              <p className="mt-3 text-4xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
                {activeAlerts.length}
              </p>
              <p className="mt-1 text-xs text-amber-400">Requires immediate attention</p>
            </div>
            <div className="rounded-xl bg-gray-800/80 p-3">
              <AlertTriangle className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                High Severity
              </p>
              <p className="mt-3 text-4xl font-semibold text-red-400" style={{ fontFamily: '"Space Mono", monospace' }}>
                {highSeverityAlerts.length}
              </p>
              <p className="mt-1 text-xs text-gray-400">Active high-risk events</p>
            </div>
            <div className="rounded-xl bg-gray-800/80 p-3">
              <XCircle className="h-7 w-7 text-red-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                  Scheduled
                </p>
                <p className="mt-3 text-4xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
                  {upcomingBookings.length}
                </p>
                <p className="mt-1 text-xs text-gray-400">Maintenance bookings</p>
              </div>
            <div className="rounded-xl bg-gray-800/80 p-3">
              <Clock className="h-7 w-7 text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity + Control Panel (using existing data/actions) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Alerts / Activity */}
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-50">Recent Activity</h2>
              <p className="text-xs text-gray-500">Latest alerts from your fleet</p>
            </div>
            <Link
              to="/alerts"
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              View log
            </Link>
          </div>
          <div className="space-y-3" style={{ fontFamily: '"Space Mono", monospace' }}>
            {activeAlerts.slice(0, 5).map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-gray-900/80 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      alert.severity === 'HIGH'
                        ? 'bg-red-500'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-100">
                      {alert.alert_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vehicle {alert.vehicle_id} ·{' '}
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`badge ${
                    alert.severity === 'HIGH'
                      ? 'bg-red-500/10 text-red-300'
                      : alert.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-sky-500/10 text-sky-300'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">
                All clear. No active alerts right now.
              </p>
            )}
          </div>
        </div>

        {/* Control Panel / Quick Actions */}
        <div className="space-y-3" style={{ fontFamily: '"Space Mono", monospace' }}>
          <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            Control Panel
          </h2>
          <Link
            to="/telemetry"
            className="card flex items-center justify-between hover:bg-gray-900 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-100">Telemetry Stream</p>
              <p className="text-xs text-gray-500">Live data visualization.</p>
            </div>
            <Activity className="h-5 w-5 text-blue-400" />
          </Link>
          <Link
            to="/service"
            className="card flex items-center justify-between hover:bg-gray-900 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-100">Service Planner</p>
              <p className="text-xs text-gray-500">Manage bookings.</p>
            </div>
            <Wrench className="h-5 w-5 text-gray-300" />
          </Link>
          <Link
            to="/analytics"
            className="card flex items-center justify-between hover:bg-gray-900 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-100">Report Generator</p>
              <p className="text-xs text-gray-500">Custom analytics & logs.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-300" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


