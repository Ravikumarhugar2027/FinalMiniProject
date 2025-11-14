
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { TimetableData, Teacher, Notification, TimetableSlot, User, AbsenceRequest } from './types';
import { apiLogin, apiGetInitialData, apiUpdateTimetable, apiCreateAbsenceRequest, apiUpdateAbsenceRequest, apiReportFullDayAbsence } from './services/geminiService';
import Timetable from './components/Timetable';
import AbsenceManager from './components/AbsenceManager';
import NotificationPanel from './components/NotificationPanel';
import Header from './components/Header';
import TeacherAvailability from './components/TeacherAvailability';
import Login from './components/Login';
import AbsenceDashboard from './components/AbsenceDashboard';
import Footer from './components/Footer';
import MultiTimetableView from './components/MultiTimetableView';

const timetableOptions: { [key: string]: string } = {
    sem3overview: "3rd Sem Overview",
    sem3a: "3rd Sem - A", sem3b: "3rd Sem - B", sem3c: "3rd Sem - C",
    sem5a: "5th Sem - A", sem5b: "5th Sem - B", sem5c: "5th Sem - C",
};

const classToTimetableKey: Record<string, string> = {
    '3-A': 'sem3a',
    '3-B': 'sem3b',
    '3-C': 'sem3c',
    '5-A': 'sem5a',
    '5-B': 'sem5b',
    '5-C': 'sem5c',
};

const App: React.FC = () => {
    const [allTimetables, setAllTimetables] = useState<{ [key: string]: TimetableData } | null>(null);
    const [masterTimetable, setMasterTimetable] = useState<TimetableData | null>(null);
    const [activeTimetableKey, setActiveTimetableKey] = useState<string>('sem3overview');
    const [teachers, setTeachers] = useState<Teacher[] | null>(null);
    const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
    const [periods, setPeriods] = useState<number[]>([]);
    const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
    const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFullDayReporting, setIsFullDayReporting] = useState<boolean>(false);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await apiGetInitialData();
                setAllTimetables(data.timetables);
                setMasterTimetable(data.masterTimetable);
                setTeachers(data.teachers);
                setDaysOfWeek(data.daysOfWeek);
                setPeriods(data.periods.map((p: {id: number}) => p.id));
                setUniqueSubjects(data.uniqueSubjects);
                const requestsWithDates = data.absenceRequests.map((r: any) => ({
                    ...r,
                    timestamp: new Date(r.timestamp)
                }));
                setAbsenceRequests(requestsWithDates);
            } catch (err) {
                setError("Failed to connect to the backend server. Please ensure it's running (`node server.js`) and try refreshing the page.");
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
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            absenceRequestId,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const updateTimetableForClass = useCallback((slotClass: string, day: string, period: number, newData: Partial<TimetableSlot>) => {
        setAllTimetables(prev => {
            if (!prev) return prev;
            const targetKey = classToTimetableKey[slotClass];
            if (!targetKey || !prev[targetKey] || !prev[targetKey][day]) return prev;

            const updatedDay = prev[targetKey][day].map((slot, idx) =>
                idx === period - 1 ? { ...slot, ...newData } : slot
            );

            return {
                ...prev,
                [targetKey]: {
                    ...prev[targetKey],
                    [day]: updatedDay
                }
            };
        });
    }, []);

    const activeTimetable = useMemo(() => {
        if (!allTimetables || activeTimetableKey === 'sem3overview') return null;
        return allTimetables[activeTimetableKey];
    }, [allTimetables, activeTimetableKey]);

    const handleReportAbsence = async (absentTeacherName: string, day: string, period: number, reason: string) => {
        setIsLoading(true);
        setError(null);

        if (!teachers || !activeTimetable) {
            setError('Application data not loaded.');
            setIsLoading(false);
            return;
        }

        const absentTeacher = teachers.find(t => t.name === absentTeacherName);
        if (!absentTeacher) {
            setError('Selected teacher not found.');
            setIsLoading(false);
            return;
        }
        
        const originalSlot = activeTimetable[day]?.[period - 1];
        if (!originalSlot || originalSlot.teacher !== absentTeacherName) {
            const errorMessage = `${absentTeacherName} does not have a class in the currently viewed timetable at the selected time.`;
            setError(errorMessage);
            addNotification(`Error: ${errorMessage}`, 'error');
            setIsLoading(false);
            return;
        }

        try {
            const newRequestData = {
                absentTeacherId: absentTeacher.id,
                absentTeacherName,
                day,
                period,
                slot: originalSlot,
                reasoning: reason,
            };
            const createdRequest = await apiCreateAbsenceRequest(newRequestData);
            setAbsenceRequests(prev => [...prev, {...createdRequest, timestamp: new Date(createdRequest.timestamp) }]);
            
            addNotification(`Absence for ${absentTeacherName} on ${day}, Period ${period} reported.`, 'success');
            
            addNotification(`Admin Alert: ${absentTeacherName} absent for ${day}, P${period}. Action required.`, 'info');

        } catch (err: any) {
            setError(err.message || 'Failed to report absence.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReportFullDayAbsence = async (teacherName: string, day: string, reason: string) => {
        if (!teachers) {
            setError('Teacher list not loaded yet.');
            return;
        }

        const teacher = teachers.find(t => t.name === teacherName);
        if (!teacher) {
            setError('Selected teacher not found.');
            return;
        }

        setIsFullDayReporting(true);
        setError(null);

        try {
            const createdRequests = await apiReportFullDayAbsence(teacherName, day, reason);
            const requestsWithDates = createdRequests.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }));
            setAbsenceRequests(prev => [...prev, ...requestsWithDates]);
            addNotification(`Reported absence for all of ${teacherName}'s classes on ${day}.`, 'success');
            addNotification(`Admin Alert: ${teacherName} absent for all periods on ${day}.`, 'info');
        } catch (err: any) {
            setError(err.message || 'Failed to report full-day absence.');
        } finally {
            setIsFullDayReporting(false);
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
        setAbsenceRequests(prev => prev.map(r => r.id === requestId ? {...updatedRequest, timestamp: new Date(updatedRequest.timestamp)} : r));

        addNotification(`Request sent to ${substituteTeacher.name} to substitute.`, 'info');
        addNotification(`You have a request to substitute for ${updatedRequest.absentTeacherName} on ${updatedRequest.day}, P${updatedRequest.period}.`, 'action', requestId);
    };

    const handleRespondToSubstitution = async (requestId: number, response: 'accept' | 'decline') => {
        const request = absenceRequests.find(r => r.id === requestId);
        if (!request) return;
    
        if (request.status !== 'PENDING_SUBSTITUTE_RESPONSE') {
            setNotifications(prev => prev.filter(n => !(n.absenceRequestId === requestId && n.type === 'action')));
            return;
        }
    
        const newStatus = response === 'accept' ? 'SUBSTITUTE_ACCEPTED' : 'SUBSTITUTE_DECLINED';
        const updatedRequest = await apiUpdateAbsenceRequest(requestId, { status: newStatus });
        
        setAbsenceRequests(prevRequests => prevRequests.map(r => r.id === requestId ? {...updatedRequest, timestamp: new Date(updatedRequest.timestamp)} : r));
        
        const resultMessage = response === 'accept'
            ? `${request.requestedSubstituteTeacherName} ACCEPTED the substitution request.`
            : `${request.requestedSubstituteTeacherName} DECLINED the substitution request.`;
    
        const resultNotification: Notification = {
            id: Date.now(), message: resultMessage, type: response === 'accept' ? 'success' : 'error', timestamp: new Date(),
        };
    
        setNotifications(prevNotifications => [
            resultNotification,
            ...prevNotifications.filter(n => !(n.absenceRequestId === requestId && n.type === 'action'))
        ]);
    };
    
    const handleAssignSubstitute = async (requestId: number) => {
        const request = absenceRequests.find(r => r.id === requestId);
        if(!request || !masterTimetable || !request.requestedSubstituteTeacherName) return;
        
        const { day, period, absentTeacherName, requestedSubstituteTeacherName, slot } = request;
        const updatedSlot: Partial<TimetableSlot> = {
            class: slot.class,
            subject: slot.subject,
            teacher: requestedSubstituteTeacherName,
            isSubstitute: true,
            originalTeacher: absentTeacherName
        };

        const updatedTimetableFromDB = await apiUpdateTimetable(day, period, updatedSlot);
        setMasterTimetable(updatedTimetableFromDB);

        updateTimetableForClass(slot.class, day, period, updatedSlot);

        const updatedRequest = await apiUpdateAbsenceRequest(requestId, { status: 'ASSIGNED', assignedSubstituteTeacherName: requestedSubstituteTeacherName });
        setAbsenceRequests(prev => prev.map(r => r.id === requestId ? {...updatedRequest, timestamp: new Date(updatedRequest.timestamp)} : r));

        addNotification(`Success! ${requestedSubstituteTeacherName} assigned to substitute for ${absentTeacherName}.`, 'success');
    };

    const handleUpdateTimetableSlot = useCallback(async (day: string, period: number, newSlotData: Partial<TimetableSlot>) => {
        if (!masterTimetable) return;
        
        const currentSlot = masterTimetable[day][period - 1];
        const fullNewSlotData = { ...currentSlot, ...newSlotData, isSubstitute: false, originalTeacher: undefined };
        
        const updatedTimetableFromDB = await apiUpdateTimetable(day, period, fullNewSlotData);
        setMasterTimetable(updatedTimetableFromDB);

        if (fullNewSlotData.class) {
            updateTimetableForClass(fullNewSlotData.class, day, period, fullNewSlotData);
        }
        
        addNotification(`Timetable for ${day}, Period ${period} updated.`, 'success');
    }, [masterTimetable, allTimetables, activeTimetableKey, addNotification]);
    
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
    
    if (error && !allTimetables) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-red-50 p-8 text-center">
                 <div>
                    <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
                    <p className="text-red-700 font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    const canManageAbsence = currentUser.role === 'Admin' || currentUser.role === 'Teacher';
    const canManageDashboard = currentUser.role === 'Admin';
    const canEditSchedule = currentUser.role === 'Admin';
    const canViewAvailability = currentUser.role === 'Admin' || currentUser.role === 'Teacher';
    const isStudent = currentUser.role === 'Student';
    const showAbsenceManager = canManageAbsence && !isStudent && activeTimetableKey !== 'sem3overview';


    return (
        <div className="min-h-screen bg-gray-50 text-brand-dark font-sans flex flex-col">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="container mx-auto p-4 md:p-8 space-y-8 flex-grow">
                {!isStudent && <NotificationPanel 
                    notifications={notifications} 
                    onAcceptRequest={(id) => handleRespondToSubstitution(id, 'accept')}
                    onDeclineRequest={(id) => handleRespondToSubstitution(id, 'decline')}
                />}

                <div className="bg-white p-3 rounded-xl shadow-lg">
                    <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Timetable selector">
                        {Object.entries(timetableOptions).map(([key, name]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTimetableKey(key)}
                                role="tab"
                                aria-selected={activeTimetableKey === key}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
                                    activeTimetableKey === key
                                        ? 'bg-brand-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className={`grid grid-cols-1 ${showAbsenceManager ? 'lg:grid-cols-3' : ''} gap-8 items-start`}>
                    {showAbsenceManager && activeTimetable && (
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg animate-fade-in">
                            <AbsenceManager 
                                teachers={teachers || []} 
                                onReportAbsence={handleReportAbsence}
                                onReportFullDay={handleReportFullDayAbsence}
                                isLoading={isLoading}
                                isFullDayLoading={isFullDayReporting}
                                timetable={activeTimetable}
                                user={currentUser}
                                daysOfWeek={daysOfWeek}
                                periods={periods}
                            />
                             {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                        </div>
                    )}

                    <div className={showAbsenceManager ? "lg:col-span-2" : "col-span-1"}>
                        {activeTimetableKey === 'sem3overview' && allTimetables ? (
                            <MultiTimetableView 
                                timetables={{
                                    "3rd Sem - Section A": allTimetables.sem3a,
                                    "3rd Sem - Section B": allTimetables.sem3b,
                                    "3rd Sem - Section C": allTimetables.sem3c,
                                }}
                                days={daysOfWeek}
                                periods={periods}
                            />
                        ) : (
                             <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-primary pb-2">
                                    Live Timetable - {timetableOptions[activeTimetableKey]}
                                </h2>
                                {activeTimetable && <Timetable timetable={activeTimetable} days={daysOfWeek} periods={periods} />}
                            </div>
                        )}
                    </div>
                </div>

                {canManageDashboard && (
                        <AbsenceDashboard 
                                requests={absenceRequests} 
                                teachers={teachers || []} 
                                currentUser={currentUser} 
                                onRequestSubstitute={handleRequestSubstitute} 
                                onAssignSubstitute={handleAssignSubstitute} 
                            />
                )}

                {canViewAvailability && !isStudent && (
                    <section className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
                        <TeacherAvailability
                            teachers={teachers || []}
                            timetable={masterTimetable!}
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
            <Footer />
        </div>
    );
};

export default App;
