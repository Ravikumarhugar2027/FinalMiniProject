
import React, { useState, useMemo } from 'react';
import type { AbsenceRequest, Teacher, User } from '../types';
import { apiFindSubstitute } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface AbsenceDashboardProps {
    requests: AbsenceRequest[];
    teachers: Teacher[];
    currentUser: User;
    onRequestSubstitute: (requestId: number, substituteTeacherId: number) => void;
    onAssignSubstitute: (requestId: number) => void;
}

const AISuggestionModal: React.FC<{
    suggestion: { substituteTeacherName: string, reasoning: string };
    onClose: () => void;
    onConfirm: () => void;
}> = ({ suggestion, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform animate-slide-in-down" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-brand-dark">AI Substitute Suggestion</h3>
                <div className="my-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-600">Suggested Teacher:</p>
                    <p className="text-lg font-semibold text-brand-primary">{suggestion.substituteTeacherName}</p>
                    <p className="mt-2 text-sm text-gray-600">Reasoning:</p>
                    <p className="text-sm text-gray-800 italic">"{suggestion.reasoning}"</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        Request This Teacher
                    </button>
                    <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


const AbsenceRequestCard: React.FC<{
    request: AbsenceRequest;
    onFind: () => void;
    onAssign: () => void;
    isFinding: boolean;
}> = ({ request, onFind, onAssign, isFinding }) => {
    
    const getStatusChip = () => {
        switch (request.status) {
            case 'PENDING_ADMIN_ACTION':
                return <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">New Request</span>;
            case 'PENDING_SUBSTITUTE_RESPONSE':
                return <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Awaiting Response</span>;
            case 'SUBSTITUTE_ACCEPTED':
                 return <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Accepted</span>;
            case 'SUBSTITUTE_DECLINED':
                return <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">Declined</span>;
            case 'ASSIGNED':
                return <span className="text-xs font-semibold bg-gray-400 text-white px-2 py-1 rounded-full">Assigned</span>;
            default:
                 return <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{request.status}</span>;
        }
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{request.absentTeacherName}</p>
                    <p className="text-sm text-gray-600">{request.slot.subject} - Class {request.slot.class}</p>
                    <p className="text-xs text-gray-500">{request.day}, Period {request.period}</p>
                </div>
                {getStatusChip()}
            </div>
            
            {request.reasoning && (
                <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md border-l-2 border-gray-300">
                    <span className="font-semibold">Reason:</span> {request.reasoning}
                </div>
            )}

            {request.status === 'PENDING_SUBSTITUTE_RESPONSE' && (
                <div className="text-sm bg-blue-50 p-2 rounded-md">
                    Request sent to: <span className="font-semibold">{request.requestedSubstituteTeacherName}</span>
                </div>
            )}
             {request.status === 'SUBSTITUTE_DECLINED' && (
                <div className="text-sm bg-red-50 p-2 rounded-md">
                    <span className="font-semibold">{request.requestedSubstituteTeacherName}</span> declined. Please find another substitute.
                </div>
            )}


            <div className="pt-2 border-t">
                { (request.status === 'PENDING_ADMIN_ACTION' || request.status === 'SUBSTITUTE_DECLINED') && (
                     <button onClick={onFind} disabled={isFinding} className="w-full text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 rounded-md py-2 transition-colors disabled:bg-gray-400">
                        {isFinding ? <LoadingSpinner /> : 'Find Substitute with AI'}
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

const AbsenceDashboard: React.FC<AbsenceDashboardProps> = ({ requests, teachers, currentUser, onRequestSubstitute, onAssignSubstitute }) => {
    const [suggestion, setSuggestion] = useState<{ substituteTeacherName: string; reasoning: string } | null>(null);
    const [activeRequest, setActiveRequest] = useState<AbsenceRequest | null>(null);
    const [isFinding, setIsFinding] = useState<number | null>(null); // Store ID of request being processed
    const [error, setError] = useState<string | null>(null);

    const handleFindSubstitute = async (request: AbsenceRequest) => {
        setIsFinding(request.id);
        setError(null);
        try {
            const result = await apiFindSubstitute(request);
            setSuggestion(result);
            setActiveRequest(request);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsFinding(null);
        }
    };

    const handleConfirmSuggestion = () => {
        if (!suggestion || !activeRequest) return;
        
        const substitute = teachers.find(t => t.name === suggestion.substituteTeacherName);
        if (substitute) {
            onRequestSubstitute(activeRequest.id, substitute.id);
        } else {
            setError(`Could not find teacher: ${suggestion.substituteTeacherName}`);
        }
        
        setSuggestion(null);
        setActiveRequest(null);
    };

    const relevantRequests = useMemo(() => {
        return currentUser.role === 'Admin' ? requests : [];
    }, [requests, currentUser]);


    const newRequests = relevantRequests.filter(r => r.status === 'PENDING_ADMIN_ACTION' || r.status === 'SUBSTITUTE_DECLINED').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    const pendingResponses = relevantRequests.filter(r => r.status === 'PENDING_SUBSTITUTE_RESPONSE').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    const readyToAssign = relevantRequests.filter(r => r.status === 'SUBSTITUTE_ACCEPTED').sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
    
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
            {suggestion && (
                <AISuggestionModal
                    suggestion={suggestion}
                    onClose={() => { setSuggestion(null); setActiveRequest(null); }}
                    onConfirm={handleConfirmSuggestion}
                />
            )}
            <section className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in" style={{ animationDelay: '600ms' }}>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-dark border-b-2 border-brand-secondary pb-2">
                        Absence Dashboard
                    </h2>
                     {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">New / Action Required ({newRequests.length})</h3>
                        <div className="space-y-3">
                            {newRequests.length > 0 ? newRequests.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => handleFindSubstitute(req)} onAssign={() => {}} isFinding={isFinding === req.id}/>) : <p className="text-xs text-center text-gray-500 pt-2">None</p>}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">Awaiting Response ({pendingResponses.length})</h3>
                        <div className="space-y-3">
                            {pendingResponses.length > 0 ? pendingResponses.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => {}} onAssign={() => {}} isFinding={false}/>) : <p className="text-xs text-center text-gray-500 pt-2">None</p>}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-center text-gray-700 bg-gray-100 p-2 rounded-md">Ready to Assign ({readyToAssign.length})</h3>
                        <div className="space-y-3">
                            {readyToAssign.length > 0 ? readyToAssign.map(req => <AbsenceRequestCard key={req.id} request={req} onFind={() => {}} onAssign={() => onAssignSubstitute(req.id)} isFinding={false}/>) : <p className="text-xs text-center text-gray-500 pt-2">None</p>}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default AbsenceDashboard;
