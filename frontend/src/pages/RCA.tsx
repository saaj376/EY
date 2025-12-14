import { useState } from 'react';
import { FileText, AlertTriangle, Search, Plus } from 'lucide-react';
import { UserRole } from '../types';
import { rcaApi } from '../services/api';
import { format } from 'date-fns';

interface RCAProps {
  role: UserRole;
}

const RCA = ({ role }: RCAProps) => {
  const [showForm, setShowForm] = useState(false);
  const [newRCA, setNewRCA] = useState({
    alert_id: '',
    vehicle_id: '',
    root_cause: '',
    analysis_method: '5_WHYS',
  });
  const [rcas, setRcas] = useState<any[]>([]); // Would fetch from API

  const handleCreateRCA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await rcaApi.create({
        ...newRCA,
        role,
      });
      alert(`RCA created: ${response.data.rca_id}`);
      setShowForm(false);
      setNewRCA({
        alert_id: '',
        vehicle_id: '',
        root_cause: '',
        analysis_method: '5_WHYS',
      });
    } catch (error) {
      console.error('Error creating RCA:', error);
      alert('Failed to create RCA');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Root Cause Analysis</h1>
          <p className="text-gray-600 mt-1">Investigate and document root causes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New RCA</span>
        </button>
      </div>

      {/* Create RCA Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Root Cause Analysis</h2>
          <form onSubmit={handleCreateRCA} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert ID
                </label>
                <input
                  type="text"
                  value={newRCA.alert_id}
                  onChange={(e) => setNewRCA({ ...newRCA, alert_id: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle ID
                </label>
                <input
                  type="text"
                  value={newRCA.vehicle_id}
                  onChange={(e) => setNewRCA({ ...newRCA, vehicle_id: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Method
              </label>
              <select
                value={newRCA.analysis_method}
                onChange={(e) => setNewRCA({ ...newRCA, analysis_method: e.target.value })}
                className="input"
              >
                <option value="5_WHYS">5 Whys</option>
                <option value="FISHBONE">Fishbone Diagram</option>
                <option value="FMEA">FMEA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Root Cause
              </label>
              <textarea
                value={newRCA.root_cause}
                onChange={(e) => setNewRCA({ ...newRCA, root_cause: e.target.value })}
                className="input"
                rows={4}
                required
                placeholder="Describe the root cause..."
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Create RCA
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RCA List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">RCA Records</h2>
        </div>
        {rcas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No RCA records</h3>
            <p className="text-gray-600">Create a new RCA to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rcas.map((rca) => (
              <div key={rca.rca_id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">RCA #{rca.rca_id.slice(-8)}</h3>
                      <span className={`badge ${
                        rca.status === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rca.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Alert: {rca.alert_id} • Vehicle: {rca.vehicle_id}
                    </p>
                    <p className="text-gray-700">{rca.root_cause}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Method: {rca.analysis_method} • Created: {format(new Date(rca.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RCA;


