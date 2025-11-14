


import React, { useState, useMemo } from 'react';
import type { AbsenceRequest, Teacher, TimetableData, User } from '../types';

interface AbsenceDashboardProps {
    requests: AbsenceRequest[];
    teachers: Teacher[];
    timetable: TimetableData;
    currentUser: User;
    onRequestSubstitute: (requestId: number, substituteTeacherId: number) => void;
    onAssignSubstitute: (requestId: number) => void;
    subjectToDepartment: { [subject: string]: string };
}

const SubstituteModal: React.FC<{
    request: AbsenceRequest;
    teachers: Teacher[];
    timetable: TimetableData;
    onClose: () => void;
    onSelect: (substituteTeacherId: number) => void;
}> = ({ request, teachers, timetable, onClose, onSelect }) => {

    const availableTeachers = useMemo(() => {
        return teachers.filter(teacher => {
            if (teacher.id === request.absentTeacherId) return false;

            const teacherSlot = timetable[request.day][request.period - 1];
            // Check if teacher has a class in any day at this period
             const isBusy = Object.values(timetable).some(daySchedule => daySchedule[request.period - 1].teacher === teacher.name);

             const hasFreePeriodNow = timetable[request.day][request.period-1].teacher !== teacher.name;

            return !isBusy && hasFreePeriodNow;

        }).sort((a, b) => {
            const aIsSubjectMatch = a.subjects.includes(request.slot.subject);
            const bIsSubjectMatch = b.subjects.includes(request.slot.subject);
            if (aIsSubjectMatch && !bIsSubjectMatch) return -1;
            if (!aIsSubjectMatch && bIsSubjectMatch) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [request, teachers, timetable]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">Select Substitute</h3>
                <p className="text-sm text-gray-600 mb-4">For {request.absentTeacherName}'s {request.slot.subject} class on {request.day}, Period {request.period}.</p>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    {availableTeachers.length > 0 ? availableTeachers.map(t => {
                        const isSubjectMatch = t.subjects.includes(request.slot.subject);
                        return (
                            <div key={t.id} className={`p-3 rounded-md flex justify-between items-center ${isSubjectMatch ? 'bg-green-50' : 'bg-gray-50'}`}>
                                <div>
                                    <p className="font-semibold">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.subjects.join(', ')}</p>
                                </div>
                                <button onClick={() => onSelect(t.id)} className="px-3 py-1 text-sm bg-brand-primary text-white rounded-md hover:bg-indigo-700">
                                    Request
                                </button>
                            </div>
                        );
                    }) : <p className="text-center text-gray-500 p-4">No teachers available for this slot.</p>}
                </div>
            </div>
        </div>
    );
};


const AbsenceRequestCard: React.FC<{
    request: AbsenceRequest;
    onFind: () => void;
    onAssign: () => void;
}> = ({ request, onFind, onAssign }) => {
    
    const getStatusChip = () => {
        switch (request.status) {
            case 'PENDING_HOD_ACTION':
                return <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">New Request</span>;
            case 'PENDING_SUBSTITUTE_RESPONSE':
                return <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Awaiting Response</span>;
            case 'SUBSTITUTE_ACCEPTED':
                 return <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Accepted</span>;
            case 'SUBSTITUTE_DECLINED':
                return <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Declined</span>;
            default:
                 return <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{request.status}</span>;
        }
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{request.absentTeacherName}</p>
                    <p className="text-sm text-gray-600">{request.slot.subject} - Class {request.slot.class}</p>
                    <p className="text-xs text-gray-500">{request.day}, Period {request.period}</p>
                </div>
                {getStatusChip()}
            </div>

            {request.status === 'PENDING_SUBSTITUTE_RESPONSE' && (
                <div className="text-sm bg-blue-50 p-2 rounded-md">
                    Request sent to: <span className="font-semibold">{request.requestedSubstituteTeacherName}</span>
                </div>
            )}
             {request.status === 'SUBSTITUTE_DECLINED' && (
                <div className="text-sm bg-red-50 p-2 rounded-md">
                    <span className="font-semibold">{request.requestedSubstituteTeacherName}</span> declined the request. Please find another substitute.
                </div>
            )}


            <div className="pt-2 border-t">
                { (request.status === 'PENDING_HOD_ACTION' || request.status === 'SUBSTITUTE_DECLINED') && (
                     <button onClick={onFind} className="w-full text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 rounded-md py-2 transition-colors">
                        Find Substitute
                    </button>
                )}
                { request.status === 'SUBSTITUTE_ACCEPTED' && (
                     <button onClick={onAssign} className="w-full text-sm font-medium text-white bg-brand-secondary hover:bg-emerald-600 rounded-md py-2 transition-colors">
                        Confirm & Assign Substitute
                    </button>
                )}
            </div>
        </div>
    )
}

const AbsenceDashboard: React.FC<AbsenceDashboardProps> = ({ requests, teachers, timetable, currentUser, onRequestSubstitute, onAssignSubstitute, subjectToDepartment }) => {
    const [modalRequest, setModalRequest] = useState<AbsenceRequest | null>(null);

    const myDepartmentTeachers = useMemo(() => {
        if (currentUser.role !== 'HOD' || !currentUser.department) return teachers.map(t => t.name);
        
        const departmentSubjects = Object.keys(subjectToDepartment).filter(
            subject => subjectToDepartment[subject] === currentUser.department
        );
        const teacherNames = new Set<string>();
        teachers.forEach(teacher => {
            if (teacher.subjects.some(sub => departmentSubjects.includes(sub))) {
                teacherNames.add(teacher.name);
            }
        });
        return Array.from(teacherNames);
    }, [currentUser, teachers, subjectToDepartment]);
    
    // HODs only see requests from their department teachers. Admins see all.
    const relevantRequests = useMemo(() => {
        if (currentUser.role === 'Admin') return requests;
        return requests.filter(r => myDepartmentTeachers.includes(r.absentTeacherName));
    }, [requests, currentUser, myDepartmentTeachers]);


    const newRequests = relevantRequests.filter(r => r.status === 'PENDING_HOD_ACTION' || r.status === 'SUBSTITUTE_DECLINED').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    const pendingResponses = relevantRequests.filter(r => r.status === 'PENDING_SUBSTITUTE_RESPONSE').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    const readyToAssign = relevantRequests.filter(r => r.status === 'SUBSTITUTE_ACCEPTED').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const handleSelectSubstitute = (substituteTeacherId: number) => {
        if (modalRequest) {
            onRequestSubstitute(modalRequest.id, substituteTeacherId);
            setModalRequest(null);
        }
    };
    
    if (relevantRequests.filter(r => r.status !== 'ASSIGNED' && r.status !== 'CLOSED').length === 0) {
        return (
             <section className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-secondary pb-2">
                    Absence Dashboard
                </h2>
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No active absence requests.</p>
                </div>
             </section>
        );
    }
    
    return (
        <>
            {modalRequest && (
                <SubstituteModal
                    request={modalRequest}
                    teachers={teachers}
                    timetable={timetable}
                    onClose={() => setModalRequest(null)}
                    onSelect={handleSelectSubstitute}
                />
            )}
            <section className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '600ms' }}>
                <h2 className="text-2xl font-bold text-brand-dark mb-4 border-b-2 border-brand-secondary pb-2">
                    Absence Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: New Requests */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">New Absence Reports ({newRequests.length})</h3>
                        <div className="space-y-3">
                            {newRequests.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => setModalRequest(req)} onAssign={() => {}}/>)}
                        </div>
                    </div>
                     {/* Column 2: Pending Response */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">Awaiting Substitute Response ({pendingResponses.length})</h3>
                        <div className="space-y-3">
                            {pendingResponses.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => {}} onAssign={() => {}}/>)}
                        </div>
                    </div>
                     {/* Column 3: Ready to Assign */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">Ready to Assign ({readyToAssign.length})</h3>
                        <div className="space-y-3">
                            {readyToAssign.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => {}} onAssign={() => onAssignSubstitute(req.id)}/>)}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default AbsenceDashboard;