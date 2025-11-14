
export type UserRole = 'Admin' | 'Teacher' | 'Student';

export interface User {
    id: number;
    email: string;
    // In a real app, this would be a hashed password.
    // This is for client-side simulation only.
    password: string; 
    name: string;
    role: UserRole;
    teacherId?: number;  // For Teacher role
}

export interface Teacher {
    id: number;
    name: string;
    subjects: string[];
}

export interface TimetableSlot {
    class: string;
    subject: string;
    teacher: string | null;
    isSubstitute?: boolean;
    originalTeacher?: string;
}

export interface TimetableData {
    [day: string]: TimetableSlot[];
}

export type AbsenceRequestStatus =
  | 'PENDING_ADMIN_ACTION'
  | 'PENDING_SUBSTITUTE_RESPONSE'
  | 'SUBSTITUTE_ACCEPTED'
  | 'SUBSTITUTE_DECLINED'
  | 'ASSIGNED'
  | 'CLOSED';

export interface AbsenceRequest {
    id: number;
    absentTeacherId: number;
    absentTeacherName: string;
    day: string;
    period: number;
    slot: TimetableSlot;
    status: AbsenceRequestStatus;
    requestedSubstituteTeacherId?: number;
    requestedSubstituteTeacherName?: string;
    assignedSubstituteTeacherId?: number;
    assignedSubstituteTeacherName?: string;
    timestamp: Date;
    reasoning?: string; // Reason for the absence provided by the reporter.
}


export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'action';
    timestamp: Date;
    absenceRequestId?: number;
}
