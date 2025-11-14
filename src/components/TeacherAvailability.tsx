
import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, TimetableData, TimetableSlot, User } from '../types';
import EditSlotModal from './EditSlotModal';

interface TeacherAvailabilityProps {
    teachers: Teacher[];
    timetable: TimetableData;
    days: string[];
    periods: number[];
    onUpdateSlot: (day: string, period: number, newSlotData: Partial<TimetableSlot>) => void;
    allSubjects: string[];
    canEdit: boolean;
    currentUser: User;
}

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);


const AvailabilitySlot: React.FC<{ slot: TimetableSlot; isEditMode: boolean; onClick: () => void; }> = ({ slot, isEditMode, onClick }) => {
    const isFree = slot.subject === 'Free Period';
    
    let baseClasses = "p-3 rounded-lg h-full flex flex-col justify-center items-center text-center text-xs md:text-sm transition-all duration-200 relative";
    if (isEditMode) {
        baseClasses += " cursor-pointer hover:scale-105 hover:ring-2 hover:ring-brand-primary";
    }

    const colorClasses = isFree 
        ? "bg-emerald-100 text-emerald-800"
        : "bg-sky-100 text-sky-800";

    return (
        <div className={`${baseClasses} ${colorClasses}`} onClick={isEditMode ? onClick : undefined}>
            <p className="font-bold">{slot.subject}</p>
            {!isFree && <p>{slot.class}</p>}
            {isEditMode && 
                <span className="absolute top-1 right-1 text-gray-500/70">
                    <EditIcon className="w-4 h-4" />
                </span>
            }
        </div>
    );
};

const TeacherAvailability: React.FC<TeacherAvailabilityProps> = ({ teachers, timetable, days, periods, onUpdateSlot, allSubjects, canEdit, currentUser }) => {
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('All');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingSlotInfo, setEditingSlotInfo] = useState<{ day: string; period: number; slot: TimetableSlot } | null>(null);

     useEffect(() => {
        if (currentUser.role === 'Teacher') {
            setSelectedTeacher(currentUser.name);
        } else {
            // Pre-select the first teacher for other roles for a better initial view
            if(teachers && teachers.length > 0) {
                setSelectedTeacher(teachers[0].name);
            }
        }
    }, [currentUser, teachers]);

    const filteredTeachers = useMemo(() => {
        if (!searchTerm) {
            return teachers;
        }
        return teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, teachers]);

    const teacherSchedule = useMemo(() => {
        if (!selectedTeacher || !timetable) return null;
        
        const schedule: TimetableData = {};
        days.forEach(day => {
            schedule[day] = periods.map((_, periodIndex) => {
                const originalSlot = timetable[day]?.[periodIndex];
                if (originalSlot?.teacher === selectedTeacher) {
                    return originalSlot;
                }
                return { class: 'N/A', subject: 'Free Period', teacher: null };
            });
        });
        return schedule;
    }, [selectedTeacher, timetable, days, periods]);

    const handleSaveSlot = (day: string, period: number, updatedSlot: Partial<TimetableSlot>) => {
        onUpdateSlot(day, period, updatedSlot);
        setEditingSlotInfo(null);
    };

    const daysToDisplay = selectedDay === 'All' ? days : [selectedDay];

    return (
        <div>
            {editingSlotInfo && (
                <EditSlotModal 
                    slotInfo={editingSlotInfo}
                    onSave={handleSaveSlot}
                    onClose={() => setEditingSlotInfo(null)}
                    teacherName={selectedTeacher}
                    allSubjects={allSubjects}
                />
            )}
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-brand-dark border-b-2 border-brand-secondary pb-2">
                    Teacher Availability
                </h2>
                 {selectedTeacher && canEdit && (
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${isEditMode ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-brand-primary text-white hover:bg-indigo-700'}`}
                    >
                        {isEditMode ? 'Finish Editing' : 'Edit Schedule'}
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-4 items-center mb-6 bg-gray-50 p-4 rounded-lg">
                {currentUser.role !== 'Teacher' && (
                     <>
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="teacher-search" className="block text-sm font-medium text-gray-700">
                                Search Teacher
                            </label>
                            <input
                                type="text"
                                id="teacher-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                                placeholder="e.g., John Smith"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700">
                                Select Teacher ({filteredTeachers.length} found)
                            </label>
                            <select
                                id="teacher-filter"
                                value={selectedTeacher}
                                onChange={(e) => {setSelectedTeacher(e.target.value); setIsEditMode(false);}}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            >
                                <option value="" disabled>-- View Schedule For --</option>
                                {filteredTeachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                                ))}
                            </select>
                        </div>
                     </>
                )}

                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="day-filter" className="block text-sm font-medium text-gray-700">
                        Filter by Day
                    </label>
                    <select
                        id="day-filter"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                        disabled={!selectedTeacher}
                    >
                        <option value="All">All Week</option>
                        {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedTeacher ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                     {currentUser.role === 'Teacher' 
                        ? <p className="text-gray-500">Loading your schedule...</p>
                        : <p className="text-gray-500">Please select a teacher to view their weekly schedule.</p>
                     }
                </div>
            ) : teacherSchedule && (
                <div className="overflow-x-auto">
                    <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${daysToDisplay.length}, minmax(120px, 1fr))` }}>
                        <div className="font-bold text-center p-2"></div>
                        {daysToDisplay.map(day => (
                            <div key={day} className="font-bold text-center p-2 text-brand-dark sticky top-0 bg-white/80 backdrop-blur-sm">
                                {day}
                            </div>
                        ))}

                        {periods.map((period, periodIndex) => (
                            <React.Fragment key={period}>
                                <div className="font-bold text-center p-2 text-brand-dark sticky left-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                    P{period}
                                </div>
                                {daysToDisplay.map(day => (
                                    <div key={`${day}-${period}`} className="p-1">
                                        <AvailabilitySlot 
                                            slot={teacherSchedule[day][periodIndex]} 
                                            isEditMode={isEditMode}
                                            onClick={() => {
                                                if (isEditMode && canEdit) {
                                                    setEditingSlotInfo({ day, period, slot: teacherSchedule[day][periodIndex] });
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAvailability;
