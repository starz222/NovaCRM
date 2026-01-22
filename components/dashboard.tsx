
import React, { useEffect, useState } from 'react';
import { CRMData, DealStage } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDealSummary } from '../services/geminiService';
import { Icons } from '../constants';

interface DashboardProps {
  data: CRMData;
  onToggleTask?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onToggleTask }) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!data.deals.length) return;
      setLoadingAnalysis(true);
      const result = await getDealSummary(data.deals);
      setAiAnalysis(result);
      setLoadingAnalysis(false);
    };
    fetchAnalysis();
  }, [data.deals]);

  const totalValue = data.deals.reduce((sum, d) => sum + d.value, 0);
  const stageData = Object.values(DealStage).map(stage => ({
    name: stage,
    count: data.deals.filter(d => d.stage === stage).length
  }));

  const pendingTasks = data.tasks.filter(t => t.status === 'Pending').slice(0, 4);
  
  // Get recently added contacts (reverse chronological based on ID timestamp if possible)
  const recentContacts = [...data.contacts].reverse().slice(0, 3);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Business Overview</h1>
        <p className="text-slate-500">Welcome back. vdosalon@gmail.com is currently logged in.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: data.contacts.length, color: 'border-blue-500' },
          { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, color: 'border-emerald-500' },
          { label: 'Pending Steps', value: data.tasks.filter(t => t.status === 'Pending').length, color: 'border-indigo-500' },
          { label: 'Win Rate', value: '42%', color: 'border-amber-500' }
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${stat.color}`}>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Pipeline Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Today's Agenda</h3>
                <button className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">All Tasks</button>
              </div>
              <div className="space-y-4">
                {pendingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition group">
                    <button 
                      onClick={() => onToggleTask?.(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{task.title}</p>
                      <p className="text-[10px] text-slate-500">{task.taskType} • Due {task.dueDate}</p>
                    </div>
                  </div>
                ))}
                {pendingTasks.length === 0 && <p className="text-center py-8 text-slate-400 italic text-sm">No tasks for today.</p>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Recently Added</h3>
                <button className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">All Contacts</button>
              </div>
              <div className="space-y-4">
                {recentContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate">{contact.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{contact.company}</p>
                    </div>
                  </div>
                ))}
                {recentContacts.length === 0 && <p className="text-center py-8 text-slate-400 italic text-sm">No contacts yet.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.Sparkles /></div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Icons.Sparkles /> Pipeline Intelligence</h3>
          {loadingAnalysis ? (
            <div className="animate-pulse space-y-4 flex-1">
              <div className="h-4 bg-indigo-800 rounded w-full"></div>
              <div className="h-4 bg-indigo-800 rounded w-5/6"></div>
              <div className="h-4 bg-indigo-800 rounded w-2/3"></div>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{aiAnalysis.healthScore}</span>
                <span className="text-indigo-300 text-sm">Health Score</span>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed">{aiAnalysis.summary}</p>
              {aiAnalysis.riskDeals?.length > 0 && (
                <div className="bg-indigo-800/50 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase mb-2">High Risk Deals</p>
                  <ul className="space-y-2">
                    {aiAnalysis.riskDeals.map((risk: string, i: number) => (
                      <li key={i} className="text-xs flex gap-2"><span>⚠️</span> {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-indigo-300 text-center italic text-sm px-4">
              Nova AI will provide pipeline insights once deals are added.
            </div>
          )}
          <div className="mt-8 pt-6 border-t border-indigo-800">
             <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest mb-2">Connected Calendar</p>
             <p className="text-xs font-bold">vdosalon@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
