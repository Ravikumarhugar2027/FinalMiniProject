
import type { User, AbsenceRequest, TimetableData, TimetableSlot } from '../types';

const BACKEND_URL = 'http://localhost:3001';

// --- API Layer Connected to Node.js Backend ---

export const apiGetInitialData = async (): Promise<any> => {
    const response = await fetch(`${BACKEND_URL}/api/initial-data`);
    if (!response.ok) throw new Error('Failed to fetch initial data from server.');
    return response.json();
};

export const apiLogin = async (email: string, pass: string): Promise<User | null> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        if (!response.ok) return null;
        return response.json();
    } catch (error) {
        console.error("API Login Error:", error);
        return null;
    }
};

export const apiUpdateTimetable = async (day: string, period: number, newSlotData: Partial<TimetableSlot>): Promise<TimetableData> => {
    const response = await fetch(`${BACKEND_URL}/api/timetable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, period, newSlotData })
    });
    if (!response.ok) throw new Error('Failed to update timetable.');
    return response.json();
};

export const apiCreateAbsenceRequest = async (request: Omit<AbsenceRequest, 'id' | 'timestamp' | 'status'>): Promise<AbsenceRequest> => {
    const response = await fetch(`${BACKEND_URL}/api/absence-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error('Failed to create absence request.');
    return response.json();
};

export const apiReportFullDayAbsence = async (teacherName: string, day: string, reason: string): Promise<AbsenceRequest[]> => {
    const response = await fetch(`${BACKEND_URL}/api/absence-requests/full-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName, day, reason })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to report full-day absence.');
    }
    return response.json();
};

export const apiUpdateAbsenceRequest = async (requestId: number, updates: Partial<AbsenceRequest>): Promise<AbsenceRequest> => {
     const response = await fetch(`${BACKEND_URL}/api/absence-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update absence request.');
    return response.json();
};

export const apiFindSubstitute = async (request: AbsenceRequest): Promise<{ substituteTeacherName: string, reasoning: string }> => {
    const response = await fetch(`${BACKEND_URL}/api/find-substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            day: request.day,
            period: request.period,
            subject: request.slot.subject,
            absentTeacherId: request.absentTeacherId
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to find substitute.');
    }
    return response.json();
};
