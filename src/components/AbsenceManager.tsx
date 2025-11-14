
import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, TimetableData, User } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface AbsenceManagerProps {
    teachers: Teacher[];
    timetable: TimetableData;
    onReportAbsence: (teacherName: string, day: string, period: number, reason: string) => void;
    onReportFullDay: (teacherName: string, day: string, reason: string) => Promise<void>;
    isLoading: boolean;
    isFullDayLoading: boolean;
    user: User;
    daysOfWeek: string[];
    periods: number[];
}

const AbsenceManager: React.FC<AbsenceManagerProps> = ({ teachers, timetable, onReportAbsence, onReportFullDay, isLoading, isFullDayLoading, user, daysOfWeek, periods }) => {
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>(periods[0]);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (user.role === 'Teacher') {
            setSelectedTeacher(user.name);
        }
    }, [user]);

    const scheduledTeachers = useMemo(() => {
        if (!timetable) return [];
        const teacherSet = new Set<string>();
        Object.keys(timetable).forEach(day => {
            timetable[day].forEach(slot => {
                if(slot.teacher) teacherSet.add(slot.teacher);
            });
        });
        return teachers.filter(t => teacherSet.has(t.name));
    }, [timetable, teachers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeacher && selectedDay && selectedPeriod) {
            onReportAbsence(selectedTeacher, selectedDay, selectedPeriod, reason);
            setReason('');
        }
    };
    
    const handleReportFullDayClick = async () => {
        if (!selectedTeacher) {
            alert('Please select a teacher first.');
            return;
        }
        if (!reason.trim()) {
            alert('Please provide a reason for the full-day absence.');
            return;
        }
        await onReportFullDay(selectedTeacher, selectedDay, reason);
        setReason('');
    };
    
    const isTeacherRole = user.role === 'Teacher';

    return (
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-primary pb-2">
                 {isTeacherRole ? 'Report My Absence' : 'Manage Absence'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
                 {isTeacherRole
                    ? "Report a single period absence or a full day's absence for the selected day."
                    : "Report a teacher's absence to initiate the substitution process."
                }
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isTeacherRole ? (
                     <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-700">Teacher</p>
                        <p className="font-semibold text-brand-dark">{user.name}</p>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="teacher" className="block text-sm font-medium text-gray-700">Absent Teacher</label>
                        <select
                            id="teacher"
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            required
                        >
                            <option value="" disabled>Select a teacher</option>
                            {scheduledTeachers.map(teacher => (
                                <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="day" className="block text-sm font-medium text-gray-700">Day</label>
                        <select
                            id="day"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            required
                        >
                            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="period" className="block text-sm font-medium text-gray-700">Period</label>
                        <select
                            id="period"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            required
                        >
                            {periods.map(p => <option key={p} value={p}>{`Period ${p}`}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="absence-reason" className="block text-sm font-medium text-gray-700">Reason (Optional for single period)</label>
                    <textarea
                        id="absence-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full text-sm border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md"
                        placeholder={isTeacherRole ? "Required for full-day absence." : "e.g., Personal emergency..."}
                    />
                </div>

                <div className="pt-2 space-y-3">
                    <button
                        type="submit"
                        disabled={isLoading || !selectedTeacher}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {isLoading ? <LoadingSpinner /> : (isTeacherRole ? 'Submit Single Period Absence' : 'Create Absence Report')}
                    </button>
                    <button
                        type="button"
                        onClick={handleReportFullDayClick}
                        disabled={isFullDayLoading || !selectedTeacher || !reason}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                            isTeacherRole ? 'text-white bg-brand-secondary hover:bg-emerald-700' : 'text-brand-primary bg-indigo-50 hover:bg-indigo-100'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200`}
                    >
                        {isFullDayLoading ? <LoadingSpinner /> : isTeacherRole ? `Report my absence for entire ${selectedDay}` : `Report ${selectedTeacher || 'teacher'} absent for entire ${selectedDay}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AbsenceManager;
