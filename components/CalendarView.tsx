
import React from 'react';
import { Icons } from '../constants';
import { Task } from '../types';

// Defining props interface to match usage in App.tsx
interface CalendarViewProps {
  tasks: Task[];
}

// Updated component to accept tasks prop and resolve the IntrinsicAttributes error reported in App.tsx
const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const calendlyUrl = "https://calendly.com/transwestmedia/15min";
  const googleCalUser = "vdosalon@gmail.com";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Schedules & Integrations</h1>
        <p className="text-slate-500">Manage your connected accounts and booking links.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Icons.Calendar />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Google Calendar</h3>
              <p className="text-sm text-slate-500">{googleCalUser}</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Your primary calendar for events and personal scheduling. Use this to track all internal and external meetings.
          </p>
          <a 
            href={`https://calendar.google.com/calendar/u/0/r?authuser=${googleCalUser}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition"
          >
            Open Google Calendar <Icons.External />
          </a>
        </div>

        {/* Calendly Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Icons.External />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Calendly</h3>
              <p className="text-sm text-slate-500">15-Minute Sync</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Automatic booking link for leads and clients. Share this link to allow others to book time in your 15-minute slot.
          </p>
          <div className="space-y-3">
            <a 
              href={calendlyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition"
            >
              Preview Booking Page <Icons.External />
            </a>
            <button 
              onClick={() => navigator.clipboard.writeText(calendlyUrl)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              Copy Booking Link
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4">
        <div className="text-indigo-500 mt-1">
          <Icons.Sparkles />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Nova Integration Tip</h4>
          <p className="text-indigo-700 text-sm mt-1 leading-relaxed">
            When you're in the <b>Contacts</b> view, Nova AI can automatically include your Calendly link in draft emails if it detects a request for a meeting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
