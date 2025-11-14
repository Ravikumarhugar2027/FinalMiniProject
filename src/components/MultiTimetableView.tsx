
import React from 'react';
import Timetable from './Timetable';
import type { TimetableData } from '../types';

interface MultiTimetableViewProps {
    timetables: { [sectionName: string]: TimetableData };
    days: string[];
    periods: number[];
}

const MultiTimetableView: React.FC<MultiTimetableViewProps> = ({ timetables, days, periods }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in space-y-8">
            {Object.entries(timetables).map(([sectionName, timetableData]) => (
                <div key={sectionName}>
                    <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-primary pb-2">
                        {sectionName}
                    </h2>
                    <Timetable timetable={timetableData} days={days} periods={periods} />
                </div>
            ))}
        </div>
    );
};

export default MultiTimetableView;
