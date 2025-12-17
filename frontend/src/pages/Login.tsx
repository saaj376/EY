import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, LogIn, User, Building2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [userId, setUserId] = useState('');
  const [serviceCentreId, setServiceCentreId] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleInfo = {
    [UserRole.CUSTOMER]: {
      label: 'Customer',
      icon: User,
      description: 'View your vehicles, alerts, and service bookings',
      placeholder: 'Enter your User ID (e.g., user123)',
    },
    [UserRole.SERVICE_CENTER]: {
      label: 'Service Center',
      icon: Building2,
      description: 'Manage service bookings, job cards, and CAPA items',
      placeholder: 'Enter your User ID',
      serviceCentrePlaceholder: 'Enter Service Centre ID (e.g., service001)',
    },
    [UserRole.OEM_ADMIN]: {
      label: 'OEM Admin',
      icon: Shield,
      description: 'Full platform access including RCA and analytics',
      placeholder: 'Enter your User ID',
    },
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const effectiveUserId = selectedRole === UserRole.SERVICE_CENTER
      ? `service_${serviceCentreId.trim().substring(0, 6)}` // Generate a dummy user ID for SC
      : userId.trim();

    if (selectedRole !== UserRole.SERVICE_CENTER && !userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    if (selectedRole === UserRole.SERVICE_CENTER && !serviceCentreId.trim()) {
      setError('Please enter a Service Centre ID');
      return;
    }

    // Login with the provided credentials
    login(
      selectedRole,
      effectiveUserId,
      selectedRole === UserRole.SERVICE_CENTER ? serviceCentreId.trim() : undefined
    );

    // Redirect to dashboard
    navigate('/dashboard');
  };

  const currentRoleInfo = roleInfo[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary-600 rounded-2xl shadow-xl">
              <Car className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-50 mb-2">
            Autosphere
          </h1>
          <p className="text-gray-300">Sign in to access your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(roleInfo).map(([role, info]) => {
                  const Icon = info.icon;
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role as UserRole);
                        setError('');
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                        : 'border-gray-700 hover:border-gray-300 bg-gray-800'
                        }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-200'
                        }`}>
                        {info.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {currentRoleInfo.description}
              </p>
            </div>

            {/* User ID Input (Hidden for Service Center) */}
            {selectedRole !== UserRole.SERVICE_CENTER && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  User ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      setError('');
                    }}
                    placeholder={currentRoleInfo.placeholder}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Service Centre ID (only for Service Center role) */}
            {selectedRole === UserRole.SERVICE_CENTER && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Service Centre ID
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={serviceCentreId}
                    onChange={(e) => {
                      setServiceCentreId(e.target.value);
                      setError('');
                    }}
                    placeholder={(currentRoleInfo as any).serviceCentrePlaceholder}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center space-x-2 py-3 text-lg"
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              <strong>Demo Mode:</strong> Enter any User ID to continue.
              For Service Center, also enter a Service Centre ID.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2024 Autosphere. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;



