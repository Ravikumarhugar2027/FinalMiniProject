import { GoogleGenAI, Type } from '@google/genai';
import type { Teacher, TimetableData, User, AbsenceRequest } from '../types';
import { 
    initialTimetableData, 
    initialTeachers, 
    uniqueSubjects, 
    daysOfWeek, 
    periods,
    subjectToDepartment,
    departmentHODs,
    initialAbsenceRequests
} from '../data/mockData';
import { mockUsers } from '../data/users';

// Fix: Switched from import.meta.env.VITE_API_KEY to process.env.API_KEY to adhere to the coding guidelines.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error(
    "API_KEY is not defined. Please ensure the API_KEY environment variable is set."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- In-memory DB simulation ---
let absenceRequests: AbsenceRequest[] = initialAbsenceRequests;
let nextAbsenceId = 1;


interface SubstituteResult {
    substituteTeacherName: string;
    reasoning: string;
}

export const findSubstitute = async (
    absentTeacher: Teacher,
    day: string,
    period: number,
    timetable: TimetableData,
    allTeachers: Teacher[]
): Promise<SubstituteResult> => {

    const availableTeachers = allTeachers.filter(teacher => {
        if (teacher.id === absentTeacher.id) return false;
        
        const teachersWithClassesThisPeriod = Object.values(timetable)
            .flatMap(daySchedule => daySchedule[period - 1])
            .map(s => s.teacher)
            .filter(Boolean);
            
        return !teachersWithClassesThisPeriod.includes(teacher.name);
    }).map(t => ({ name: t.name, subjects: t.subjects }));


    if (availableTeachers.length === 0) {
        throw new Error("No teachers are available for substitution at this time.");
    }
    
    const prompt = `
You are an intelligent timetable management assistant for a school.
Your task is to find a suitable substitute teacher for an absent colleague.

CONTEXT:
- Absent Teacher: ${absentTeacher.name}
- Subject of the class: ${timetable[day][period - 1].subject}
- Day and Period of Absence: ${day}, Period ${period}

LIST OF AVAILABLE TEACHERS (who have a free period now):
${JSON.stringify(availableTeachers, null, 2)}

YOUR TASK:
Analyze the list of available teachers and find the best substitute.
Prioritize teachers based on the following criteria:
1.  **Primary Match:** The substitute teacher's subjects include the subject of the class (${timetable[day][period - 1].subject}).
2.  **Secondary Match:** If no primary match is found, select any other available teacher.

Provide a brief reasoning for your choice.
Respond with ONLY a JSON object that matches the required schema.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    substituteTeacherName: {
                        type: Type.STRING,
                        description: 'The full name of the chosen substitute teacher.',
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'A brief explanation for why this teacher was chosen.'
                    }
                },
                required: ['substituteTeacherName', 'reasoning'],
            },
        }
    });
    
    const jsonText = (response.text || '').trim();
    try {
        const parsedResult = JSON.parse(jsonText);
        return parsedResult as SubstituteResult;
    } catch (e) {
        console.error("Failed to parse Gemini response:", jsonText);
        throw new Error("Received an invalid response from the AI assistant.");
    }
};

// --- API Simulation Layer ---
// In a real application, this would be in a separate file (e.g., apiService.ts)
// and would make actual fetch() calls to a backend server connected to a MySQL database.

const SIMULATED_DELAY = 500; // ms

export const apiGetInitialData = async (): Promise<any> => {
    console.log("API_SIM: Fetching initial data...");
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("API_SIM: Initial data fetched.");
            resolve({
                timetable: initialTimetableData,
                teachers: initialTeachers,
                uniqueSubjects,
                daysOfWeek,
                periods,
                subjectToDepartment,
                departmentHODs,
                absenceRequests: [...absenceRequests],
            });
        }, SIMULATED_DELAY);
    });
};

export const apiLogin = async (email: string, pass: string): Promise<User | null> => {
    console.log(`API_SIM: Attempting login for ${email}...`);
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.email === email && u.password === pass);
            if (user) {
                console.log("API_SIM: Login successful.");
                resolve(user);
            } else {
                console.log("API_SIM: Login failed.");
                resolve(null);
            }
        }, SIMULATED_DELAY);
    });
};

export const apiUpdateTimetable = async (newTimetable: TimetableData): Promise<TimetableData> => {
    console.log("API_SIM: Updating timetable...");
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, the server would validate and save this to the DB.
            // Here we just return it to simulate a successful update.
            console.log("API_SIM: Timetable updated successfully.");
            resolve(newTimetable);
        }, SIMULATED_DELAY);
    });
};

export const apiCreateAbsenceRequest = async (request: Omit<AbsenceRequest, 'id' | 'timestamp' | 'status'>): Promise<AbsenceRequest> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newRequest: AbsenceRequest = {
                ...request,
                id: nextAbsenceId++,
                timestamp: new Date(),
                status: 'PENDING_HOD_ACTION',
            };
            absenceRequests.push(newRequest);
            console.log("API_SIM: Created new absence request", newRequest);
            resolve(newRequest);
        }, SIMULATED_DELAY);
    });
};

export const apiUpdateAbsenceRequest = async (requestId: number, updates: Partial<AbsenceRequest>): Promise<AbsenceRequest> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const requestIndex = absenceRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                absenceRequests[requestIndex] = { ...absenceRequests[requestIndex], ...updates };
                console.log("API_SIM: Updated absence request", absenceRequests[requestIndex]);
                resolve(absenceRequests[requestIndex]);
            } else {
                reject(new Error("Absence request not found."));
            }
        }, SIMULATED_DELAY);
    });
};