
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    ShieldAlert,
    Users,
    Car,
    AlertTriangle,
    ZoomIn,
    FileText
} from 'lucide-react';
import { notificationsApi } from '../../services/api';
import { UserRole } from '../../types';

const OEMDashboard = () => {
    const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock stats since we don't have a single API for "Pro" stats yet
    const stats = {
        totalVehicles: 1250,
        activeAlerts: 48,
        highRiskVehicles: 5,
        avgClosureTime: "4.2 hrs"
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch security alerts (UEBA)
                const res = await notificationsApi.getSecurityNotifications(UserRole.OEM_ADMIN);
                setSecurityAlerts(res.data);
            } catch (error) {
                console.error('Error fetching OEM data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-12">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">OEM Command Center</h1>
                <p className="text-gray-600 mt-1">System-wide monitoring and intelligence.</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-gray-900 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-400 text-sm">Total Vehicles</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalVehicles}</p>
                        </div>
                        <Car className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="mt-4 text-xs text-green-400 flex items-center">
                        <Users className="h-3 w-3 mr-1" /> +12 this week
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm">Active Alerts</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeAlerts}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                        <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-sm">High Risk Vehicles</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.highRiskVehicles}</p>
                        </div>
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="mt-4 text-xs text-red-600 font-medium">Attention Required</div>
                </div>

                <div className="card bg-indigo-50 border-indigo-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-indigo-600 text-sm">RCA Closure Time</p>
                            <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.avgClosureTime}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Security / UEBA Panel */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <ShieldAlert className="h-5 w-5 mr-2 text-gray-700" />
                            Security & UEBA Watchlist
                        </h2>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{securityAlerts.length} Events</span>
                    </div>
                    <div className="space-y-4">
                        {securityAlerts.slice(0, 5).map((alert, idx) => (
                            <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{alert.message || "Suspicious Activity Detected"}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Category: {alert.category} • Severity: {alert.severity || "HIGH"}
                                    </p>
                                </div>
                                <span className="text-xs font-mono text-gray-400">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                        {securityAlerts.length === 0 && <p className="text-gray-400 text-center py-8">No security anomalies detected.</p>}
                    </div>
                </div>

                {/* Quick Nav Grid */}
                <div className="space-y-6">
                    <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <h3 className="font-bold text-xl mb-2">Deep Analytics</h3>
                        <p className="text-indigo-100 text-sm mb-4">Analyze failure patterns, component reliability, and service performance.</p>
                        <Link to="/analytics" className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
                            Open Analytics Suite
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/rca" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                            <ZoomIn className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                            <span className="block text-sm font-medium text-gray-700">RCA Workbench</span>
                        </Link>
                        <Link to="/capa" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                            <FileText className="h-8 w-8 mx-auto text-green-500 mb-2" />
                            <span className="block text-sm font-medium text-gray-700">CAPA Tracker</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OEMDashboard;
