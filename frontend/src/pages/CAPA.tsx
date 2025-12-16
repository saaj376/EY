import { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, AlertCircle, Plus } from 'lucide-react';
import { UserRole } from '../types';
import { capaApi, serviceApi } from '../services/api';
import type { CAPA } from '../types';
import { format } from 'date-fns';

interface CAPAProps {
  role: UserRole;
  serviceCentreId: string;
}

const CAPA = ({ role, serviceCentreId }: CAPAProps) => {
  const [showForm, setShowForm] = useState(false);
  const [newCAPA, setNewCAPA] = useState({
    rca_id: '',
    action_type: 'CORRECTIVE',
    description: '',
    owner_team: 'Service',
    target_date: '',
  });
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCAPA = async () => {
      if (role === UserRole.SERVICE_CENTER) {
        try {
          const response = await serviceApi.getCAPA(role);
          setCapas(response.data);
        } catch (error) {
          console.error('Error fetching CAPA:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchCAPA();
  }, [role]);

  const handleCreateCAPA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await capaApi.create({
        ...newCAPA,
        role,
      });
      alert(`CAPA created: ${response.data.capa_id}`);
      setShowForm(false);
      setNewCAPA({
        rca_id: '',
        action_type: 'CORRECTIVE',
        description: '',
        owner_team: 'Service',
        target_date: '',
      });
    } catch (error) {
      console.error('Error creating CAPA:', error);
      alert('Failed to create CAPA');
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && capas.find(c => c.target_date === targetDate)?.status !== 'COMPLETED';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading CAPA data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-50">Corrective & Preventive Actions</h1>
          <p className="mt-1 text-sm text-gray-400">Track and manage CAPA items</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New CAPA</span>
        </button>
      </div>

      {/* Create CAPA Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Create CAPA</h2>
          <form onSubmit={handleCreateCAPA} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  RCA ID
                </label>
                <input
                  type="text"
                  value={newCAPA.rca_id}
                  onChange={(e) => setNewCAPA({ ...newCAPA, rca_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Action Type
                </label>
                <select
                  value={newCAPA.action_type}
                  onChange={(e) => setNewCAPA({ ...newCAPA, action_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Preventive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Owner Team
              </label>
              <input
                type="text"
                value={newCAPA.owner_team}
                onChange={(e) => setNewCAPA({ ...newCAPA, owner_team: e.target.value })}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={newCAPA.target_date}
                onChange={(e) => setNewCAPA({ ...newCAPA, target_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newCAPA.description}
                onChange={(e) => setNewCAPA({ ...newCAPA, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={4}
                required
                placeholder="Describe the action to be taken..."
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                Create CAPA
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CAPA List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-50">CAPA Items</h2>
        </div>
        {capas.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-50 mb-2">No CAPA items</h3>
            <p className="text-gray-400">Create a new CAPA to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {capas.map((capa) => {
              const overdue = isOverdue(capa.target_date);
              return (
                <div key={capa.capa_id} className={`p-4 rounded-lg border ${overdue ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-900/80 border-gray-800'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <ClipboardCheck className="h-5 w-5 text-blue-400" />
                        <h3 className="font-semibold text-gray-50">CAPA #{capa.capa_id.slice(-8)}</h3>
                        <span className={`badge border ${
                          capa.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          overdue ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                          'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {capa.status}
                        </span>
                        {overdue && (
                          <span className="badge bg-red-500/10 text-red-300 border-red-500/20 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        RCA: {capa.rca_id} • Type: {capa.action_type} • Owner: {capa.owner_team}
                      </p>
                      <p className="text-gray-300 mb-2">{capa.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Target: {format(new Date(capa.target_date), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          Created: {format(new Date(capa.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CAPA;

