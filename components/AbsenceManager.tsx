

import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, TimetableData, User } from '../types';
import { daysOfWeek, periods } from '../data/mockData';
import LoadingSpinner from './LoadingSpinner';

interface AbsenceManagerProps {
    teachers: Teacher[];
    timetable: TimetableData;
    onReportAbsence: (teacherName: string, day: string, period: number) => void;
    isLoading: boolean;
    user: User;
}

const AbsenceManager: React.FC<AbsenceManagerProps> = ({ teachers, timetable, onReportAbsence, isLoading, user }) => {
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);
    const [selectedPeriod, setSelectedPeriod] = useState<number>(periods[0]);

    // If the user is a teacher, automatically select them.
    useEffect(() => {
        if (user.role === 'Teacher') {
            setSelectedTeacher(user.name);
        }
    }, [user]);

    const scheduledTeachers = useMemo(() => {
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
            onReportAbsence(selectedTeacher, selectedDay, selectedPeriod);
        }
    };
    
    const isTeacherRole = user.role === 'Teacher';

    return (
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-primary pb-2">
                 {isTeacherRole ? 'Report My Absence' : 'Manage Absence'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
                 {isTeacherRole
                    ? "Please report your absence below. Your HOD and Admin will be notified to arrange a substitute."
                    : user.role === 'HOD' 
                        ? `Report an absence for a teacher in the ${user.department} department.`
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

                <button
                    type="submit"
                    disabled={isLoading || !selectedTeacher}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isLoading ? <LoadingSpinner /> : (isTeacherRole ? 'Submit Absence Report' : 'Create Absence Report')}
                </button>
            </form>
        </div>
    );
};

export default AbsenceManager;