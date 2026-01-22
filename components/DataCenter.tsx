
import React, { useState } from 'react';
import { CRMData } from '../types';
import { Icons } from '../constants';
import { supabase } from '../services/supabase';

interface DataCenterProps {
  data: CRMData;
  onImport: (data: CRMData) => void;
  onReset: () => void;
}

const DataCenter: React.FC<DataCenterProps> = ({ data, onImport, onReset }) => {
  const [showSql, setShowSql] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  const sqlSchema = `-- PASTE THIS IN SUPABASE SQL EDITOR
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  last_contact DATE,
  notes TEXT[],
  actions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT,
  value NUMERIC,
  stage TEXT,
  expected_close_date DATE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  related_contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  due_date DATE,
  priority TEXT,
  status TEXT
);`;

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Mission Control</h1>
          <p className="text-slate-500 mt-1 text-lg">Your CRM is now live. Monitor your connection and data here.</p>
        </div>
        <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 flex items-center gap-2 ${supabase ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-amber-50 border-amber-500 text-amber-700'}`}>
          <div className={`w-2 h-2 rounded-full ${supabase ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          {supabase ? 'SYSTEMS ONLINE: CLOUD CONNECTED' : 'SYSTEMS LOCAL: CHECK VERCEL KEYS'}
        </div>
      </header>

      <section className="space-y-6">
        <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden transition-colors duration-700 ${supabase ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
          <div className="relative z-10">
            {supabase ? (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-bold mb-4">You are officially "On the Grid"</h2>
                <p className="text-emerald-100 mb-8 max-w-2xl text-lg leading-relaxed">
                  NovaCRM is successfully communicating with your Supabase Cloud Locker. Your contacts, deals, and tasks are being backed up in real-time.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setShowSql(!showSql)} className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition">
                    View Cloud SQL Schema
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-3xl font-bold mb-4">Almost Finished!</h2>
                <p className="text-indigo-100 mb-10 max-w-2xl text-lg leading-relaxed">
                  If you are seeing this on your <b>Vercel URL</b>, you likely forgot to add your Environment Variables in the Vercel Settings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setShowTroubleshooter(!showTroubleshooter)}
                    className="bg-white text-indigo-600 p-6 rounded-3xl font-bold text-left hover:bg-indigo-50 transition shadow-xl"
                  >
                    <p className="text-xs uppercase opacity-60 mb-1">Help</p>
                    <p className="text-lg">Where is my App Link?</p>
                  </button>
                  <button 
                    onClick={() => setShowSql(!showSql)}
                    className="bg-indigo-500 text-white p-6 rounded-3xl font-bold text-left hover:bg-indigo-400 transition border border-white/10"
                  >
                    <p className="text-xs uppercase opacity-60 mb-1">Database</p>
                    <p className="text-lg">Run Supabase SQL Code</p>
                  </button>
                </div>
              </div>
            )}

            {showTroubleshooter && (
              <div className="mt-8 p-8 bg-slate-900/40 rounded-3xl border border-white/10 animate-in slide-in-from-top-4">
                <h3 className="font-bold text-xl mb-4 text-white">Finding your Vercel Link</h3>
                <ul className="space-y-4 text-indigo-100 text-sm">
                  <li className="flex gap-3">
                    <span className="font-bold text-white">1.</span>
                    Log into <b>vercel.com</b> and click your project <b>"my-crm-app"</b>.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-white">2.</span>
                    Look for the <b>"DOMAINS"</b> section or the <b>"VISIT"</b> button.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-white">3.</span>
                    The link looks like: <code>https://my-crm-app.vercel.app</code>
                  </li>
                </ul>
              </div>
            )}

            {showSql && (
              <div className="mt-8 animate-in slide-in-from-top-4">
                <div className="bg-slate-900 rounded-3xl p-6 font-mono text-sm text-indigo-300 relative border border-white/10 shadow-inner">
                  <pre className="overflow-x-auto whitespace-pre-wrap">{sqlSchema}</pre>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(sqlSchema);
                      alert("SQL Copied! Paste this into Supabase SQL Editor.");
                    }}
                    className="absolute top-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg"
                  >
                    COPY SQL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
            <Icons.Download />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Export Local Data</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Download your browser's local cache as a JSON file. Always good to have a manual backup.
          </p>
          <button 
            onClick={() => {
                const backup = { ...data, backupDate: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nova-crm-local-backup.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition shadow-lg"
          >
            Generate JSON Export
          </button>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-6">
            <Icons.Trash />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Factory Reset</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Clear all local data in this specific browser. This will <b>not</b> delete your Supabase cloud data.
          </p>
          <button 
            onClick={onReset}
            className="w-full border-2 border-red-100 text-red-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition"
          >
            Clear Local Memory
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">NovaCRM Engine v1.0.4 • Created for Steve</p>
      </div>
    </div>
  );
};

export default DataCenter;
