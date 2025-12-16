
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  Gauge,
  Thermometer,
  Battery,
  Fuel,
  Play,
  Square,
  AlertCircle
} from "lucide-react";
import { UserRole } from "../types";
import { userApi } from "../services/api";
import type { Telemetry, Vehicle } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface TelemetryProps {
  role: UserRole;
  userId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Telemetry = ({ role, userId }: TelemetryProps) => {
  const { vehicleId } = useParams<{ vehicleId?: string }>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(
    vehicleId || ""
  );
  const [currentData, setCurrentData] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [connected, setConnected] = useState(false);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch available vehicles
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
          console.error("Error fetching vehicles:", error);
        }
      } else if (!selectedVehicle) {
        // Default for other roles if not passed in URL
        setSelectedVehicle("DEMO-VEHICLE-001");
      }
    };

    fetchVehicles();
  }, [role, userId, selectedVehicle]);

  // 2. WebSocket Connection
  useEffect(() => {
    if (!selectedVehicle) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }



    // Construct WS URL
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${wsHost}/ws/telemetry/${selectedVehicle}?user_id=${userId}`;

    console.log("Connecting to WS:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS Connected");
      setConnected(true);

    };

    ws.onmessage = (event) => {
      try {
        const data: Telemetry = JSON.parse(event.data);
        setCurrentData(data);
        setHistory(prev => {
          const newHistory = [data, ...prev].slice(0, 50); // Keep last 50 points
          return newHistory;
        });
      } catch (e) {
        console.error("Error parsing WS message", e);
      }
    };

    ws.onclose = () => {
      console.log("WS Disconnected");
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WS Error", err);

    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedVehicle, userId]);

  const handleToggleSimulator = async () => {
    setSimulatorLoading(true);
    try {
      const vehicleId = selectedVehicle || "DEMO-VEHICLE-001";
      const encodedVehicleId = encodeURIComponent(vehicleId);

      const headers = {
        "Content-Type": "application/json",
        "X-Role": role
      };

      if (simulatorRunning) {
        const response = await fetch(`${API_BASE_URL}/simulator/stop/${encodedVehicleId}`, { method: "POST", headers });
        if (response.ok) {
          setSimulatorRunning(false);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/simulator/start/${encodedVehicleId}`, { method: "POST", headers });
        if (response.ok) {
          setSimulatorRunning(true);
        }
      }
    } catch (error) {
      console.error("Error toggling simulator:", error);
    } finally {
      setSimulatorLoading(false);
    }
  };

  const chartData = history
    .slice()
    .reverse()
    .map((t) => ({
      time: format(new Date(t.timestamp), "HH:mm:ss"),
      speed: t.speed_kmph,
      rpm: t.rpm,
      engineTemp: t.engine_temp_c,
      coolantTemp: t.coolant_temp_c,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Live Telemetry
            {connected ? (
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Connected
              </span>
            ) : (
              <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Disconnected
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">Real-time vehicle data streaming via WebSocket</p>
        </div>

        <div className="flex items-center space-x-4">
          {role === UserRole.CUSTOMER && vehicles.length > 0 && (
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {vehicles.map((v) => (
                <option key={v.vin} value={v.vin}>
                  {v.make} {v.model} ({v.vin})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleToggleSimulator}
            disabled={simulatorLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${simulatorRunning
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50 shadow-sm`}
          >
            {simulatorRunning ? (
              <>
                <Square className="h-4 w-4" />
                <span>Stop Engine</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!currentData ? (
        <div className="card text-center py-16 bg-gray-50 border-dashed border-2 border-gray-200">
          <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No live signal
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            Vehicle is currently offline or simulator is stopped. Click
            <span className="font-bold text-green-600 mx-1">Start Engine</span>
            to begin the demo.
          </p>
        </div>
      ) : (
        <>
          {/* Main Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-white to-blue-50 border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Speed</span>
                <Gauge className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">
                {currentData.speed_kmph}
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium uppercase tracking-wide">km/h</p>
            </div>

            <div className="card bg-gradient-to-br from-white to-emerald-50 border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">RPM</span>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">
                {currentData.rpm}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium uppercase tracking-wide">rev/min</p>
            </div>

            <div className="card bg-gradient-to-br from-white to-red-50 border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Engine Temp</span>
                <Thermometer className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">
                {currentData.engine_temp_c}°
              </p>
              <p className="text-xs text-red-600 mt-1 font-medium uppercase tracking-wide">Celsius</p>
            </div>

            <div className="card bg-gradient-to-br from-white to-amber-50 border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Fuel Level</span>
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">
                {currentData.fuel_level_percent}%
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium uppercase tracking-wide">Tank</p>
            </div>
          </div>

          {/* Secondary Stats & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card space-y-6">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Vehicle Health</h3>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Battery className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Battery</span>
                </div>
                <span className="font-mono font-medium">{currentData.battery_voltage_v} V</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Coolant</span>
                </div>
                <span className="font-mono font-medium">{currentData.coolant_temp_c}°C</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Brake Wear</span>
                </div>
                <span className="font-mono font-medium">{currentData.brake_wear_percent}%</span>
              </div>
            </div>

            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Live Feed</h3>
                <span className="text-xs text-gray-400 animate-pulse">● Recieving data</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} width={40} fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Speed"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rpm"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="RPM"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Telemetry;
