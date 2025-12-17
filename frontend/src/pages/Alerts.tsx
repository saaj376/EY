import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Stethoscope, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import { userApi, serviceApi } from '../services/api';
import type { Alert, Diagnosis } from '../types';
import { format } from 'date-fns';
import { getMockAlerts } from '../lib/mockData';

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
        
        // Add OEM mock data support
        if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
          alertsData = getMockAlerts(role);
          setAlerts(alertsData);
          setLoading(false);
          return;
        }
        
        if (role === UserRole.CUSTOMER) {
          const res = await userApi.getAlerts(userId, role);
          alertsData = res.data;
          try {
            const dRes = await userApi.getDiagnosis(userId, role);
            diagnosisData = dRes.data;
          } catch (e) { console.error("No diagnosis", e); }
        } else if (role === UserRole.SERVICE_CENTER) {
          const res = await serviceApi.getAlerts(serviceCentreId, role);
          alertsData = res.data;
        } else {
          setLoading(false);
          return;
        }
        setAlerts(alertsData);
        setDiagnoses(diagnosisData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, userId, serviceCentreId]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getDiagnosisForAlert = (alert: Alert) => {
    // Assuming alert object has _id or we need to match appropriately
    // The Alert type uses MongoDB _id but frontend usually strips it or maps it.
    // Let's assume passed alert object has `_id` property from backend.
    // If Typescript complains, we might need to cast or fix Interface.
    // Standard MongoDB response includes _id. 
    // The current Alert interface in types/index.ts DOES NOT include _id.
    // But the backend sends it. I'll cast it to any to access _id safely or extend the type.
    const alertId = (alert as any)._id;
    return diagnoses.find(d => d.alert_id === alertId);
  };

  if (loading) return <div className="text-center py-12">Loading alerts...</div>;

  const pageTitle = (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST)
  ? "Fleet Alerts"
  : "Alerts";
  const pageSubtitle = (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST)
  ? "Monitor and manage fleet-wide alerts"
  : "Monitor and manage vehicle alerts";

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-50">{pageTitle}</h1>
          <p className="text-gray-300 mt-1">{pageSubtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'active', 'resolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card bg-gray-800 border-gray-700 text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-50 mb-2">No alerts found</h3>
            <p className="text-gray-300">All clear! No alerts match your filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const diagnosis = getDiagnosisForAlert(alert);
            return (
              <div key={idx} className="card bg-gray-800 border-gray-700 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gray-200"
                onClick={() => setSelectedAlert(alert)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-50">{alert.alert_type}</h3>
                        <span className={`badge ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        {diagnosis && (
                          <span className="badge bg-purple-100 text-purple-300 flex items-center">
                            <Stethoscope className="h-3 w-3 mr-1" /> Diagnosed
                          </span>
                        )}
                        {alert.resolved && (
                          <span className="badge bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-2">Vehicle ID: {alert.vehicle_id}</p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
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
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-50">{selectedAlert.alert_type}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Recorded on {format(new Date(selectedAlert.timestamp), 'PPP p')}
                </p>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-700 rounded-full">
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
                <div className="bg-purple-900/20 p-6 rounded-lg border border-purple-700">
                  <h3 className="text-lg font-bold text-purple-200 flex items-center mb-4">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    AI Diagnosis
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-400 font-bold mb-1">Probable Cause</p>
                      <p className="text-gray-50 font-medium text-lg">
                        {getDiagnosisForAlert(selectedAlert)?.probable_cause}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-400 font-bold mb-1">Recommendation</p>
                      <p className="text-gray-50">
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
                      <span className="text-sm font-bold text-purple-300">
                        {(getDiagnosisForAlert(selectedAlert)?.confidence || 0) * 100}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-900 rounded-lg border border-dashed border-gray-700">
                  <p className="text-gray-400">No AI diagnosis generated for this alert yet.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setSelectedAlert(null)} className="px-4 py-2 text-gray-300 font-medium hover:bg-gray-700 rounded-lg">
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


