
import { useState, useEffect } from 'react';
import {
    Bell,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    MessageSquare,
    Phone
} from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface Notification {
    _id?: string;
    category: string;
    message: string;
    status: 'SENT' | 'FAILED' | 'QUEUED';
    channel: 'SMS' | 'VOICE' | 'SYSTEM';
    timestamp: string;
    failure_reason?: string;
}

const NotificationsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { role, userId, serviceCentreId } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');

    useEffect(() => {
        if (!isOpen) return;

        const fetchNotifications = async () => {
            try {
                let res;
                if (role === UserRole.CUSTOMER) {
                    res = await notificationsApi.getUserNotifications(userId!, role);
                } else if (role === UserRole.SERVICE_CENTER) {
                    res = await notificationsApi.getServiceCentreNotifications(serviceCentreId!, role);
                } else if (role === UserRole.OEM_ADMIN || role === UserRole.OEM_ANALYST) {
                    res = await notificationsApi.getAllOEMNotifications(role);
                }

                if (res && res.data) {
                    setNotifications(res.data);
                }
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };

        fetchNotifications();
        // Auto-refresh every 5s for tracking delivery status
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [isOpen, role, userId, serviceCentreId]);

    const filtered = notifications.filter(n => {
        if (filter === 'ALL') return true;
        return n.status === filter;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-700 mr-2" />
                    <h2 className="font-semibold text-gray-900">Notifications</h2>
                    <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                        {notifications.length}
                    </span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="p-3 border-b border-gray-100 flex space-x-2 overflow-x-auto">
                {['ALL', 'SENT', 'FAILED'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="overflow-y-auto h-[calc(100vh-8rem)] p-4 space-y-4">
                {filtered.map((n, idx) => (
                    <div key={idx} className="bg-white border boundary-gray-200 p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${n.category === 'SECURITY' ? 'bg-red-100 text-red-800' :
                                    n.category === 'ALERT' ? 'bg-orange-100 text-orange-800' :
                                        'bg-blue-100 text-blue-800'
                                }`}>
                                {n.category}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center">
                                {new Date(n.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800 mt-2">{n.message}</p>

                        <div className="mt-3 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                                {n.channel === 'SMS' ? <MessageSquare className="h-3 w-3 text-gray-400" /> :
                                    n.channel === 'VOICE' ? <Phone className="h-3 w-3 text-gray-400" /> :
                                        <Bell className="h-3 w-3 text-gray-400" />}
                                <span className="text-gray-500">{n.channel}</span>
                            </div>

                            <div className="flex items-center">
                                {n.status === 'SENT' && <CheckCircle className="h-3 w-3 text-green-500 mr-1" />}
                                {n.status === 'FAILED' && <AlertCircle className="h-3 w-3 text-red-500 mr-1" />}
                                {n.status === 'QUEUED' && <Clock className="h-3 w-3 text-yellow-500 mr-1" />}
                                <span className={`${n.status === 'SENT' ? 'text-green-600' :
                                        n.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                                    } font-medium`}>
                                    {n.status}
                                </span>
                            </div>
                        </div>
                        {n.status === 'FAILED' && n.failure_reason && (
                            <div className="mt-2 text-xs bg-red-50 text-red-600 p-1.5 rounded">
                                Error: {n.failure_reason}
                            </div>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        No notifications found
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
