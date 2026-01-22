
import React, { useState, useEffect } from 'react';
import { CRMData, DealStage, Contact, Deal, Task, Action } from './types';
import { Icons } from './constants';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Pipeline from './components/Pipeline';
import CalendarView from './components/CalendarView';
import TasksView from './components/TasksView';
import DataCenter from './components/DataCenter';
import { supabase } from './services/supabase';

const INITIAL_DATA: CRMData = {
  contacts: [
    { 
      id: 'c_linda', 
      name: 'Linda King', 
      email: 'linda@kingenterprises.com', 
      phone: '555-0789', 
      company: 'King Global', 
      role: 'CEO', 
      lastContact: '2023-11-15',
      notes: ["Interested in full CRM migration."],
      actions: [
        { id: 'a_linda_1', type: 'Email', description: 'Sent the first email suggested in insights.', timestamp: '2023-11-15 09:30 AM' },
        { id: 'a_linda_0', type: 'Note', description: 'Initial lead discovery.', timestamp: '2023-11-14 02:00 PM' }
      ]
    },
    { 
      id: 'c1', 
      name: 'Alex Rivera', 
      email: 'alex@techflow.io', 
      phone: '555-0101', 
      company: 'TechFlow', 
      role: 'CTO', 
      lastContact: '2023-10-25',
      notes: ["Met at SaaS conference. Interested in scaling solutions."],
      actions: [
        { id: 'a1', type: 'Meeting', description: 'Met at SaaS conference. Interested in scaling.', timestamp: '2023-10-25 10:00 AM' }
      ]
    }
  ],
  deals: [
    { id: 'd_linda', title: 'King Enterprises Migration', value: 12500, stage: DealStage.QUALIFIED, contactId: 'c_linda', expectedCloseDate: '2024-01-15' },
    { id: 'd1', title: 'TechFlow Integration', value: 45000, stage: DealStage.NEGOTIATION, contactId: 'c1', expectedCloseDate: '2023-12-15' }
  ],
  tasks: [
    { id: 't1', title: 'Send proposal to Sarah', description: 'Draft based on yesterday\'s call', dueDate: '2023-11-05', priority: 'High', status: 'Pending', taskType: 'Email' }
  ]
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'contacts' | 'pipeline' | 'calendar' | 'datacenter' | 'tasks'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local' | 'error'>('local');
  
  const [data, setData] = useState<CRMData>(() => {
    const saved = localStorage.getItem('nova_crm_persistent_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.contacts)) return parsed;
      } catch (e) {
        console.error("Failed to parse local data:", e);
      }
    }
    return INITIAL_DATA;
  });

  // Load cloud data and MERGE with local data instead of overwriting
  useEffect(() => {
    async function loadAndMergeCloudData() {
      if (!supabase) return;
      setSyncStatus('syncing');
      try {
        const { data: cloudContacts } = await supabase.from('contacts').select('*');
        const { data: cloudDeals } = await supabase.from('deals').select('*');
        const { data: cloudTasks } = await supabase.from('tasks').select('*');

        if (cloudContacts) {
          setData(prev => {
            // Smart Merge: Keep local contacts if they don't exist in the cloud yet
            const mergedContacts = [...(cloudContacts as Contact[])];
            prev.contacts.forEach(lc => {
              if (!mergedContacts.find(cc => cc.id === lc.id)) {
                mergedContacts.push(lc);
              }
            });

            return {
              contacts: mergedContacts,
              deals: (cloudDeals as Deal[]) || prev.deals,
              tasks: (cloudTasks as Task[]) || prev.tasks
            };
          });
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error("Cloud sync error:", err);
        setSyncStatus('error');
      }
    }
    loadAndMergeCloudData();
  }, []);

  useEffect(() => {
    localStorage.setItem('nova_crm_persistent_data', JSON.stringify(data));
  }, [data]);

  const handleAddContact = async (newContact: Contact, aiPlan?: any) => {
    const dealId = `d${Date.now()}`;
    let updatedDeals = [...data.deals];
    let updatedTasks = [...data.tasks];

    if (aiPlan) {
      updatedDeals.push({
        id: dealId,
        title: `${newContact.company} Opportunity`,
        value: 0,
        stage: (aiPlan.suggestedStage as DealStage) || DealStage.LEAD,
        contactId: newContact.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      updatedTasks.push({
        id: `t${Date.now()}`,
        title: aiPlan.nextStep || 'Follow up',
        description: `Plan: ${aiPlan.summary || 'Start relationship'}`,
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'High',
        status: 'Pending',
        taskType: 'Call',
        relatedContactId: newContact.id
      });
    }

    // Update local state immediately
    setData(prev => ({ 
      ...prev, 
      contacts: [...prev.contacts, newContact],
      deals: updatedDeals,
      tasks: updatedTasks
    }));

    // Attempt cloud sync
    if (supabase) {
      setSyncStatus('syncing');
      try {
        await supabase.from('contacts').insert([newContact]);
        if (aiPlan) {
          await supabase.from('deals').insert([{
             id: dealId,
             contact_id: newContact.id,
             title: `${newContact.company} Opportunity`,
             value: 0,
             stage: aiPlan.suggestedStage,
             expected_close_date: updatedDeals[updatedDeals.length - 1].expectedCloseDate
          }]);
        }
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error');
      }
    }
  };

  const handleUpdateContact = async (updatedContact: Contact) => {
    setData(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === updatedContact.id ? updatedContact : c)
    }));
    if (supabase) {
      setSyncStatus('syncing');
      await supabase.from('contacts').update(updatedContact).eq('id', updatedContact.id);
      setSyncStatus('synced');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Are you sure? This will remove all associated deals and history.")) {
      setData(prev => ({
        ...prev,
        contacts: prev.contacts.filter(c => c.id !== id),
        deals: prev.deals.filter(d => d.contactId !== id),
        tasks: prev.tasks.filter(t => t.relatedContactId !== id)
      }));
      if (supabase) {
        setSyncStatus('syncing');
        await supabase.from('contacts').delete().eq('id', id);
        setSyncStatus('synced');
      }
      return true;
    }
    return false;
  };

  const handleAddTask = async (task: Task) => {
    setData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    if (supabase) {
      await supabase.from('tasks').insert([task]);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' } : t)
    }));
  };

  const handleLogAction = async (contactId: string, action: Omit<Action, 'id' | 'timestamp'>) => {
    const timestamp = new Date().toLocaleString();
    const newAction: Action = { ...action, id: `a${Date.now()}`, timestamp };
    setData(prev => {
      const updatedContacts = prev.contacts.map(c => 
        c.id === contactId 
          ? { ...c, actions: [...(c.actions || []), newAction], lastContact: new Date().toISOString().split('T')[0] } 
          : c
      );
      if (supabase) {
        const target = updatedContacts.find(c => c.id === contactId);
        if (target) supabase.from('contacts').update({ actions: target.actions, last_contact: target.lastContact }).eq('id', contactId);
      }
      return { ...prev, contacts: updatedContacts };
    });
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-1 ${
        activeView === id 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
        <div className="flex items-center gap-3 px-4 mb-10 mt-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">N</div>
          <span className="text-xl font-bold tracking-tight">NovaCRM</span>
        </div>
        <nav className="flex-1">
          <NavItem id="dashboard" icon={Icons.Dashboard} label="Dashboard" />
          <NavItem id="contacts" icon={Icons.Users} label="Contacts" />
          <NavItem id="pipeline" icon={Icons.Pipeline} label="Pipeline" />
          <NavItem id="tasks" icon={Icons.Tasks} label="To-Do List" />
          <NavItem id="calendar" icon={Icons.Calendar} label="Scheduling" />
          <NavItem id="datacenter" icon={Icons.Settings} label="Data Center" />
        </nav>
        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">SB</div>
             <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">Steve</p>
                <p className="text-[10px] text-slate-500 truncate">vdosalon@gmail.com</p>
             </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-emerald-500' : 
              syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 
              syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-400'
            }`}></div>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              {syncStatus === 'synced' ? 'Cloud Synced' : 
               syncStatus === 'syncing' ? 'Syncing...' : 
               syncStatus === 'error' ? 'Sync Error' : 'Local Only'}
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
        <div className="max-w-6xl mx-auto h-full">
          {activeView === 'dashboard' && <Dashboard data={data} onToggleTask={handleToggleTask} />}
          {activeView === 'contacts' && (
            <Contacts 
              contacts={data.contacts} 
              onAddContact={handleAddContact} 
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onLogAction={handleLogAction}
              onAddTask={handleAddTask}
            />
          )}
          {activeView === 'pipeline' && <Pipeline deals={data.deals} contacts={data.contacts} />}
          {activeView === 'tasks' && <TasksView tasks={data.tasks} contacts={data.contacts} onToggleTask={handleToggleTask} />}
          {activeView === 'calendar' && <CalendarView tasks={data.tasks} />}
          {activeView === 'datacenter' && (
            <DataCenter 
              data={data} 
              onImport={(imported) => setData(imported)} 
              onReset={() => { if(confirm("Permanently reset?")) { localStorage.removeItem('nova_crm_persistent_data'); window.location.reload(); } }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
