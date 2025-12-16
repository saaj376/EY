import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { UserRole } from '../types';
import { analyticsApi } from '../services/api';
import type { Analytics as AnalyticsType } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsProps {
  role: UserRole;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = ({ role }: AnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsApi.getAnalytics(role);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [role]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-400">No analytics data available</div>;
  }

  const severityData = analytics.severity_distribution.map(item => ({
    name: item._id,
    value: item.count,
  }));

  const alertTrendData = analytics.alert_trend.map(item => ({
    date: item._id,
    alerts: item.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-50">Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">Platform performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Anomaly Rate</p>
              <p className="text-3xl font-semibold text-gray-50 mt-2" style={{ fontFamily: '"Space Mono", monospace' }}>
                {(analytics.anomaly_score_stats.anomaly_rate * 100).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="h-12 w-12 text-amber-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Alert Rate</p>
              <p className="text-3xl font-semibold text-gray-50 mt-2" style={{ fontFamily: '"Space Mono", monospace' }}>
                {(analytics.alert_rate * 100).toFixed(2)}%
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Mean Detection Time</p>
              <p className="text-3xl font-semibold text-gray-50 mt-2" style={{ fontFamily: '"Space Mono", monospace' }}>
                {Math.round(analytics.mean_time_to_detect / 1000)}s
              </p>
            </div>
            <Clock className="h-12 w-12 text-emerald-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">False Positive Rate</p>
              <p className="text-3xl font-semibold text-gray-50 mt-2" style={{ fontFamily: '"Space Mono", monospace' }}>
                {(analytics.false_positive_rate * 100).toFixed(1)}%
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* Anomaly Score Stats */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-50 mb-4">Anomaly Score Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Count</p>
            <p className="text-2xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>{analytics.anomaly_score_stats.count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Mean Score</p>
            <p className="text-2xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
              {analytics.anomaly_score_stats.mean_score.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Min Score</p>
            <p className="text-2xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
              {analytics.anomaly_score_stats.min_score.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Max Score</p>
            <p className="text-2xl font-semibold text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>
              {analytics.anomaly_score_stats.max_score.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Trend */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Alert Trend (7 Days)</h2>
          {alertTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={alertTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
                <Legend wrapperStyle={{ color: '#F3F4F6' }} />
                <Line type="monotone" dataKey="alerts" stroke="#0ea5e9" name="Alerts" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No trend data available</div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Severity Distribution</h2>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No severity data available</div>
          )}
        </div>
      </div>

      {/* RCA & CAPA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">RCA Closure Rate</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Total RCA</span>
                <span className="font-medium text-gray-50" style={{ fontFamily: '"Space Mono", monospace' }}>{analytics.rca_closure_rate.total_rca}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Closed RCA</span>
                <span className="font-medium text-emerald-400" style={{ fontFamily: '"Space Mono", monospace' }}>{analytics.rca_closure_rate.closed_rca}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${analytics.rca_closure_rate.closure_rate * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Closure Rate: <span style={{ fontFamily: '"Space Mono", monospace' }}>{(analytics.rca_closure_rate.closure_rate * 100).toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-50 mb-4">Overdue CAPA</h2>
          {analytics.overdue_capa.length > 0 ? (
            <div className="space-y-2">
              {analytics.overdue_capa.slice(0, 5).map((capa) => (
                <div key={capa.capa_id} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="font-medium text-gray-50">CAPA #{capa.capa_id.slice(-8)}</p>
                  <p className="text-sm text-gray-400">{capa.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
              <p>No overdue CAPA items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

