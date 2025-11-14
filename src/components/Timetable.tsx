import React from 'react';
import type { TimetableData, TimetableSlot } from '../types';

interface TimetableProps {
    timetable: TimetableData;
    days: string[];
    periods: number[];
}

const TimetableSlotCard: React.FC<{ slot: TimetableSlot }> = React.memo(({ slot }) => {
    const isFree = !slot.teacher;

    const baseClasses = "p-3 rounded-lg h-full flex flex-col justify-between text-xs md:text-sm transition-transform duration-200 hover:scale-105";
    const colorClasses = slot.isSubstitute 
        ? "bg-amber-100 text-amber-800 border-l-4 border-amber-500"
        : isFree
            ? "bg-gray-100 text-gray-500"
            : "bg-indigo-100 text-indigo-800";

    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            <div>
                <p className="font-bold">{slot.subject}</p>
                <p>{slot.class}</p>
            </div>
            {slot.teacher && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold">{slot.teacher}</p>
                    {slot.isSubstitute && slot.originalTeacher && (
                        <p className="text-xs italic text-amber-600">(for {slot.originalTeacher})</p>
                    )}
                </div>
            )}
        </div>
    );
});


const Timetable: React.FC<TimetableProps> = ({ timetable, days, periods }) => {
    return (
        <div className="overflow-x-auto">
            <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(120px, 1fr))` }}>
                {/* Header Row */}
                <div className="font-bold text-center p-2 sticky left-0 z-10 bg-white/80 backdrop-blur-sm"></div>
                {days.map(day => (
                    <div key={day} className="font-bold text-center p-2 text-brand-dark sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
                        {day}
                    </div>
                ))}

                {/* Data Rows */}
                {periods.map(period => (
                    <React.Fragment key={period}>
                        <div className="font-bold text-center p-2 text-brand-dark sticky left-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            P{period}
                        </div>
                        {days.map(day => (
                            <div key={`${day}-${period}`} className="p-1">
                                <TimetableSlotCard slot={timetable[day][period - 1]} />
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default React.memo(Timetable);
