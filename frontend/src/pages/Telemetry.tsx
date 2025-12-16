import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  Gauge,
  Thermometer,
  Battery,
  Fuel,
  MapPin,
} from "lucide-react";
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

import { UserRole } from "../types";
import { telemetryApi, userApi } from "../services/api";
import type { Telemetry, Vehicle } from "../types";

const MAX_POINTS = 30;

interface Props {
  role: UserRole;
  userId: string;
}

export default function TelemetryPage({ role, userId }: Props) {
  const { vehicleId } = useParams<{ vehicleId?: string }>();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId || "");
  const [liveTelemetry, setLiveTelemetry] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [connected, setConnected] = useState(false);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  const isAdvancedUser = role !== UserRole.CUSTOMER;

  // -------------------- Vehicles --------------------
  useEffect(() => {
    if (role !== UserRole.CUSTOMER) return;

    userApi.getVehicles(userId, role).then((res) => {
      setVehicles(res.data);
      if (!selectedVehicle && res.data.length > 0) {
        setSelectedVehicle(res.data[0].vin);
      }
    });
  }, [role, userId]);

  // -------------------- Telemetry --------------------
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
        const [liveRes, historyRes] = await Promise.all([
          telemetryApi.getLive(selectedVehicle, role).catch(() => null),
          telemetryApi.getHistory(selectedVehicle, MAX_POINTS, role),
        ]);

        if (liveRes) setLiveTelemetry(liveRes.data);
        if (historyRes?.data) setHistory(historyRes.data);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [selectedVehicle, role]);

  const current = liveTelemetry || history[0];

  const chartData = history
    .slice()
    .reverse()
    .map((t) => ({
      time: format(new Date(t.timestamp), "HH:mm:ss"),
      speed: t.speed_kmph,
      rpm: t.rpm,
      engineTemp: t.engine_temp_c,
    }));

  if (!current && loading) {
    return <div className="py-12 text-center text-gray-400">Loading telemetry…</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-50">Telemetry</h1>
          <p className="mt-1 text-sm text-gray-400">Real-time vehicle monitoring</p>
        </div>

        {role === UserRole.CUSTOMER && vehicles.length > 0 && (
          <select
            className="border border-gray-700 rounded-lg px-4 py-2 bg-gray-900 text-gray-100"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v.vin} value={v.vin}>
                {v.make} {v.model} ({v.vin})
              </option>
            ))}
          </select>
        )}
      </div>

      {!current ? (
        <div className="text-center py-12 text-gray-400">
          No telemetry data available
        </div>
      ) : (
        <>
          {/* Live Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Metric title="Speed" value={`${current.speed_kmph}`} unit="km/h" icon={<Gauge />} />
            <Metric title="RPM" value={`${current.rpm}`} unit="rpm" icon={<Activity />} />
            <Metric
              title="Engine Temp"
              value={`${current.engine_temp_c}`}
              unit="°C"
              icon={<Thermometer />}
              danger={current.engine_temp_c > 95}
            />
            <Metric title="Fuel" value={`${current.fuel_level_percent}`} unit="%" icon={<Fuel />} />
          </div>

          {/* Location */}
          <div className="card">
            <h3 className="font-medium mb-3 flex items-center gap-2 text-gray-50">
              <MapPin size={18} /> Location
            </h3>
            <p className="text-sm text-gray-400">
              {current.latitude}, {current.longitude} · Engine {current.engine_status}
            </p>
          </div>

          {/* ---------------- CHARTS ---------------- */}

          {/* CUSTOMER: single combined chart */}
          {!isAdvancedUser && (
            <div className="card">
              <h3 className="font-medium mb-4 text-gray-50">Recent Trends</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
                  <XAxis dataKey="time" label={{ value: "Time", position: "insideBottom", offset: -5 }} stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
                  <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                  <Line yAxisId="left" dataKey="speed" stroke="#2563eb" dot={false} name="Speed (km/h)" />
                  <Line yAxisId="left" dataKey="engineTemp" stroke="#dc2626" dot={false} name="Engine Temp (°C)" />
                  <Line yAxisId="right" dataKey="rpm" stroke="#16a34a" dot={false} name="RPM" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ADVANCED USERS: multiple charts */}
          {isAdvancedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart title="Speed (km/h)" dataKey="speed" color="#2563eb" data={chartData} />
              <SimpleChart title="RPM" dataKey="rpm" color="#16a34a" data={chartData} />
              <SimpleChart title="Engine Temp (°C)" dataKey="engineTemp" color="#dc2626" data={chartData} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Components ---------------- */

function Metric({ title, value, unit, icon, danger }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        {icon}
      </div>
      <div className={`text-3xl font-semibold tabular-nums text-gray-50 ${danger ? "text-red-400" : ""}`} style={{ fontFamily: '"Space Mono", monospace' }}>
        {value}
        <span className="text-sm ml-1 text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

function SimpleChart({ title, dataKey, color, data }: any) {
  return (
    <div className="card">
      <h3 className="font-medium mb-3 text-gray-50">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
          <Line dataKey={dataKey} stroke={color} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
