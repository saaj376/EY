import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';
import { userApi } from '../services/api';
import type { Vehicle } from '../types';
import { format } from 'date-fns';

interface VehiclesProps {
  role: UserRole;
  userId: string;
}

const Vehicles = ({ role, userId }: VehiclesProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await userApi.getVehicles(userId, role);
        setVehicles(response.data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (role === UserRole.CUSTOMER) {
      fetchVehicles();
    }
  }, [role, userId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-50">My Vehicles</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your registered vehicles</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="card text-center py-12">
          <Car className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-50 mb-2">No vehicles found</h3>
          <p className="text-gray-400">Register a vehicle to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.vin} className="card hover:bg-gray-900/80 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Car className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 font-mono">{vehicle.vin}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-50 mb-1">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-gray-400 mb-4">Year: {vehicle.year}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  Registered: {format(new Date(vehicle.created_at), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  Last seen: {format(new Date(vehicle.last_seen_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>

              <Link
                to={`/telemetry/${vehicle.vin}`}
                className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium w-full"
              >
                <span>View Telemetry</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
