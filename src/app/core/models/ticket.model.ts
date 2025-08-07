export interface Ticket {
  id: string;
  title: string;
  description: string;
  assetTag: string;
  category: string;
  raisedBy: string;
  raisedByName: string;
  timestamp: any;
  company: string;
  statusColor?: string;
  team? :string;
  status: string; // current status (for querying/filtering)
  statusLogs?: TicketStatusLog[]; // full history
  comments?: TicketComment[];     // user/admin discussions
  photoUrls?: string[];          // optional: store image paths
}


export interface TicketComment {
  message: string;
  timestamp: any;
  updatedByName: string;
  isAdmin: boolean;
}


export interface TicketStatusLog {
  status: string; 
  updatedByName:string;
  timestamp: any;
  isAdmin :boolean;
}

export interface TicketFilter {
  team?: string;
  employee?: string;
  category?: string;
  status?: string; // Changed from TicketStatus to string
  dateRange?: {
    start: Date;
    end: Date;
  };
}
