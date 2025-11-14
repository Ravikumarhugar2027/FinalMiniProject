
import { Teacher, TimetableData, AbsenceRequest } from '../types';

export const initialTeachers: Teacher[] = [
    { id: 1, name: 'Mr. John Smith', subjects: ['Mathematics'] },
    { id: 2, name: 'Ms. Emily Jones', subjects: ['Physics', 'Chemistry'] },
    { id: 3, name: 'Mr. David Williams', subjects: ['History', 'Geography'] },
    { id: 4, name: 'Ms. Sarah Brown', subjects: ['English Literature'] },
    { id: 5, name: 'Mr. Michael Davis', subjects: ['Biology'] },
    { id: 6, name: 'Ms. Linda Wilson', subjects: ['Mathematics', 'Physics'] },
    { id: 7, name: 'Mr. Robert Taylor', subjects: ['Computer Science'] },
    { id: 8, name: 'Ms. Jessica Martinez', subjects: ['English Literature', 'History'] },
];

export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const periods = [1, 2, 3, 4, 5, 6];

export const departmentHODs: { [department: string]: string } = {
    'Mathematics': 'Mrs. Angela Martin',
    'Science': 'Mr. Stanley Hudson',
    'Humanities': 'Mr. Oscar Martinez',
    'English': 'Ms. Pam Beesly',
    'Computer Science': 'Mr. Kevin Malone',
};

export const subjectToDepartment: { [subject: string]: string } = {
    'Mathematics': 'Mathematics',
    'Physics': 'Science',
    'Chemistry': 'Science',
    'Biology': 'Science',
    'History': 'Humanities',
    'Geography': 'Humanities',
    'English Literature': 'English',
    'Computer Science': 'Computer Science',
};

export const uniqueSubjects = Array.from(new Set(initialTeachers.flatMap(t => t.subjects)));

export const initialAbsenceRequests: AbsenceRequest[] = [];

const generateTimetable = (): TimetableData => {
    const data: TimetableData = {};
    const classes = ['10-A', '10-B', '11-A', '11-B', '12-A', '12-B'];
    const assignments = [
        { teacher: 'Mr. John Smith', subject: 'Mathematics' },
        { teacher: 'Ms. Emily Jones', subject: 'Physics' },
        { teacher: 'Mr. David Williams', subject: 'History' },
        { teacher: 'Ms. Sarah Brown', subject: 'English Literature' },
        { teacher: 'Mr. Michael Davis', subject: 'Biology' },
        { teacher: 'Ms. Linda Wilson', subject: 'Mathematics' },
        { teacher: 'Mr. Robert Taylor', subject: 'Computer Science' },
        { teacher: 'Ms. Jessica Martinez', subject: 'History' },
    ];

    daysOfWeek.forEach(day => {
        data[day] = [];
        periods.forEach(period => {
            const randomClassIndex = Math.floor(Math.random() * classes.length);
            const randomAssignmentIndex = Math.floor(Math.random() * assignments.length);
            
            if (Math.random() < 0.2) {
                data[day].push({
                    class: 'Free',
                    subject: 'Free Period',
                    teacher: null
                });
            } else {
                 data[day].push({
                    class: classes[randomClassIndex],
                    subject: assignments[randomAssignmentIndex].subject,
                    teacher: assignments[randomAssignmentIndex].teacher,
                });
            }
        });
    });

    data['Monday'][0] = { class: '10-A', subject: 'Mathematics', teacher: 'Mr. John Smith' };
    data['Monday'][1] = { class: '10-B', subject: 'Physics', teacher: 'Ms. Emily Jones' };
    data['Tuesday'][2] = { class: '11-A', subject: 'History', teacher: 'Mr. David Williams' };

    return data;
};


export const initialTimetableData: TimetableData = generateTimetable();
