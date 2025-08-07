export interface Team {
  team: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AssetStatus {
  status: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TicketCategory {
  category: string;
  isActive: boolean;
  sortOrder: number;
}
export interface TicketStatus {
  status: string;
  isActive: boolean;
  sortOrder: number;
  color :string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  empPass: string;
  teams: Team[];
  assetStatus: AssetStatus[];
  ticketCategory: TicketCategory[];
  ticketStatus :TicketStatus[];
}
