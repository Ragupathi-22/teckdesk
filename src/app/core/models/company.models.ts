export interface Team {
  id: string;
  team: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AssetStatus {
  id: string;
  status: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  systemKey?: string;
}

export interface TicketCategory {
  id: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}
export interface TicketStatus {
  id: string;
  status: string;
  isActive: boolean;
  sortOrder: number;
  color: string;
  systemKey?: string;
}

export interface OperatingSystem {
  id: string;
  operatingSystem: string;
  isActive: boolean;
  sortOrder: number;
  version: string[]
}

export interface Company {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  empPass: string;
  sentMailToEmpRegister: boolean;
  sentMailToEmpTicketUpdate: boolean;
  teams: Team[];
  operatingSystems: OperatingSystem[];
  ramOptions: string[];
  driveOptions: string[];
  assetStatus: AssetStatus[];
  ticketCategory: TicketCategory[];
  ticketStatus: TicketStatus[];
}
