
import React, { useState, useEffect } from 'react';
import type { TimetableSlot } from '../types';

interface EditSlotModalProps {
    slotInfo: {
        day: string;
        period: number;
        slot: TimetableSlot;
    };
    onSave: (day: string, period: number, updatedSlot: Partial<TimetableSlot>) => void;
    onClose: () => void;
    teacherName: string;
    allSubjects: string[];
}

const EditSlotModal: React.FC<EditSlotModalProps> = ({ slotInfo, onSave, onClose, teacherName, allSubjects }) => {
    const isInitiallyFree = slotInfo.slot.subject === 'Free Period';
    const [subject, setSubject] = useState(isInitiallyFree ? '' : slotInfo.slot.subject);
    const [className, setClassName] = useState(isInitiallyFree ? '' : slotInfo.slot.class);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !className) {
            alert('Please fill out both Subject and Class fields.');
            return;
        }
        const updatedSlot = {
            subject,
            class: className,
            teacher: teacherName,
        };
        onSave(slotInfo.day, slotInfo.period, updatedSlot);
    };

    const handleMarkAsFree = () => {
        const freeSlot = {
            subject: 'Free Period',
            class: 'Free',
            teacher: null,
        };
        onSave(slotInfo.day, slotInfo.period, freeSlot);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform animate-slide-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-dark">Edit Timetable Slot</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Editing for <span className="font-semibold">{teacherName}</span> on <span className="font-semibold">{slotInfo.day}, Period {slotInfo.period}</span>.
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <select
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            required
                        >
                            <option value="" disabled>Select a subject</option>
                            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="class" className="block text-sm font-medium text-gray-700">Class</label>
                        <input
                            type="text"
                            id="class"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                            placeholder="e.g., 10-A"
                            required
                        />
                    </div>
                    
                    <div className="pt-4 space-y-2">
                         <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={handleMarkAsFree}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Mark as Free Period
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-gray-600 hover:text-brand-dark"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSlotModal;
