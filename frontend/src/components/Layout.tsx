import { ReactNode, useState, useCallback } from 'react'; // 👈 useState and useCallback are enough
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
  PanelLeftClose, 
  PanelLeftOpen, // 👈 New icon for opening the sidebar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import NotificationsPanel from './NotificationsPanel';

interface LayoutProps {
  children: ReactNode;
}

// Define widths
const COLLAPSED_WIDTH = 64; // w-16
const EXPANDED_WIDTH = 256; // w-64

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userId, logout } = useAuth();
  
  // -------------------- COLLAPSE/EXPAND LOGIC --------------------
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  // -------------------- END COLLAPSE/EXPAND LOGIC --------------------

  const currentRole = role || UserRole.CUSTOMER;

  // Format role for display
  const formatRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'Customer';
      case UserRole.SERVICE_CENTER:
        return 'Service Center';
      case UserRole.OEM_ADMIN:
        return 'OEM Admin';
      case UserRole.OEM_ANALYST:
        return 'OEM Analyst';
      default:
        return 'User';
    }
  };

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
  
  // Tailwind class based on state
  const sidebarWidthClass = isExpanded ? 'w-64' : 'w-20';
  const sidebarTransitionClass = 'transition-all duration-300 ease-in-out';
  const navItemTextClass = isExpanded ? 'opacity-100 ml-3' : 'opacity-0 absolute';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  VIP PLATFORM
                </span>
                <h1 className="text-sm font-medium text-gray-100">
                  Dashboards / <span className="text-gray-400">Overview</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end text-xs text-gray-400">
                <span className="uppercase tracking-[0.18em] text-gray-500">
                  {formatRole(currentRole)}
                </span>
                <span className="text-gray-500">ID: {userId || 'U-XXXX'}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-300" />
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="hidden md:flex items-center space-x-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
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
        <aside
          className={`${sidebarWidthClass} ${sidebarTransitionClass} bg-gray-950 border-r border-gray-800 min-h-[calc(100vh-4rem)] relative shrink-0 overflow-hidden`}
        >
          <nav className="px-3 py-4 space-y-1 text-sm">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-gray-800 text-blue-400 font-medium'
                      : 'text-gray-400 hover:bg-gray-800/60'
                  }`}
                  title={!isExpanded ? item.label : undefined} // Add tooltip when collapsed
                >
                  {/* Icon is always visible */}
                  <Icon className="h-5 w-5 shrink-0" />
                  
                  {/* Text hides/shows with animation */}
                  <span className={`${navItemTextClass} ${sidebarTransitionClass} whitespace-nowrap`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          
          {/* Collapse/Expand Button */}
          <button
            onClick={toggleSidebar}
            className={`absolute bottom-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-800 transition-colors`}
            title={isExpanded ? 'Collapse Menu' : 'Expand Menu'}
          >
            {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;