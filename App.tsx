

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { TimetableData, Teacher, Notification, TimetableSlot, User, AbsenceRequest } from './types';
import { apiLogin, apiGetInitialData, apiUpdateTimetable, apiCreateAbsenceRequest, apiUpdateAbsenceRequest } from './services/geminiService';
import Timetable from './components/Timetable';
import AbsenceManager from './components/AbsenceManager';
import NotificationPanel from './components/NotificationPanel';
import Header from './components/Header';
import TeacherAvailability from './components/TeacherAvailability';
import Login from './components/Login';
import AbsenceDashboard from './components/AbsenceDashboard';

const App: React.FC = () => {
    const [timetable, setTimetable] = useState<TimetableData | null>(null);
    const [teachers, setTeachers] = useState<Teacher[] | null>(null);
    const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
    const [periods, setPeriods] = useState<number[]>([]);
    const [subjectToDepartment, setSubjectToDepartment] = useState<{ [subject: string]: string }>({});
    const [departmentHODs, setDepartmentHODs] = useState<{ [department: string]: string }>({});
    const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
    const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await apiGetInitialData();
                setTimetable(data.timetable);
                setTeachers(data.teachers);
                setDaysOfWeek(data.daysOfWeek);
                setPeriods(data.periods);
                setSubjectToDepartment(data.subjectToDepartment);
                setDepartmentHODs(data.departmentHODs);
                setUniqueSubjects(data.uniqueSubjects);
                setAbsenceRequests(data.absenceRequests);
            } catch (err) {
                setError("Failed to load application data. Please try refreshing the page.");
            } finally {
                setIsAppLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleLogin = async (email: string, pass: string): Promise<boolean> => {
        const user = await apiLogin(email, pass);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const addNotification = useCallback((message: string, type: Notification['type'], absenceRequestId?: number) => {
        const newNotification: Notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            absenceRequestId,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const handleReportAbsence = async (absentTeacherName: string, day: string, period: number) => {
        setIsLoading(true);
        setError(null);

        if (!teachers || !timetable) {
            setError('Application data is not loaded correctly.');
            addNotification('Error: Application data is not loaded correctly.', 'error');
            setIsLoading(false);
            return;
        }

        const absentTeacher = teachers.find(t => t.name === absentTeacherName);
        if (!absentTeacher) {
            setError('Selected teacher not found.');
            setIsLoading(false);
            return;
        }

        const originalSlot = timetable[day][period - 1];
        if (originalSlot.teacher !== absentTeacherName) {
            setError(`${absentTeacherName} does not have a class at the selected time.`);
            addNotification(`Error: ${absentTeacherName} does not have a class at the selected time.`, 'error');
            setIsLoading(false);
            return;
        }

        try {
            const newRequestData = {
                absentTeacherId: absentTeacher.id,
                absentTeacherName,
                day,
                period,
                slot: originalSlot
            };
            const createdRequest = await apiCreateAbsenceRequest(newRequestData);
            setAbsenceRequests(prev => [...prev, createdRequest]);
            
            addNotification(`Absence for ${absentTeacherName} on ${day}, Period ${period} has been reported successfully.`, 'success');
            
            const department = subjectToDepartment[originalSlot.subject];
            const hodName = department ? departmentHODs[department] : null;
            addNotification(`HOD Alert (${hodName || 'Admin'}): ${absentTeacherName} reported absent for ${day}, P${period}. Action required.`, 'info');

        } catch (err: any) {
            setError(err.message || 'Failed to report absence.');
            addNotification(`Error: ${err.message || 'Failed to report absence.'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRequestSubstitute = async (requestId: number, substituteTeacherId: number) => {
        const substituteTeacher = teachers?.find(t => t.id === substituteTeacherId);
        if(!substituteTeacher) return;
        
        const updatedRequest = await apiUpdateAbsenceRequest(requestId, {
            status: 'PENDING_SUBSTITUTE_RESPONSE',
            requestedSubstituteTeacherId: substituteTeacherId,
            requestedSubstituteTeacherName: substituteTeacher.name
        });
        setAbsenceRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));

        addNotification(`Request sent to ${substituteTeacher.name} to substitute.`, 'info');
        // This notification is for the substitute teacher
        addNotification(`You have a request to substitute for ${updatedRequest.absentTeacherName} on ${updatedRequest.day}, P${updatedRequest.period}.`, 'action', requestId);
    };

    const handleRespondToSubstitution = async (requestId: number, response: 'accept' | 'decline') => {
        const request = absenceRequests.find(r => r.id === requestId);
        if (!request) return;
    
        // Prevent re-processing if already handled (e.g., due to double-click)
        if (request.status !== 'PENDING_SUBSTITUTE_RESPONSE') {
            // Clean up any lingering action notifications just in case
            setNotifications(prev => prev.filter(n => !(n.absenceRequestId === requestId && n.type === 'action')));
            return;
        }
    
        const newStatus = response === 'accept' ? 'SUBSTITUTE_ACCEPTED' : 'SUBSTITUTE_DECLINED';
        const updatedRequest = await apiUpdateAbsenceRequest(requestId, { status: newStatus });
        
        setAbsenceRequests(prevRequests => prevRequests.map(r => r.id === requestId ? updatedRequest : r));
        
        // Create the result notification first
        const resultMessage = response === 'accept'
            ? `${request.requestedSubstituteTeacherName} ACCEPTED the substitution request. Ready for final assignment.`
            : `${request.requestedSubstituteTeacherName} DECLINED the substitution request. Please find another substitute.`;
    
        const resultNotification: Notification = {
            id: Date.now(),
            message: resultMessage,
            type: response === 'accept' ? 'success' : 'error',
            timestamp: new Date(),
        };
    
        // Atomically update notifications state: remove action, add result
        setNotifications(prevNotifications => [
            resultNotification,
            ...prevNotifications.filter(n => !(n.absenceRequestId === requestId && n.type === 'action'))
        ]);
    };
    
    const handleAssignSubstitute = async (requestId: number) => {
        const request = absenceRequests.find(r => r.id === requestId);
        if(!request || !timetable || !request.requestedSubstituteTeacherName) return;
        
        const { day, period, absentTeacherName, requestedSubstituteTeacherName, slot } = request;

        const newTimetable: TimetableData = JSON.parse(JSON.stringify(timetable));
        const updatedSlot: TimetableSlot = { ...newTimetable[day][period - 1], teacher: requestedSubstituteTeacherName, isSubstitute: true, originalTeacher: absentTeacherName };
        newTimetable[day][period - 1] = updatedSlot;

        const updatedTimetableFromDB = await apiUpdateTimetable(newTimetable);
        setTimetable(updatedTimetableFromDB);

        const updatedRequest = await apiUpdateAbsenceRequest(requestId, { status: 'ASSIGNED', assignedSubstituteTeacherName: requestedSubstituteTeacherName });
        setAbsenceRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));

        addNotification(`Success! ${requestedSubstituteTeacherName} assigned to substitute for ${absentTeacherName}.`, 'success');
        addNotification(`Students of Class ${slot.class} have been notified.`, 'info');
        addNotification(`Faculty member ${requestedSubstituteTeacherName} has been notified of assignment.`, 'info');
        addNotification(`Absent teacher ${absentTeacherName} has been notified of their substitute.`, 'info');
    };

    const handleUpdateTimetableSlot = useCallback(async (day: string, period: number, newSlotData: Partial<TimetableSlot>) => {
        if (!timetable) return;
        
        const newTimetable = JSON.parse(JSON.stringify(timetable));
        const currentSlot = newTimetable[day][period - 1];
        newTimetable[day][period - 1] = { ...currentSlot, ...newSlotData, isSubstitute: false, originalTeacher: undefined };
        
        const updatedTimetableFromDB = await apiUpdateTimetable(newTimetable);
        setTimetable(updatedTimetableFromDB);
        
        addNotification(`Timetable for ${day}, Period ${period} updated successfully.`, 'success');
    }, [timetable, addNotification]);

    const teachersForHOD = useMemo(() => {
        if (currentUser?.role !== 'HOD' || !currentUser.department || !teachers) return [];
        
        const departmentSubjects = Object.keys(subjectToDepartment).filter(
            subject => subjectToDepartment[subject] === currentUser.department
        );

        return teachers.filter(teacher => 
            teacher.subjects.some(subject => departmentSubjects.includes(subject))
        );
    }, [currentUser, teachers, subjectToDepartment]);
    
    if (isAppLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="flex items-center space-x-3 text-brand-primary">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xl font-semibold">Loading Timetable System...</span>
                </div>
            </div>
        );
    }
    
    if (error && !timetable) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-red-50 p-8 text-center">
                <p className="text-red-700 font-semibold">{error}</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    const canManageAbsence = currentUser.role === 'Admin' || currentUser.role === 'HOD' || currentUser.role === 'Teacher';
    const canManageDashboard = currentUser.role === 'Admin' || currentUser.role === 'HOD';
    const canEditSchedule = currentUser.role === 'Admin';
    const canViewAvailability = currentUser.role === 'Admin' || currentUser.role === 'HOD' || currentUser.role === 'Teacher';


    return (
        <div className="min-h-screen bg-gray-50 text-brand-dark font-sans">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="container mx-auto p-4 md:p-8 space-y-8">
                <NotificationPanel 
                    notifications={notifications} 
                    setNotifications={setNotifications}
                    onAcceptRequest={(id) => handleRespondToSubstitution(id, 'accept')}
                    onDeclineRequest={(id) => handleRespondToSubstitution(id, 'decline')}
                />
                
                <div className={`grid grid-cols-1 ${canManageAbsence ? 'lg:grid-cols-3' : ''} gap-8 items-start`}>
                    {canManageAbsence && (
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg animate-fade-in">
                            <AbsenceManager 
                                teachers={currentUser.role === 'HOD' ? teachersForHOD : (teachers || [])} 
                                onReportAbsence={handleReportAbsence} 
                                isLoading={isLoading}
                                timetable={timetable!}
                                user={currentUser}
                            />
                             {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                        </div>
                    )}

                    <div className={canManageAbsence ? "lg:col-span-2" : "col-span-1"}>
                         <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-primary pb-2">
                                Live Timetable
                            </h2>
                            {timetable && <Timetable timetable={timetable} days={daysOfWeek} periods={periods} />}
                        </div>
                    </div>
                </div>

                {canManageDashboard && (
                    <AbsenceDashboard 
                        requests={absenceRequests}
                        teachers={teachers || []}
                        timetable={timetable!}
                        currentUser={currentUser}
                        onRequestSubstitute={handleRequestSubstitute}
                        onAssignSubstitute={handleAssignSubstitute}
                        subjectToDepartment={subjectToDepartment}
                    />
                )}

                {canViewAvailability && (
                    <section className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
                        <TeacherAvailability
                            teachers={teachers || []}
                            timetable={timetable!}
                            days={daysOfWeek}
                            periods={periods}
                            onUpdateSlot={handleUpdateTimetableSlot}
                            allSubjects={uniqueSubjects}
                            canEdit={canEditSchedule}
                            currentUser={currentUser}
                        />
                    </section>
                )}
            </main>
        </div>
    );
};

export default App;