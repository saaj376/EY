import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types';
import { setAuthRole } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole | null;
  userId: string | null;
  serviceCentreId: string | null;
  login: (role: UserRole, userId: string, serviceCentreId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [serviceCentreId, setServiceCentreId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        const { role, userId, serviceCentreId } = JSON.parse(savedAuth);
        setRole(role);
        setUserId(userId);
        setServiceCentreId(serviceCentreId);
        setIsAuthenticated(true);
        setAuthRole(role);
      } catch (error) {
        console.error('Error loading auth from localStorage:', error);
        localStorage.removeItem('auth');
      }
    }
  }, []);

  const login = (newRole: UserRole, newUserId: string, newServiceCentreId?: string) => {
    setRole(newRole);
    setUserId(newUserId);
    setServiceCentreId(newServiceCentreId || null);
    setIsAuthenticated(true);
    setAuthRole(newRole);
    
    // Save to localStorage
    localStorage.setItem('auth', JSON.stringify({
      role: newRole,
      userId: newUserId,
      serviceCentreId: newServiceCentreId || null,
    }));
  };

  const logout = () => {
    setRole(null);
    setUserId(null);
    setServiceCentreId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        userId,
        serviceCentreId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


