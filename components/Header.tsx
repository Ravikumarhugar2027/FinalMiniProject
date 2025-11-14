

import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
        <header className="bg-brand-primary text-white shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <CalendarIcon />
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                        Intelligent Timetable System
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs opacity-80">{user.role}</p>
                    </div>
                     <UserIcon className="h-8 w-8 sm:hidden" />
                    <button 
                        onClick={onLogout}
                        className="px-3 py-2 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;