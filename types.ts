
export enum DealStage {
  LEAD = 'Lead',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost'
}

export type ActivityType = 'Email' | 'Call' | 'Meeting' | 'Note' | 'Message';

export interface Action {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  lastContact: string;
  notes: string[];
  actions: Action[];
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  contactId: string;
  expectedCloseDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  taskType: ActivityType;
  relatedContactId?: string;
}

export interface CRMData {
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
}
