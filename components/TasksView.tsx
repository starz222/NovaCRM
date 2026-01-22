
import React from 'react';
import { Task, Contact, ActivityType } from '../types';
import { Icons } from '../constants';

interface TasksViewProps {
  tasks: Task[];
  contacts: Contact[];
  onToggleTask: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, contacts, onToggleTask }) => {
  const getContact = (id?: string) => contacts.find(c => c.id === id);

  const getGCalLink = (task: Task) => {
    const start = task.dueDate.replace(/-/g, "") + "T090000Z";
    const end = task.dueDate.replace(/-/g, "") + "T100000Z";
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${task.taskType}: ${task.title}`)}&details=${encodeURIComponent(task.description)}&dates=${start}/${end}&sf=true&output=xml`;
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your To-Do List</h1>
          <p className="text-slate-500">Scheduled relationship actions and follow-ups.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {sortedTasks.map(task => {
          const contact = getContact(task.relatedContactId);
          const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'Pending';
          
          return (
            <div key={task.id} className={`bg-white p-6 rounded-2xl shadow-sm border transition ${task.status === 'Completed' ? 'opacity-50 border-slate-100' : 'border-slate-200 hover:border-indigo-200'}`}>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onToggleTask(task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${task.status === 'Completed' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}
                >
                  {task.status === 'Completed' && <span className="text-white text-xs">✓</span>}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${task.taskType === 'Email' ? 'bg-blue-50 text-blue-600' : task.taskType === 'Call' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {task.taskType}
                    </span>
                    <h3 className={`font-bold text-slate-900 ${task.status === 'Completed' ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">{task.description}</p>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-bold mb-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                    {task.dueDate}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    {contact && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">with {contact.name}</span>
                    )}
                    <a 
                      href={getGCalLink(task)} 
                      target="_blank" 
                      className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded"
                      title="Add to Google Calendar"
                    >
                      <Icons.Calendar />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No tasks scheduled yet. Add a contact and use Nova AI to generate a plan!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksView;
