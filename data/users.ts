
import { User } from '../types';

export const mockUsers: User[] = [
    {
        id: 1,
        email: 'admin@school.edu',
        password: 'admin',
        name: 'Dr. Evelyn Reed',
        role: 'Admin',
    },
    {
        id: 2,
        email: 'hod.math@school.edu',
        password: 'password',
        name: 'Mrs. Angela Martin',
        role: 'HOD',
        department: 'Mathematics',
    },
    {
        id: 3,
        email: 'hod.science@school.edu',
        password: 'password',
        name: 'Mr. Stanley Hudson',
        role: 'HOD',
        department: 'Science',
    },
    {
        id: 4,
        email: 'jsmith@school.edu',
        password: 'password',
        name: 'Mr. John Smith',
        role: 'Teacher',
        teacherId: 1,
    },
    {
        id: 5,
        email: 'student@school.edu',
        password: 'password',
        name: 'Alex Johnson',
        role: 'Student',
    },
];
