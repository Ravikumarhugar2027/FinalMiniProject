
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// --- AI SETUP ---
const API_KEY = process.env.API_KEY;
let ai = null;
if (!API_KEY) {
    console.warn("WARNING: API_KEY is not defined. Falling back to rule-based substitute selection.");
} else {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

// --- IN-MEMORY DATABASE (REAL SMVITM DATA) ---

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const dbUsers = [
    { id: 18, email: 'admin@sode-edu.in', password: 'admin', name: 'Dr. Bharti Panjwani', role: 'Admin', teacherId: 18 },
    { id: 10, email: 'hod.cs@sode-edu.in', password: 'password', name: 'Ms. Sahana', role: 'Teacher', teacherId: 10 },
    { id: 23, email: 'kuthyarjava@sode-edu.in', password: 'password', name: 'Mr. Chandrashekar Rao Kuthyar', role: 'Teacher', teacherId: 23 },
    { id: 100, email: 'sachidananda@sode-edu.in', password: 'password', name: 'Sachidananda', role: 'Student' },
    { id: 8, email: 'deepak@sode-edu.in', password: 'password', name: 'Mr. Deepak Rao M', role: 'Teacher', teacherId: 8 },
    { id: 3, email: 'mahadevi@cse.edu', password: 'password', name: 'Ms. Mahadevi', role: 'Teacher', teacherId: 3},
    { id: 1, email: 'lolita.priya.castelino@cse.edu', password: 'password', name: 'Dr. Lolita Priya Castelino', role: 'Teacher', teacherId: 1},
    { id: 99, email: 'training.faculty@cse.edu', password: 'password', name: 'Training Faculty', role: 'Teacher', teacherId: 99},
    { id: 4, email: 'reshma@cse.edu', password: 'password', name: 'Ms. Reshma', role: 'Teacher', teacherId: 4},
    { id: 98, email: 'ra@cse.edu', password: 'password', name: 'RA', role: 'Teacher', teacherId: 98},
    { id: 2, email: 'babitha.poojary@cse.edu', password: 'password', name: 'Ms. Babitha Poojary', role: 'Teacher', teacherId: 2},
    { id: 5, email: 'savitha.shenoy@cse.edu', password: 'password', name: 'Ms. Savitha A. Shenoy', role: 'Teacher', teacherId: 5},
    { id: 6, email: 'raghavendra.joshi@cse.edu', password: 'password', name: 'Mr. Raghavendra Joshi', role: 'Teacher', teacherId: 6},
    { id: 97, email: 'renita.sharon.monis@cse.edu', password: 'password', name: 'Dr. Renita Sharon Monis', role: 'Teacher', teacherId: 97},
    { id: 19, email: 'sanjana.kavatagi@cse.edu', password: 'password', name: 'Ms. Sanjana Kavatagi', role: 'Teacher', teacherId: 19},
    { id: 9, email: 'ashritha@cse.edu', password: 'password', name: 'Ms. Ashritha', role: 'Teacher', teacherId: 9},
    { id: 12, email: 'ranjani@cse.edu', password: 'password', name: 'Ms. Ranjani', role: 'Teacher', teacherId: 12},
    { id: 13, email: 'nagaraj.bhat@cse.edu', password: 'password', name: 'Dr. Nagaraj Bhat', role: 'Teacher', teacherId: 13},
    { id: 7, email: 'bhagyalaxmi@cse.edu', password: 'password', name: 'Ms. Bhagyalaxmi', role: 'Teacher', teacherId: 7},
    { id: 11, email: 'rashmi.samanth@cse.edu', password: 'password', name: 'Ms. Rashmi Samanth', role: 'Teacher', teacherId: 11},
    { id: 15, email: 'soumya.bhat@cse.edu', password: 'password', name: 'Dr. Soumya J Bhat', role: 'Teacher', teacherId: 15},
    { id: 17, email: 'soundharya@cse.edu', password: 'password', name: 'Ms. R. Soundharya', role: 'Teacher', teacherId: 17},
    { id: 16, email: 'preethi.m@cse.edu', password: 'password', name: 'Ms. Preethi M', role: 'Teacher', teacherId: 16},
    { id: 14, email: 'prasad.pai@cse.edu', password: 'password', name: 'Mr. Prasad Pai', role: 'Teacher', teacherId: 14},
    { id: 21, email: 'sadananda.l@cse.edu', password: 'password', name: 'Dr. Sadananda L', role: 'Teacher', teacherId: 21},
    { id: 20, email: 'rukmini.bhat@cse.edu', password: 'password', name: 'Ms. Rukmini Bhat B', role: 'Teacher', teacherId: 20},
    { id: 22, email: 'ashwitha.thomas@cse.edu', password: 'password', name: 'Ms. Ashwitha C. Thomas', role: 'Teacher', teacherId: 22},
    { id: 24, email: 'rajeshwari@cse.edu', password: 'password', name: 'Ms. M. S. Rajeshwari', role: 'Teacher', teacherId: 24},
    { id: 25, email: 'sowmya.nh@cse.edu', password: 'password', name: 'Ms. Sowmya N H', role: 'Teacher', teacherId: 25},
];

const dbTeachers = dbUsers
    .filter(u => u.role === 'Teacher' || u.role === 'Admin')
    .map(u => ({ id: u.teacherId, name: u.name, subjects: [] })); // Subjects populated after timetable load

// Master timetable combining ALL sections for accurate availability checks
const dbMasterTimetableSlots = [
    // SEM 3A
    { day: 'Monday', period: 1, teacher: 'Ms. Mahadevi', class: '3-A', subject: 'Operating Systems'},
    { day: 'Monday', period: 2, teacher: 'Dr. Lolita Priya Castelino', class: '3-A', subject: 'Mathematics for Computer Science'},
    { day: 'Monday', period: 4, teacher: 'Training Faculty', class: '3-A', subject: 'Placement Training'},
    { day: 'Monday', period: 7, teacher: 'Ms. Ranjani', class: '3-A', subject: 'Data Visualization with Python'},
    { day: 'Monday', period: 9, teacher: 'Ms. Reshma', class: '3-A', subject: 'National Service Scheme (NSS)'},
    { day: 'Tuesday', period: 1, teacher: 'Dr. Lolita Priya Castelino', class: '3-A', subject: 'Mathematics for Computer Science'},
    { day: 'Tuesday', period: 2, teacher: 'Ms. Babitha Poojary', class: '3-A', subject: 'Digital Design & Computer Organization'},
    { day: 'Tuesday', period: 4, teacher: 'Ms. Savitha A. Shenoy', class: '3-A', subject: 'Object Oriented Programming with Java'},
    { day: 'Tuesday', period: 5, teacher: 'Mr. Raghavendra Joshi', class: '3-A', subject: 'Social Connect and Responsibility'},
    { day: 'Tuesday', period: 7, teacher: 'RA', class: '3-A', subject: 'Data Structures Lab'},
    { day: 'Tuesday', period: 9, teacher: 'Ms. Reshma', class: '3-A', subject: 'National Service Scheme (NSS)'},
    { day: 'Wednesday', period: 1, teacher: 'Dr. Lolita Priya Castelino', class: '3-A', subject: 'Mathematics for Computer Science'},
    { day: 'Wednesday', period: 2, teacher: 'Ms. Mahadevi', class: '3-A', subject: 'Operating Systems'},
    { day: 'Wednesday', period: 5, teacher: 'Ms. Mahadevi', class: '3-A', subject: 'Operating Systems'},
    { day: 'Wednesday', period: 7, teacher: 'Ms. Reshma', class: '3-A', subject: 'Data Structures and Applications'},
    { day: 'Wednesday', period: 10, teacher: 'Training Faculty', class: '3-A', subject: 'Placement Training'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Babitha Poojary', class: '3-A', subject: 'Digital Design & Computer Organization'},
    { day: 'Thursday', period: 2, teacher: 'Dr. Lolita Priya Castelino', class: '3-A', subject: 'Mathematics for Computer Science'},
    { day: 'Thursday', period: 4, teacher: 'Ms. Reshma', class: '3-A', subject: 'Data Structures and Applications'},
    { day: 'Thursday', period: 5, teacher: 'Ms. Savitha A. Shenoy', class: '3-A', subject: 'Object Oriented Programming with Java'},
    { day: 'Thursday', period: 7, teacher: 'Ms. Mahadevi', class: '3-A', subject: 'Operating Systems'},
    { day: 'Thursday', period: 9, teacher: 'Ms. Babitha Poojary', class: '3-A', subject: 'Digital Design & Computer Organization'},
    { day: 'Thursday', period: 10, teacher: 'RA', class: '3-A', subject: 'Data Structures Lab'},
    { day: 'Friday', period: 1, teacher: 'Ms. Savitha A. Shenoy', class: '3-A', subject: 'Object Oriented Programming with Java'},
    { day: 'Friday', period: 2, teacher: 'Ms. Reshma', class: '3-A', subject: 'Data Structures and Applications'},
    { day: 'Friday', period: 4, teacher: 'Ms. Babitha Poojary', class: '3-A', subject: 'Digital Design & Computer Organization'},
    { day: 'Friday', period: 5, teacher: 'Dr. Lolita Priya Castelino', class: '3-A', subject: 'Mathematics for Computer Science'},
    { day: 'Friday', period: 7, teacher: 'Ms. Mahadevi', class: '3-A', subject: 'Operating Systems'},
    { day: 'Friday', period: 9, teacher: 'Ms. Savitha A. Shenoy', class: '3-A', subject: 'Object Oriented Programming with Java'},
    { day: 'Friday', period: 10, teacher: 'Ms. Babitha Poojary', class: '3-A', subject: 'Digital Design & Computer Organization'},
    // SEM 3B
    { day: 'Monday', period: 1, teacher: 'Ms. Sahana', class: '3-B', subject: 'Data Structures and Applications'},
    { day: 'Monday', period: 2, teacher: 'Dr. Renita Sharon Monis', class: '3-B', subject: 'Mathematics for Computer Science'},
    { day: 'Monday', period: 4, teacher: 'Ms. Savitha A. Shenoy', class: '3-B', subject: 'Object Oriented Programming with Java'},
    { day: 'Monday', period: 5, teacher: 'Ms. Ashritha', class: '3-B', subject: 'Operating Systems'},
    { day: 'Monday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '3-B', subject: 'Data Structures Lab'},
    { day: 'Monday', period: 9, teacher: 'Ms. Reshma', class: '3-B', subject: 'National Service Scheme (NSS)'},
    { day: 'Tuesday', period: 1, teacher: 'Training Faculty', class: '3-B', subject: 'Placement Training'},
    { day: 'Tuesday', period: 3, teacher: 'Dr. Renita Sharon Monis', class: '3-B', subject: 'Mathematics for Computer Science'},
    { day: 'Tuesday', period: 4, teacher: 'Mr. Deepak Rao M', class: '3-B', subject: 'Digital Design & Computer Organization'},
    { day: 'Tuesday', period: 6, teacher: 'Ms. Ashritha', class: '3-B', subject: 'Operating Systems'},
    { day: 'Tuesday', period: 8, teacher: 'Ms. Ashritha', class: '3-B', subject: 'Operating Systems'},
    { day: 'Wednesday', period: 1, teacher: 'Ms. Savitha A. Shenoy', class: '3-B', subject: 'Object Oriented Programming with Java'},
    { day: 'Wednesday', period: 2, teacher: 'Ms. Sahana', class: '3-B', subject: 'Data Structures and Applications'},
    { day: 'Wednesday', period: 4, teacher: 'Ms. Ashritha', class: '3-B', subject: 'Operating Systems'},
    { day: 'Wednesday', period: 5, teacher: 'Dr. Renita Sharon Monis', class: '3-B', subject: 'Mathematics for Computer Science'},
    { day: 'Wednesday', period: 7, teacher: 'Ms. Reshma', class: '3-B', subject: 'Data Visualization with Python'},
    { day: 'Wednesday', period: 9, teacher: 'Mr. Raghavendra Joshi', class: '3-B', subject: 'Social Connect and Responsibility'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Savitha A. Shenoy', class: '3-B', subject: 'Object Oriented Programming with Java'},
    { day: 'Thursday', period: 3, teacher: 'Training Faculty', class: '3-B', subject: 'Placement Training'},
    { day: 'Thursday', period: 4, teacher: 'Dr. Renita Sharon Monis', class: '3-B', subject: 'Mathematics for Computer Science'},
    { day: 'Thursday', period: 6, teacher: 'Ms. Ashritha', class: '3-B', subject: 'Operating Systems'},
    { day: 'Thursday', period: 7, teacher: 'Mr. Deepak Rao M', class: '3-B', subject: 'Digital Design & Computer Organization'},
    { day: 'Friday', period: 1, teacher: 'Mr. Deepak Rao M', class: '3-B', subject: 'Digital Design & Computer Organization'},
    { day: 'Friday', period: 2, teacher: 'Ms. Sahana', class: '3-B', subject: 'Data Structures and Applications'},
    { day: 'Friday', period: 4, teacher: 'Mr. Deepak Rao M', class: '3-B', subject: 'Digital Design & Computer Organization'},
    { day: 'Friday', period: 5, teacher: 'Ms. Sanjana Kavatagi', class: '3-B', subject: 'Data Structures Lab'},
    { day: 'Friday', period: 7, teacher: 'Ms. Savitha A. Shenoy', class: '3-B', subject: 'Object Oriented Programming with Java'},
    { day: 'Friday', period: 9, teacher: 'Dr. Renita Sharon Monis', class: '3-B', subject: 'Mathematics for Computer Science'},
    { day: 'Friday', period: 10, teacher: 'Ms. Reshma', class: '3-B', subject: 'National Service Scheme (NSS)'},
    // SEM 3C
    { day: 'Monday', period: 1, teacher: 'Ms. Ranjani', class: '3-C', subject: 'Operating Systems'},
    { day: 'Monday', period: 2, teacher: 'Dr. Nagaraj Bhat', class: '3-C', subject: 'Data Structures and Applications'},
    { day: 'Monday', period: 4, teacher: 'Ms. Sahana', class: '3-C', subject: 'Object Oriented Programming with Java'},
    { day: 'Monday', period: 5, teacher: 'Ms. Bhagyalaxmi', class: '3-C', subject: 'Mathematics for Computer Science'},
    { day: 'Monday', period: 7, teacher: 'Ms. Rashmi Samanth', class: '3-C', subject: 'Digital Design & Computer Organization'},
    { day: 'Monday', period: 9, teacher: 'Mr. Raghavendra Joshi', class: '3-C', subject: 'Social Connect and Responsibility'},
    { day: 'Monday', period: 10, teacher: 'Ms. Reshma', class: '3-C', subject: 'National Service Scheme (NSS)'},
    { day: 'Tuesday', period: 1, teacher: 'Dr. Nagaraj Bhat', class: '3-C', subject: 'Data Structures and Applications'},
    { day: 'Tuesday', period: 2, teacher: 'Ms. Rashmi Samanth', class: '3-C', subject: 'Digital Design & Computer Organization'},
    { day: 'Tuesday', period: 4, teacher: 'Ms. Reshma', class: '3-C', subject: 'Data Structures Lab'},
    { day: 'Tuesday', period: 5, teacher: 'Ms. Sahana', class: '3-C', subject: 'Object Oriented Programming with Java'},
    { day: 'Tuesday', period: 7, teacher: 'Ms. Ranjani', class: '3-C', subject: 'Operating Systems'},
    { day: 'Tuesday', period: 9, teacher: 'Ms. Sahana', class: '3-C', subject: 'Object Oriented Programming with Java'},
    { day: 'Tuesday', period: 10, teacher: 'Ms. Bhagyalaxmi', class: '3-C', subject: 'Mathematics for Computer Science'},
    { day: 'Wednesday', period: 1, teacher: 'Training Faculty', class: '3-C', subject: 'Placement Training'},
    { day: 'Wednesday', period: 3, teacher: 'Ms. Sahana', class: '3-C', subject: 'Object Oriented Programming with Java'},
    { day: 'Wednesday', period: 4, teacher: 'Ms. Rashmi Samanth', class: '3-C', subject: 'Digital Design & Computer Organization'},
    { day: 'Wednesday', period: 5, teacher: 'Ms. Bhagyalaxmi', class: '3-C', subject: 'Mathematics for Computer Science'},
    { day: 'Wednesday', period: 7, teacher: 'Ms. Rashmi Samanth', class: '3-C', subject: 'Digital Design & Computer Organization'},
    { day: 'Wednesday', period: 9, teacher: 'Ms. Reshma', class: '3-C', subject: 'National Service Scheme (NSS)'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Bhagyalaxmi', class: '3-C', subject: 'Mathematics for Computer Science'},
    { day: 'Thursday', period: 2, teacher: 'Dr. Nagaraj Bhat', class: '3-C', subject: 'Data Structures and Applications'},
    { day: 'Thursday', period: 4, teacher: 'Ms. Rashmi Samanth', class: '3-C', subject: 'Digital Design & Computer Organization'},
    { day: 'Thursday', period: 5, teacher: 'Ms. Reshma', class: '3-C', subject: 'Data Structures Lab'},
    { day: 'Thursday', period: 7, teacher: 'Ms. Ranjani', class: '3-C', subject: 'Operating Systems'},
    { day: 'Thursday', period: 9, teacher: 'Ms. Reshma', class: '3-C', subject: 'Data Visualization with Python'},
    { day: 'Friday', period: 1, teacher: 'Training Faculty', class: '3-C', subject: 'Placement Training'},
    { day: 'Friday', period: 3, teacher: 'Ms. Ranjani', class: '3-C', subject: 'Operating Systems'},
    { day: 'Friday', period: 4, teacher: 'Ms. Bhagyalaxmi', class: '3-C', subject: 'Mathematics for Computer Science'},
    { day: 'Friday', period: 6, teacher: 'Ms. Sahana', class: '3-C', subject: 'Object Oriented Programming with Java'},
    { day: 'Friday', period: 8, teacher: 'Ms. Ranjani', class: '3-C', subject: 'Operating Systems'},
    // SEM 5A
    { day: 'Monday', period: 1, teacher: 'Training Faculty', class: '5-A', subject: 'Placement Training'},
    { day: 'Monday', period: 4, teacher: 'Dr. Soumya J Bhat', class: '5-A', subject: 'Computer Networks'},
    { day: 'Monday', period: 5, teacher: 'Ms. R. Soundharya', class: '5-A', subject: 'Computer Graphics'},
    { day: 'Monday', period: 6, teacher: 'Dr. Bharti Panjwani', class: '5-A', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '5-A', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 9, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Theory of Computation'},
    { day: 'Monday', period: 10, teacher: 'Mr. Prasad Pai', class: '5-A', subject: 'Software Engineering & Project Management'},
    { day: 'Monday', period: 11, teacher: 'Ms. Babitha Poojary', class: '5-A', subject: 'National Service Scheme (NSS)'},
    { day: 'Tuesday', period: 1, teacher: 'Dr. Sadananda L', class: '5-A', subject: 'Research Methodology and IPR'},
    { day: 'Tuesday', period: 2, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Theory of Computation'},
    { day: 'Tuesday', period: 4, teacher: 'Dr. Soumya J Bhat', class: '5-A', subject: 'Computer Networks'},
    { day: 'Tuesday', period: 5, teacher: 'Mr. Prasad Pai', class: '5-A', subject: 'Software Engineering & Project Management'},
    { day: 'Tuesday', period: 7, teacher: 'Ms. R. Soundharya', class: '5-A', subject: 'Computer Graphics'},
    { day: 'Tuesday', period: 8, teacher: 'Dr. Bharti Panjwani', class: '5-A', subject: 'Artificial Intelligence'},
    { day: 'Tuesday', period: 9, teacher: 'Training Faculty', class: '5-A', subject: 'Placement Training'},
    { day: 'Wednesday', period: 1, teacher: 'Mr. Prasad Pai', class: '5-A', subject: 'Software Engineering & Project Management'},
    { day: 'Wednesday', period: 2, teacher: 'Ms. R. Soundharya', class: '5-A', subject: 'Environmental Studies and E-Waste Management'},
    { day: 'Wednesday', period: 4, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Theory of Computation'},
    { day: 'Wednesday', period: 5, teacher: 'Dr. Sadananda L', class: '5-A', subject: 'Research Methodology and IPR'},
    { day: 'Wednesday', period: 7, teacher: 'Dr. Soumya J Bhat', class: '5-A', subject: 'Computer Networks'},
    { day: 'Wednesday', period: 9, teacher: 'Ms. Babitha Poojary', class: '5-A', subject: 'National Service Scheme (NSS)'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Theory of Computation'},
    { day: 'Thursday', period: 2, teacher: 'Dr. Soumya J Bhat', class: '5-A', subject: 'Computer Networks'},
    { day: 'Thursday', period: 4, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Web Technology Lab'},
    { day: 'Thursday', period: 7, teacher: 'Ms. Rukmini Bhat B', class: '5-A', subject: 'Mini Project'},
    { day: 'Friday', period: 1, teacher: 'Dr. Soumya J Bhat', class: '5-A', subject: 'Computer Networks'},
    { day: 'Friday', period: 2, teacher: 'Mr. Prasad Pai', class: '5-A', subject: 'Software Engineering & Project Management'},
    { day: 'Friday', period: 4, teacher: 'Dr. Sadananda L', class: '5-A', subject: 'Research Methodology and IPR'},
    { day: 'Friday', period: 5, teacher: 'Ms. Preethi M', class: '5-A', subject: 'Theory of Computation'},
    { day: 'Friday', period: 7, teacher: 'Ms. R. Soundharya', class: '5-A', subject: 'Computer Graphics'},
    { day: 'Friday', period: 8, teacher: 'Ms. Sanjana Kavatagi', class: '5-A', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 9, teacher: 'Dr. Bharti Panjwani', class: '5-A', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 10, teacher: 'Ms. Rukmini Bhat B', class: '5-A', subject: 'Mini Project'},
    // SEM 5B
    { day: 'Monday', period: 1, teacher: 'Ms. Preethi M', class: '5-B', subject: 'Web Technology Lab'},
    { day: 'Monday', period: 4, teacher: 'Ms. Reshma', class: '5-B', subject: 'Theory of Computation'},
    { day: 'Monday', period: 5, teacher: 'Ms. R. Soundharya', class: '5-B', subject: 'Computer Graphics'},
    { day: 'Monday', period: 6, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 9, teacher: 'Ms. Ashwitha C. Thomas', class: '5-B', subject: 'Software Engineering & Project Management'},
    { day: 'Monday', period: 10, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Computer Networks'},
    { day: 'Monday', period: 11, teacher: 'Ms. R. Soundharya', class: '5-B', subject: 'Environmental Studies and E-Waste Management'},
    { day: 'Tuesday', period: 1, teacher: 'Ms. Reshma', class: '5-B', subject: 'Theory of Computation'},
    { day: 'Tuesday', period: 2, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Research Methodology and IPR'},
    { day: 'Tuesday', period: 4, teacher: 'Training Faculty', class: '5-B', subject: 'Placement Training'},
    { day: 'Tuesday', period: 7, teacher: 'Ms. R. Soundharya', class: '5-B', subject: 'Computer Graphics'},
    { day: 'Tuesday', period: 8, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Tuesday', period: 9, teacher: 'Ms. Sanjana Kavatagi', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Tuesday', period: 10, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Computer Networks'},
    { day: 'Wednesday', period: 1, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Research Methodology and IPR'},
    { day: 'Wednesday', period: 2, teacher: 'Ms. Ashwitha C. Thomas', class: '5-B', subject: 'Software Engineering & Project Management'},
    { day: 'Wednesday', period: 4, teacher: 'Ms. Reshma', class: '5-B', subject: 'Theory of Computation'},
    { day: 'Wednesday', period: 5, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Computer Networks'},
    { day: 'Wednesday', period: 7, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Mini Project'},
    { day: 'Wednesday', period: 9, teacher: 'Ms. Babitha Poojary', class: '5-B', subject: 'National Service Scheme (NSS)'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Ashwitha C. Thomas', class: '5-B', subject: 'Software Engineering & Project Management'},
    { day: 'Thursday', period: 2, teacher: 'Ms. Reshma', class: '5-B', subject: 'Theory of Computation'},
    { day: 'Thursday', period: 4, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Computer Networks'},
    { day: 'Thursday', period: 5, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Research Methodology and IPR'},
    { day: 'Thursday', period: 7, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Mini Project'},
    { day: 'Friday', period: 1, teacher: 'Training Faculty', class: '5-B', subject: 'Placement Training'},
    { day: 'Friday', period: 3, teacher: 'Ms. Rukmini Bhat B', class: '5-B', subject: 'Computer Networks'},
    { day: 'Friday', period: 4, teacher: 'Ms. Ashwitha C. Thomas', class: '5-B', subject: 'Software Engineering & Project Management'},
    { day: 'Friday', period: 6, teacher: 'Ms. R. Soundharya', class: '5-B', subject: 'Computer Graphics'},
    { day: 'Friday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 8, teacher: 'Dr. Bharti Panjwani', class: '5-B', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 9, teacher: 'Ms. Reshma', class: '5-B', subject: 'Theory of Computation'},
    { day: 'Friday', period: 10, teacher: 'Ms. Babitha Poojary', class: '5-B', subject: 'National Service Scheme (NSS)'},
    // SEM 5C
    { day: 'Monday', period: 1, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Research Methodology and IPR'},
    { day: 'Monday', period: 2, teacher: 'Ms. M. S. Rajeshwari', class: '5-C', subject: 'Computer Networks'},
    { day: 'Monday', period: 4, teacher: 'Mr. Chandrashekar Rao Kuthyar', class: '5-C', subject: 'Software Engineering & Project Management'},
    { day: 'Monday', period: 5, teacher: 'Ms. R. Soundharya', class: '5-C', subject: 'Computer Graphics'},
    { day: 'Monday', period: 6, teacher: 'Dr. Bharti Panjwani', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Monday', period: 9, teacher: 'Ms. Sowmya N H', class: '5-C', subject: 'Theory of Computation'},
    { day: 'Monday', period: 11, teacher: 'Ms. Rukmini Bhat B', class: '5-C', subject: 'Mini Project'},
    { day: 'Tuesday', period: 1, teacher: 'Ms. Sowmya N H', class: '5-C', subject: 'Theory of Computation'},
    { day: 'Tuesday', period: 2, teacher: 'Ms. M. S. Rajeshwari', class: '5-C', subject: 'Computer Networks'},
    { day: 'Tuesday', period: 4, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Research Methodology and IPR'},
    { day: 'Tuesday', period: 5, teacher: 'Ms. R. Soundharya', class: '5-C', subject: 'Environmental Studies and E-Waste Management'},
    { day: 'Tuesday', period: 7, teacher: 'Ms. R. Soundharya', class: '5-C', subject: 'Computer Graphics'},
    { day: 'Tuesday', period: 8, teacher: 'Dr. Bharti Panjwani', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Tuesday', period: 9, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Tuesday', period: 10, teacher: 'Mr. Chandrashekar Rao Kuthyar', class: '5-C', subject: 'Software Engineering & Project Management'},
    { day: 'Tuesday', period: 11, teacher: 'Ms. Babitha Poojary', class: '5-C', subject: 'National Service Scheme (NSS)'},
    { day: 'Wednesday', period: 1, teacher: 'Mr. Chandrashekar Rao Kuthyar', class: '5-C', subject: 'Software Engineering & Project Management'},
    { day: 'Wednesday', period: 2, teacher: 'Ms. M. S. Rajeshwari', class: '5-C', subject: 'Computer Networks'},
    { day: 'Wednesday', period: 4, teacher: 'Training Faculty', class: '5-C', subject: 'Placement Training'},
    { day: 'Wednesday', period: 7, teacher: 'Ms. Sowmya N H', class: '5-C', subject: 'Theory of Computation'},
    { day: 'Wednesday', period: 9, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Research Methodology and IPR'},
    { day: 'Wednesday', period: 11, teacher: 'Ms. Babitha Poojary', class: '5-C', subject: 'National Service Scheme (NSS)'},
    { day: 'Thursday', period: 1, teacher: 'Ms. Preethi M', class: '5-C', subject: 'Web Technology Lab'},
    { day: 'Thursday', period: 3, teacher: 'Mr. Chandrashekar Rao Kuthyar', class: '5-C', subject: 'Software Engineering & Project Management'},
    { day: 'Thursday', period: 4, teacher: 'Ms. Sowmya N H', class: '5-C', subject: 'Theory of Computation'},
    { day: 'Thursday', period: 7, teacher: 'Ms. Rukmini Bhat B', class: '5-C', subject: 'Mini Project'},
    { day: 'Friday', period: 1, teacher: 'Ms. M. S. Rajeshwari', class: '5-C', subject: 'Computer Networks'},
    { day: 'Friday', period: 2, teacher: 'Ms. Sowmya N H', class: '5-C', subject: 'Theory of Computation'},
    { day: 'Friday', period: 4, teacher: 'Training Faculty', class: '5-C', subject: 'Placement Training'},
    { day: 'Friday', period: 6, teacher: 'Ms. R. Soundharya', class: '5-C', subject: 'Computer Graphics'},
    { day: 'Friday', period: 7, teacher: 'Ms. Sanjana Kavatagi', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 8, teacher: 'Dr. Bharti Panjwani', class: '5-C', subject: 'Artificial Intelligence'},
    { day: 'Friday', period: 10, teacher: 'Ms. M. S. Rajeshwari', class: '5-C', subject: 'Computer Networks'},
];


let dbAbsenceRequests = [];
let nextAbsenceId = 1;

// --- UTILITY FUNCTIONS ---
const buildTimetableFromSlots = (slots, days, periods) => {
    const timetable = {};
    days.forEach(day => {
        timetable[day] = [];
        for (let i = 1; i <= periods.length; i++) {
            const slot = slots.find(s => s.day === day && s.period === i);
            if (slot) {
                timetable[day].push({ class: slot.class, subject: slot.subject, teacher: slot.teacher });
            } else {
                 timetable[day].push({
                    class: 'Free',
                    subject: 'Free Period',
                    teacher: null
                });
            }
        }
    });
    return timetable;
};

const filterSlotsByClass = (masterSlots, classIdentifier) => {
    return masterSlots.filter(slot => slot.class === classIdentifier);
};

// --- BUILD TIMETABLES ---
const dbTimetable3A = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-A'), daysOfWeek, periods);
const dbTimetable3B = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-B'), daysOfWeek, periods);
const dbTimetable3C = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-C'), daysOfWeek, periods);
const dbTimetable5A = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-A'), daysOfWeek, periods);
const dbTimetable5B = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-B'), daysOfWeek, periods);
const dbTimetable5C = buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-C'), daysOfWeek, periods);
const masterTimetable = buildTimetableFromSlots(dbMasterTimetableSlots, daysOfWeek, periods);
const uniqueSubjects = Array.from(new Set(dbMasterTimetableSlots.map(slot => slot.subject)));

// Populate teacher subject expertise from master timetable slots
const teacherSubjectsMap = {};
dbMasterTimetableSlots.forEach(slot => {
    if (!teacherSubjectsMap[slot.teacher]) {
        teacherSubjectsMap[slot.teacher] = new Set();
    }
    teacherSubjectsMap[slot.teacher].add(slot.subject);
});
dbTeachers.forEach(teacher => {
    const subjectsSet = teacherSubjectsMap[teacher.name];
    teacher.subjects = subjectsSet ? Array.from(subjectsSet) : [];
});

// --- API ENDPOINTS ---

app.get('/', (req, res) => {
    res.json({ message: 'Intelligent Timetable Management System API is running!' });
});

app.get('/api/initial-data', (req, res) => {
    res.json({
        timetables: {
            sem3a: dbTimetable3A,
            sem3b: dbTimetable3B,
            sem3c: dbTimetable3C,
            sem5a: dbTimetable5A,
            sem5b: dbTimetable5B,
            sem5c: dbTimetable5C,
        },
        masterTimetable: masterTimetable,
        teachers: dbTeachers,
        uniqueSubjects,
        daysOfWeek,
        periods: periods.map(p => ({id: p})), // Send simple array of period numbers
        absenceRequests: dbAbsenceRequests,
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = dbUsers.find(u => u.email === email && u.password === password);
    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.patch('/api/timetable', (req, res) => {
    const { day, period, newSlotData } = req.body;
    
    // Find the master slot to update. We need the class name for this.
    // The newSlotData should contain the class.
    const className = newSlotData.class;
    const slotIndex = dbMasterTimetableSlots.findIndex(s => s.day === day && s.period === period && s.class === className);
    
    if(slotIndex > -1) {
        // Update the master list of slots
        dbMasterTimetableSlots[slotIndex] = { ...dbMasterTimetableSlots[slotIndex], ...newSlotData };

        // Rebuild all timetables since the master data has changed.
        // This is inefficient but simple for an in-memory setup.
        const allTimetables = {
            sem3a: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-A'), daysOfWeek, periods),
            sem3b: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-B'), daysOfWeek, periods),
            sem3c: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '3-C'), daysOfWeek, periods),
            sem5a: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-A'), daysOfWeek, periods),
            sem5b: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-B'), daysOfWeek, periods),
            sem5c: buildTimetableFromSlots(filterSlotsByClass(dbMasterTimetableSlots, '5-C'), daysOfWeek, periods),
        };
        const newMaster = buildTimetableFromSlots(dbMasterTimetableSlots, daysOfWeek, periods);

        // This endpoint should ideally return the whole new state or the specific timetable.
        // Returning the new master for simplicity in this version.
        res.json(newMaster);
    } else {
        res.status(404).json({ message: 'Slot not found in master timetable.' });
    }
});

app.post('/api/absence-requests', (req, res) => {
    const newRequest = {
        ...req.body,
        id: nextAbsenceId++,
        timestamp: new Date(),
        status: 'PENDING_ADMIN_ACTION',
    };
    dbAbsenceRequests.push(newRequest);
    res.status(201).json(newRequest);
});

app.post('/api/absence-requests/tomorrow', (req, res) => {
    const { user, reason } = req.body;
    if (!user || !user.name) {
        return res.status(400).json({ message: "Invalid user provided." });
    }

    const today = new Date();
    const tomorrowIndex = (today.getDay() % 7) ; 
    const tomorrowDay = daysOfWeek[tomorrowIndex];

    if (!tomorrowDay || tomorrowIndex > 4) { 
      return res.status(400).json({ message: "Cannot report absence for a weekend." });
    }

    const teacherClasses = dbMasterTimetableSlots.filter(slot => slot.day === tomorrowDay && slot.teacher === user.name);

    if (teacherClasses.length === 0) {
        return res.status(404).json({ message: "You have no classes scheduled for tomorrow." });
    }

    const createdRequests = [];
    teacherClasses.forEach(slot => {
        const newRequest = {
            absentTeacherId: user.teacherId,
            absentTeacherName: user.name,
            day: tomorrowDay,
            period: slot.period,
            slot: { class: slot.class, subject: slot.subject, teacher: slot.teacher },
            reasoning: reason,
            id: nextAbsenceId++,
            timestamp: new Date(),
            status: 'PENDING_ADMIN_ACTION',
        };
        dbAbsenceRequests.push(newRequest);
        createdRequests.push(newRequest);
    });

    res.status(201).json(createdRequests);
});

app.post('/api/absence-requests/full-day', (req, res) => {
    const { teacherName, day, reason } = req.body;

    if (!teacherName || !day) {
        return res.status(400).json({ message: "Teacher name and day are required." });
    }

    if (!daysOfWeek.includes(day)) {
        return res.status(400).json({ message: "Invalid day provided." });
    }

    const user = dbUsers.find(u => u.name === teacherName && u.teacherId);
    if (!user) {
        return res.status(404).json({ message: "Teacher not found." });
    }

    const teacherClasses = dbMasterTimetableSlots.filter(slot => slot.day === day && slot.teacher === teacherName);

    if (teacherClasses.length === 0) {
        return res.status(404).json({ message: `${teacherName} has no classes scheduled on ${day}.` });
    }

    const createdRequests = [];
    teacherClasses.forEach(slot => {
        const newRequest = {
            absentTeacherId: user.teacherId,
            absentTeacherName: teacherName,
            day,
            period: slot.period,
            slot: { class: slot.class, subject: slot.subject, teacher: slot.teacher },
            reasoning: reason,
            id: nextAbsenceId++,
            timestamp: new Date(),
            status: 'PENDING_ADMIN_ACTION',
        };
        dbAbsenceRequests.push(newRequest);
        createdRequests.push(newRequest);
    });

    res.status(201).json(createdRequests);
});


app.patch('/api/absence-requests/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const requestIndex = dbAbsenceRequests.findIndex(r => r.id === parseInt(id));
    if (requestIndex !== -1) {
        dbAbsenceRequests[requestIndex] = { ...dbAbsenceRequests[requestIndex], ...updates };
        res.json(dbAbsenceRequests[requestIndex]);
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
});

app.post('/api/find-substitute', async (req, res) => {
    const { day, period, subject, absentTeacherId } = req.body;
    
    const busyTeachers = new Set(
        dbMasterTimetableSlots
            .filter(slot => slot.day === day && slot.period === period)
            .map(slot => slot.teacher)
    );

    const availableTeachers = dbTeachers
        .filter(teacher => teacher.id !== absentTeacherId && !busyTeachers.has(teacher.name))
        .map(t => ({ name: t.name, subjects: t.subjects || [] }));

    if (availableTeachers.length === 0) {
        return res.status(404).json({ message: "No teachers are available for substitution at this time." });
    }

    const buildFallbackResponse = () => {
        const subjectMatches = availableTeachers.filter(t => t.subjects.includes(subject));
        const selection = subjectMatches[0] || availableTeachers[0];
        const reasoning = subjectMatches.length > 0
            ? `${selection.name} already teaches ${subject}, so they can seamlessly cover the class.`
            : `${selection.name} is free during this period and can handle CSE classes.`;
        return {
            substituteTeacherName: selection.name,
            reasoning: reasoning
        };
    };
    
    if (!ai) {
        return res.json(buildFallbackResponse());
    }
    
    const prompt = `
        You are an intelligent timetable management assistant for a college (SMVITM).
        Your task is to find the best substitute teacher.

        CONTEXT:
        - Subject of the class: ${subject}
        - Day and Period: ${day}, Period ${period}

        LIST OF AVAILABLE TEACHERS (who have a free period now):
        ${JSON.stringify(availableTeachers, null, 2)}

        YOUR TASK:
        Analyze the list and find the best substitute.
        Prioritize teachers whose subjects include "${subject}". If multiple teachers match, pick one.
        If no exact match is found, select any other available teacher who is suitable for a CSE department class.
        Provide a brief, helpful reason for your choice.
        Respond with ONLY a JSON object matching the required schema.
    `;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        substituteTeacherName: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ['substituteTeacherName', 'reasoning'],
                },
            }
        });
        
        const jsonText = (response.text || '').trim();
        const parsedResult = JSON.parse(jsonText);
        res.json(parsedResult);

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.json(buildFallbackResponse());
    }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
