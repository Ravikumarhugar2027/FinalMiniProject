

import React, { useState, useMemo } from 'react';
import type { Notification } from '../types';

interface NotificationPanelProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onAcceptRequest?: (requestId: number) => void;
    onDeclineRequest?: (requestId: number) => void;
}

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const InformationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);



const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, setNotifications, onAcceptRequest, onDeclineRequest }) => {
    const [activeTypes, setActiveTypes] = useState<Notification['type'][]>(['success', 'error', 'info', 'action']);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

    const handleTypeToggle = (type: Notification['type']) => {
        setActiveTypes(prev => 
            prev.includes(type) 
            ? prev.filter(t => t !== type)
            : [...prev, type]
        );
    };

    const filteredAndSortedNotifications = useMemo(() => {
        return notifications
            .filter(n => activeTypes.includes(n.type))
            .sort((a, b) => {
                const timeA = a.timestamp.getTime();
                const timeB = b.timestamp.getTime();
                return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
            });
    }, [notifications, activeTypes, sortBy]);
    
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'error': return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
            case 'info': return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
            case 'action': return <QuestionMarkCircleIcon className="w-6 h-6 text-purple-500" />;
            default: return null;
        }
    };

    const typeFilters: { type: Notification['type'], label: string, classes: string }[] = [
        { type: 'success', label: 'Success', classes: 'bg-green-100 text-green-800 focus:ring-green-500' },
        { type: 'error', label: 'Errors', classes: 'bg-red-100 text-red-800 focus:ring-red-500' },
        { type: 'info', label: 'Info', classes: 'bg-blue-100 text-blue-800 focus:ring-blue-500' },
        { type: 'action', label: 'Actions', classes: 'bg-purple-100 text-purple-800 focus:ring-purple-500' },
    ];

    if (notifications.length === 0) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500 animate-fade-in">
                <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No new notifications.
            </div>
        );
    }

    return (
        <div className="animate-slide-in-down">
            <h3 className="text-lg font-semibold text-brand-dark mb-3">Notifications</h3>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                    {typeFilters.map(({ type, label, classes }) => (
                        <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${activeTypes.includes(type) ? classes : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex-grow"></div>
                <div className="flex items-center gap-2">
                    <label htmlFor="sort-notifications" className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select 
                        id="sort-notifications"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                        className="text-sm border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md py-1"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredAndSortedNotifications.length > 0 ? (
                     filteredAndSortedNotifications.slice(0, 15).map(notif => (
                        <div key={notif.id} className="bg-white p-3 rounded-lg shadow-md flex items-start space-x-3 transition-opacity duration-300 animate-fade-in">
                            <div className="flex-shrink-0">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{notif.message}</p>
                                <p className="text-xs text-gray-500 mb-2">{notif.timestamp.toLocaleString()}</p>
                                {notif.type === 'action' && notif.absenceRequestId && (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onAcceptRequest?.(notif.absenceRequestId!)}
                                            className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => onDeclineRequest?.(notif.absenceRequestId!)}
                                            className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">
                        No notifications match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;