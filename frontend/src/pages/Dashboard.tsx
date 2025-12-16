
import { UserRole } from '../types';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import ServiceDashboard from '../components/dashboard/ServiceDashboard';
import OEMDashboard from '../components/dashboard/OEMDashboard';

interface DashboardProps {
  role: UserRole;
  userId: string;
  serviceCentreId: string;
}

const Dashboard = ({ role, userId, serviceCentreId }: DashboardProps) => {
  if (role === UserRole.CUSTOMER) {
    return <CustomerDashboard userId={userId} />;
  }

  if (role === UserRole.SERVICE_CENTER) {
    return <ServiceDashboard serviceCentreId={serviceCentreId} />;
  }

  if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
    return <OEMDashboard />;
  }

  return <div>Unknown Role</div>;
};

export default Dashboard;


