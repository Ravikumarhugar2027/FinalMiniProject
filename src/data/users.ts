
import { User } from '../types';

// This data is now only used for the demo buttons on the login page.
// The actual login validation is handled by the Node.js server.
export const demoUsers: User[] = [
    {
        id: 18,
        email: 'admin@sode-edu.in',
        password: 'admin',
        name: 'Dr. Bharti Panjwani',
        role: 'Admin',
    },
    {
        id: 23,
        email: 'kuthyarjava@sode-edu.in',
        password: 'password',
        name: 'Mr. Chandrashekar Rao Kuthyar',
        role: 'Teacher',
        teacherId: 23,
    },
    {
        id: 100,
        email: 'sachidananda@sode-edu.in',
        password: 'password',
        name: 'Sachidananda',
        role: 'Student',
    },
];
