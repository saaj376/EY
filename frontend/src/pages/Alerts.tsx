import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi } from '../services/api';
import type { Alert } from '../types';
import { format } from 'date-fns';

interface AlertsProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const Alerts = ({ role, userId, serviceCentreId }: AlertsProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        let response;
        if (role === UserRole.CUSTOMER) {
          response = await userApi.getAlerts(userId, role);
        } else if (role === UserRole.SERVICE_CENTER) {
          response = await serviceApi.getAlerts(serviceCentreId, role);
        } else {
          // For OEM roles, would need a different endpoint
          setLoading(false);
          return;
        }
        setAlerts(response.data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [role, userId, serviceCentreId]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage vehicle alerts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active ({alerts.filter(a => !a.resolved).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'resolved' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Resolved ({alerts.filter(a => a.resolved).length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">All clear! No alerts match your filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div key={idx} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alert.alert_type}</h3>
                      <span className={`badge ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.resolved && (
                        <span className="badge bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">Vehicle ID: {alert.vehicle_id}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                    {alert.value !== undefined && (
                      <p className="text-sm text-gray-700 mt-2">
                        Value: <span className="font-medium">{alert.value}</span>
                      </p>
                    )}
                    {alert.feedback && (
                      <p className="text-sm text-gray-600 mt-2">
                        Feedback: <span className="italic">{alert.feedback}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;


