
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-100 text-gray-600 text-sm text-center py-4 mt-8 border-t">
            <div className="container mx-auto px-4">
                <p>
                    <strong>Intelligent Timetable Management System</strong> | A Project by Group 24 (Academic Year: 2025-26)
                </p>
                <p className="mt-1">
                    Mohammed Waqas, Ravikumar, Sachidananda, Sairaj Serigara
                </p>
                <p className="mt-2 text-xs text-gray-500">
                    Department of Computer Science and Engineering, SMVITM, Bantakal
                </p>
            </div>
        </footer>
    );
};

export default Footer;
