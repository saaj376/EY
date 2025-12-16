
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Stethoscope, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi } from '../services/api';
import type { Alert, Diagnosis } from '../types';
import { format } from 'date-fns';

interface AlertsProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const Alerts = ({ role, userId, serviceCentreId }: AlertsProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let alertsData: Alert[] = [];
        let diagnosisData: Diagnosis[] = [];
        if (role === UserRole.CUSTOMER) {
          const res = await userApi.getAlerts(userId, role);
          alertsData = res.data;
          try {
            // Also fetch diagnosis to have them ready
            const dRes = await userApi.getDiagnosis(userId, role);
            diagnosisData = dRes.data;
          } catch (e) { console.error("No diagnosis", e); }
        } else if (role === UserRole.SERVICE_CENTER) {
          const res = await serviceApi.getAlerts(serviceCentreId, role);
          alertsData = res.data;
        } else {
          return;
        }
        setAlerts(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [role, userId, serviceCentreId]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Clock className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-300 border-red-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading alerts...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-50">Alerts</h1>
        <p className="mt-1 text-sm text-gray-400">Monitor and manage vehicle alerts</p>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Active ({alerts.filter(a => !a.resolved).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'resolved' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Resolved ({alerts.filter(a => a.resolved).length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-50 mb-2">No alerts found</h3>
            <p className="text-gray-400">All clear! No alerts match your filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div key={idx} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-50">{alert.alert_type}</h3>
                      <span className={`badge border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {alert.resolved && (
                        <span className="badge bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-2">Vehicle ID: {alert.vehicle_id}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                    {alert.value !== undefined && (
                      <p className="text-sm text-gray-300 mt-2">
                        Value: <span className="font-medium">{alert.value}</span>
                      </p>
                    )}
                    {alert.feedback && (
                      <p className="text-sm text-gray-400 mt-2">
                        Feedback: <span className="italic">{alert.feedback}</span>
                      </p>
                    )}
                  </div>
                  <ArrowRight className="text-gray-400" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Diagnosis Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAlert.alert_type}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Recorded on {format(new Date(selectedAlert.timestamp), 'PPP p')}
                </p>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Severity Banner */}
              <div className={`p-4 rounded-lg flex items-center ${selectedAlert.severity === 'HIGH' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                {getSeverityIcon(selectedAlert.severity)}
                <span className="ml-3 font-medium">
                  This is a {selectedAlert.severity} severity alert. Immediate attention {selectedAlert.severity === 'HIGH' ? 'REQUIRED' : 'recommended'}.
                </span>
              </div>

              {/* Diagnosis Details */}
              {getDiagnosisForAlert(selectedAlert) ? (
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-900 flex items-center mb-4">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    AI Diagnosis
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-600 font-bold mb-1">Probable Cause</p>
                      <p className="text-gray-900 font-medium text-lg">
                        {getDiagnosisForAlert(selectedAlert)?.probable_cause}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-600 font-bold mb-1">Recommendation</p>
                      <p className="text-gray-900">
                        {getDiagnosisForAlert(selectedAlert)?.recommendation}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-purple-200 rounded-full h-2 mr-4">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(getDiagnosisForAlert(selectedAlert)?.confidence || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-purple-800">
                        {(getDiagnosisForAlert(selectedAlert)?.confidence || 0) * 100}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No AI diagnosis generated for this alert yet.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setSelectedAlert(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                Close
              </button>
              <button className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm">
                Book Service Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
