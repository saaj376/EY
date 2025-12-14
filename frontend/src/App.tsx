import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Alerts from './pages/Alerts';
import Telemetry from './pages/Telemetry';
import ServiceBooking from './pages/ServiceBooking';
import RCA from './pages/RCA';
import CAPA from './pages/CAPA';
import Analytics from './pages/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

const AppRoutes = () => {
  const { role, userId, serviceCentreId, isAuthenticated } = useAuth();

  // Ensure we have valid values
  const currentRole = role || UserRole.CUSTOMER;
  const currentUserId = userId || 'user123';
  const currentServiceCentreId = serviceCentreId || 'service001';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*" 
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route 
                  path="/" 
                  element={<Navigate to="/dashboard" replace />} 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <Dashboard 
                      role={currentRole} 
                      userId={currentUserId} 
                      serviceCentreId={currentServiceCentreId} 
                    />
                  } 
                />
                <Route 
                  path="/vehicles" 
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.OEM_ADMIN]}>
                      <Vehicles role={currentRole} userId={currentUserId} /> 
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/alerts" 
                  element={
                    <Alerts 
                      role={currentRole} 
                      userId={currentUserId} 
                      serviceCentreId={currentServiceCentreId} 
                    /> 
                  } 
                />
                <Route 
                  path="/telemetry/:vehicleId?" 
                  element={
                    <Telemetry role={currentRole} userId={currentUserId} /> 
                  } 
                />
                <Route 
                  path="/service" 
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.SERVICE_CENTER]}>
                      <ServiceBooking 
                        role={currentRole} 
                        userId={currentUserId} 
                        serviceCentreId={currentServiceCentreId} 
                      /> 
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rca" 
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.OEM_ADMIN, UserRole.OEM_ANALYST]}>
                      <RCA role={currentRole} /> 
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/capa" 
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN]}>
                      <CAPA role={currentRole} serviceCentreId={currentServiceCentreId} /> 
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.OEM_ADMIN, UserRole.OEM_ANALYST]}>
                      <Analytics role={currentRole} /> 
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

