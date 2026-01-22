
import React, { useState, useRef } from 'react';
import { Contact, Action, Task, ActivityType } from '../types';
import { Icons } from '../constants';
import { generateLeadInsight, suggestEmailDraft, analyzeNewContact } from '../services/geminiService';

interface ContactsProps {
  contacts: Contact[];
  onAddContact?: (newContact: Contact, aiPlan?: any) => void;
  onUpdateContact?: (updatedContact: Contact) => void;
  onDeleteContact?: (id: string) => boolean | Promise<boolean>;
  onLogAction?: (contactId: string, action: Omit<Action, 'id' | 'timestamp'>) => void;
  onAddTask?: (task: Task) => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, onAddContact, onUpdateContact, onDeleteContact, onLogAction, onAddTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState<'insight' | 'email' | 'adding' | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [newLogNote, setNewLogNote] = useState('');
  const [scheduledSteps, setScheduledSteps] = useState<Set<number>>(new Set());
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  const [newForm, setNewForm] = useState({ name: '', email: '', phone: '', company: '', role: '', notes: '' });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [importedContacts, setImportedContacts] = useState<Partial<Contact>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownerEmail = "vdosalon@gmail.com";
  const calendlyUrl = "https://calendly.com/transwestmedia/15min";

  const filteredContacts = (contacts || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGetInsight = async (contact: Contact) => {
    setSelectedContact(contact);
    setInsight(null);
    setIsEditing(false);
    setLoading('insight');
    const result = await generateLeadInsight(contact, contact.notes || []);
    setInsight(result);
    setLoading(null);
  };

  const handleStartEditing = (contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) return;
    setEditForm({ ...target });
    setIsEditing(true);
    if (contact) setSelectedContact(contact);
  };

  const handleSaveEdit = () => {
    if (!selectedContact || !onUpdateContact) return;
    const updated = { ...selectedContact, ...editForm } as Contact;
    const timestamp = new Date().toLocaleString();
    const updateAction: Action = {
      id: `a-edit-${Date.now()}`,
      type: 'Note',
      description: 'Contact information manually updated.',
      timestamp
    };
    updated.actions = [...(updated.actions || []), updateAction];
    onUpdateContact(updated);
    setSelectedContact(updated);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (selectedContact && onDeleteContact) {
      const success = await onDeleteContact(selectedContact.id);
      if (success) {
        setSelectedContact(null);
        setInsight(null);
      }
    }
  };

  const handleDraftEmail = async (contact: Contact) => {
    setSelectedContact(contact);
    setShowEmailModal(true);
    setLoading('email');
    const result = await suggestEmailDraft(contact, `Include my booking link: ${calendlyUrl}`);
    setEmailDraft(result);
    setLoading(null);
  };

  const handleLogManualAction = () => {
    if (!selectedContact || !newLogNote.trim()) return;
    onLogAction?.(selectedContact.id, { type: 'Note', description: newLogNote });
    const timestamp = new Date().toLocaleString();
    const updated = {
      ...selectedContact,
      actions: [...(selectedContact.actions || []), { id: `tmp-${Date.now()}`, type: 'Note' as const, description: newLogNote, timestamp }]
    };
    setSelectedContact(updated);
    setNewLogNote('');
  };

  const handleSendEmail = () => {
    if (!selectedContact || !emailDraft) return;
    onLogAction?.(selectedContact.id, { 
      type: 'Email', 
      description: `Sent follow-up email with booking link.` 
    });
    window.location.href = `mailto:${selectedContact.email}?cc=${ownerEmail}&subject=Follow up&body=${encodeURIComponent(emailDraft)}`;
    setShowEmailModal(false);
  };

  const handleAIAnalysis = async () => {
    if (!newForm.name || !newForm.notes) return alert("Need name and notes for AI analysis.");
    setLoading('adding');
    const analysis = await analyzeNewContact(newForm.name, newForm.company, newForm.notes);
    setAiAnalysis(analysis);
    setLoading(null);
  };

  const handleScheduleStep = (step: any, index: number) => {
    if (!onAddTask) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (step.delayDays || 0));
    
    const task: Task = {
      id: `t-plan-${Date.now()}-${index}`,
      title: step.title,
      description: `Step ${index + 1} of Nova Plan for ${newForm.name}`,
      dueDate: dueDate.toISOString().split('T')[0],
      priority: 'High',
      status: 'Pending',
      taskType: step.type as ActivityType,
      relatedContactId: `temp-${Date.now()}` // Will be updated on final save if needed, but for now we'll just track it
    };
    
    onAddTask(task);
    setScheduledSteps(prev => new Set(prev).add(index));
  };

  const getGCalLink = (step: any) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (step.delayDays || 0));
    const start = dueDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = dueDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(step.title)}&details=${encodeURIComponent('NovaCRM suggested follow-up step.')}&dates=${start}/${end}&sf=true&output=xml`;
  };

  const handleSaveContact = () => {
    const newContact: Contact = {
      id: `c${Date.now()}`,
      name: newForm.name,
      email: newForm.email,
      phone: newForm.phone,
      company: newForm.company,
      role: newForm.role,
      lastContact: new Date().toISOString().split('T')[0],
      notes: [newForm.notes],
      actions: [{
        id: `a${Date.now()}`,
        type: 'Note',
        description: 'Contact created.',
        timestamp: new Date().toLocaleString()
      }]
    };
    onAddContact?.(newContact, aiAnalysis);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewForm({ name: '', email: '', phone: '', company: '', role: '', notes: '' });
    setAiAnalysis(null);
    setImportedContacts([]);
    setScheduledSteps(new Set());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const res: Partial<Contact>[] = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => { if(h) obj[h] = values[i]?.trim(); });
          return obj;
        });
        setImportedContacts(res);
      } catch (err) {
        alert("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleBatchImport = () => {
    importedContacts.forEach(c => {
      onAddContact?.({ 
        id: `c${Date.now()}-${Math.random()}`, 
        name: c.name || 'Imported Contact', 
        email: c.email || '', 
        phone: c.phone || '', 
        company: c.company || '', 
        role: c.role || '', 
        lastContact: new Date().toISOString().split('T')[0], 
        notes: c.notes || [], 
        actions: [{ id: `a${Date.now()}`, type: 'Note', description: 'Imported via CSV', timestamp: new Date().toLocaleString() }]
      });
    });
    setShowAddModal(false);
    resetForm();
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contacts</h1>
          <p className="text-slate-500">Intelligent relationship management.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
          <Icons.Plus /> Add Contact
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <input type="text" placeholder="Search contacts..." className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Company</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => handleGetInsight(contact)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{contact.name}</div>
                    <div className="text-sm text-slate-500">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{contact.company}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDraftEmail(contact)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Draft AI Email"><Icons.Mail /></button>
                      <button onClick={() => handleStartEditing(contact)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit Contact Info">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleGetInsight(contact)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold bg-indigo-50 px-3 py-1 rounded-lg">Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in">
            <div className="p-4 border-b border-slate-100 flex gap-4 px-6 items-center">
              <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Manual Entry</button>
              <button onClick={() => setActiveTab('import')} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'import' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Import CSV</button>
              <button onClick={() => setShowAddModal(false)} className="ml-auto p-2 text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-hidden flex">
              {activeTab === 'manual' ? (
                <>
                  <div className="w-1/2 p-8 overflow-y-auto border-r border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Basic Information</h3>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                      <input className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Linda King" value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                        <input className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="linda@king.com" value={newForm.email} onChange={e => setNewForm({...newForm, email: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                        <input className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="555-0199" value={newForm.phone} onChange={e => setNewForm({...newForm, phone: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Lead Context</label>
                      <textarea className="w-full h-32 px-4 py-2 border rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-500" placeholder="How did you meet? What are their needs?" value={newForm.notes} onChange={e => setNewForm({...newForm, notes: e.target.value})} />
                    </div>
                    <button onClick={handleAIAnalysis} disabled={loading === 'adding'} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100">
                      {loading === 'adding' ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Icons.Sparkles />} Analyze Relationship Strategy
                    </button>
                  </div>
                  <div className="w-1/2 bg-slate-50 p-8 overflow-y-auto">
                    {aiAnalysis ? (
                      <div className="space-y-6 animate-in">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nova Suggested Plan</label>
                          <p className="text-slate-900 font-bold text-xl">{aiAnalysis.nextStep}</p>
                          <p className="text-sm text-slate-500 mt-1">{aiAnalysis.summary}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next 3 Actions</label>
                          {aiAnalysis.actionPlan?.map((step: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                              <div className="flex gap-4 items-center">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">{i+1}</div>
                                <div>
                                  <p className="font-bold text-slate-800">{step.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{step.type} • {step.delayDays === 0 ? 'Today' : `in ${step.delayDays} days`}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {scheduledSteps.has(i) ? (
                                  <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">✓ Scheduled</span>
                                ) : (
                                  <>
                                    <button onClick={() => handleScheduleStep(step, i)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition">To List</button>
                                    <a href={getGCalLink(step)} target="_blank" className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition">Google Cal</a>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleSaveContact} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition shadow-xl mt-4">Complete Setup & Save Contact</button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic text-center px-12">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm"><Icons.Sparkles /></div>
                         <p>Fill out the contact details and run the AI analysis to generate a personalized multi-step follow-up plan for your calendar.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full p-8 text-center flex flex-col items-center justify-center">
                  <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-xl border-2 border-dashed border-slate-200 rounded-3xl p-16 hover:border-indigo-400 hover:bg-slate-50 transition cursor-pointer">
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Icons.Upload />
                    <p className="font-bold text-slate-600 mt-4">Upload CSV File</p>
                    <p className="text-sm text-slate-400 mt-1">Required: Name, Email, Company, Role, Notes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* (Rest of existing details modal omitted for brevity as it stays same or similar) */}
    </div>
  );
};

export default Contacts;
