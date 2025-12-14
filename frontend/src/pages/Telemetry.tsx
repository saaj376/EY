import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Gauge, Thermometer, Battery, Fuel, MapPin } from 'lucide-react';
import { UserRole } from '../types';
import { telemetryApi, userApi } from '../services/api';
import type { Telemetry, Vehicle } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TelemetryProps {
  role: UserRole;
  userId: string;
}

const Telemetry = ({ role, userId }: TelemetryProps) => {
  const { vehicleId } = useParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicleId || '');
  const [liveTelemetry, setLiveTelemetry] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (role === UserRole.CUSTOMER) {
        try {
          const response = await userApi.getVehicles(userId, role);
          setVehicles(response.data);
          if (response.data.length > 0 && !selectedVehicle) {
            setSelectedVehicle(response.data[0].vin);
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
        }
      }
    };

    fetchVehicles();
  }, [role, userId, selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) return;

    const fetchTelemetry = async () => {
      setLoading(true);
      try {
        const [liveRes, historyRes] = await Promise.all([
          telemetryApi.getLive(selectedVehicle, role).catch((err) => {
            // 404 is expected when there's no live telemetry data
            if (err.response?.status !== 404) {
              console.error('Error fetching live telemetry:', err);
            }
            return null;
          }),
          telemetryApi.getHistory(selectedVehicle, 50, role).catch((err) => {
            console.error('Error fetching telemetry history:', err);
            return { data: [] };
          }),
        ]);
        
        if (liveRes) {
          setLiveTelemetry(liveRes.data);
        }
        setHistory(historyRes.data || []);
      } catch (error) {
        console.error('Error fetching telemetry:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [selectedVehicle, role]);

  const chartData = history.slice().reverse().map(t => ({
    time: format(new Date(t.timestamp), 'HH:mm:ss'),
    speed: t.speed_kmph,
    rpm: t.rpm,
    engineTemp: t.engine_temp_c,
    coolantTemp: t.coolant_temp_c,
  }));

  const currentData = liveTelemetry || history[0];

  if (loading && !currentData) {
    return <div className="text-center py-12">Loading telemetry data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Telemetry</h1>
          <p className="text-gray-600 mt-1">Real-time vehicle monitoring</p>
        </div>
        {role === UserRole.CUSTOMER && vehicles.length > 0 && (
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {vehicles.map(v => (
              <option key={v.vin} value={v.vin}>
                {v.make} {v.model} ({v.vin})
              </option>
            ))}
          </select>
        )}
      </div>

      {!currentData ? (
        <div className="card text-center py-12">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No telemetry data</h3>
          <p className="text-gray-600">Select a vehicle to view telemetry data</p>
        </div>
      ) : (
        <>
          {/* Live Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Speed</span>
                <Gauge className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{currentData.speed_kmph}</p>
              <p className="text-sm text-gray-500 mt-1">km/h</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">RPM</span>
                <Activity className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{currentData.rpm}</p>
              <p className="text-sm text-gray-500 mt-1">revolutions/min</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Engine Temp</span>
                <Thermometer className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{currentData.engine_temp_c}°</p>
              <p className="text-sm text-gray-500 mt-1">Celsius</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Fuel Level</span>
                <Fuel className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{currentData.fuel_level_percent}%</p>
              <p className="text-sm text-gray-500 mt-1">remaining</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Coolant Temp</span>
                <Thermometer className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentData.coolant_temp_c}°C</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Battery Voltage</span>
                <Battery className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentData.battery_voltage_v}V</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Brake Wear</span>
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentData.brake_wear_percent}%</p>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            </div>
            <div className="flex space-x-6">
              <div>
                <span className="text-sm text-gray-600">Latitude</span>
                <p className="text-lg font-medium text-gray-900">{currentData.latitude}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Longitude</span>
                <p className="text-lg font-medium text-gray-900">{currentData.longitude}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Engine Status</span>
                <p className="text-lg font-medium text-gray-900">{currentData.engine_status}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="speed" stroke="#0ea5e9" name="Speed (km/h)" />
                  <Line type="monotone" dataKey="rpm" stroke="#10b981" name="RPM" />
                  <Line type="monotone" dataKey="engineTemp" stroke="#ef4444" name="Engine Temp (°C)" />
                  <Line type="monotone" dataKey="coolantTemp" stroke="#3b82f6" name="Coolant Temp (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Telemetry;


