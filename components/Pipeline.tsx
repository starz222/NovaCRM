
import React from 'react';
import { Deal, DealStage, Contact } from '../types';
import { Icons } from '../constants';

interface PipelineProps {
  deals: Deal[];
  contacts: Contact[];
}

const Pipeline: React.FC<PipelineProps> = ({ deals, contacts }) => {
  const getContact = (id: string) => contacts.find(c => c.id === id);
  const columns = Object.values(DealStage);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-slate-800">Sales Pipeline</h1><p className="text-slate-500">Track deals through the funnel.</p></div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"><Icons.Plus /> New Deal</button>
      </div>
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {columns.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-80 bg-slate-100/50 rounded-xl p-3 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">{stage}<span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">{stageDeals.length}</span></h3>
                <span className="text-xs font-bold text-slate-400">${stageDeals.reduce((s,d)=>s+d.value,0).toLocaleString()}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map(deal => {
                  const contact = getContact(deal.contactId);
                  const lastAction = contact?.actions && contact.actions.length > 0 ? contact.actions[contact.actions.length - 1] : null;
                  return (
                    <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-300 transition group">
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 mb-1">{deal.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
                        <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">{contact?.name.charAt(0) || '?'}</div>
                        {contact?.name || 'Unknown'}
                      </div>
                      {lastAction && (
                        <div className="mb-3 p-2 bg-slate-50 rounded border border-slate-100 flex items-start gap-2">
                           <div className="text-indigo-400 mt-0.5"><Icons.Pipeline /></div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-[9px] text-slate-400 uppercase font-bold">Last Action</p>
                              <p className="text-[10px] text-slate-600 truncate">{lastAction.description}</p>
                           </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="font-bold text-slate-800">${deal.value.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{deal.expectedCloseDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
