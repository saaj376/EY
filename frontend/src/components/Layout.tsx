
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  AlertTriangle,
  Activity,
  Wrench,
  FileText,
  ClipboardCheck,
  BarChart3,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import NotificationsPanel from './NotificationsPanel';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userId, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const currentRole = role || UserRole.CUSTOMER;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN, UserRole.OEM_ANALYST] },
    { path: '/vehicles', label: 'Vehicles', icon: Car, roles: [UserRole.CUSTOMER, UserRole.OEM_ADMIN] },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle, roles: [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN, UserRole.OEM_ANALYST] },
    { path: '/telemetry', label: 'Telemetry', icon: Activity, roles: [UserRole.CUSTOMER, UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN, UserRole.OEM_ANALYST] },
    { path: '/service', label: 'Service', icon: Wrench, roles: [UserRole.CUSTOMER, UserRole.SERVICE_CENTER] },
    { path: '/rca', label: 'RCA', icon: FileText, roles: [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST] },
    { path: '/capa', label: 'CAPA', icon: ClipboardCheck, roles: [UserRole.SERVICE_CENTER, UserRole.OEM_ADMIN] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: [UserRole.OEM_ADMIN, UserRole.OEM_ANALYST] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Notifications Panel */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Intelligence Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                <User className="h-4 w-4" />
                <span className="font-medium">{userId || 'User'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-primary-50 px-3 py-2 rounded-lg">
                <span className="font-medium text-primary-700">
                  {currentRole.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

