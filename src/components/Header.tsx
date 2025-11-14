
import React from 'react';
import type { User } from '../types';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

const SmvitmLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50,5 A45,45 0 1,1 49.9,5 Z" fill="#ffffff" stroke="#FFD700" strokeWidth="3"/>
        <path d="M50,15 A35,35 0 1,1 49.9,15 Z" fill="#4f46e5" />
        <path d="M50,25 v50 M25,50 h50" stroke="#ffffff" strokeWidth="4" strokeLinecap="round"/>
        <text x="50" y="88" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#4f46e5" textAnchor="middle">
            SMVITM
        </text>
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
            <div className="container mx-auto px-4 md:px-8 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <SmvitmLogo />
                     <div>
                         <h1 className="text-sm md:text-xl font-bold tracking-tight">
                            Shri Madhwa Vadiraja Institute of Technology and Management
                        </h1>
                        <p className="text-xs opacity-80 hidden md:block">Intelligent Timetable System</p>
                    </div>
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
                        aria-label="Logout"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
