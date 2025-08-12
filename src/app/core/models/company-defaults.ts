import { Company } from "./company.models";

export const DEFAULT_COMPANY_DATA: Omit<Company, 'id'> = {
  code: 'DEFAULT_CODE',
  name: 'Default Company',
  isActive: true,
  sortOrder: 1,
  empPass: 'NTPL@2025', 
  sentMailToEmpTicketUpdate :true,
  sentMailToEmpRegister :true,
  ramOptions: ['8GB', '16GB', '32GB'],
  driveOptions: ['256GB', '512GB', '1TB'],  
  operatingSystems: [
    { operatingSystem: 'Windows', isActive: true, sortOrder: 1, version: ["10","11"] },
    { operatingSystem: 'mac', isActive: true, sortOrder: 2, version: ["air","pro"] },
    { operatingSystem: 'Linux', isActive: true, sortOrder: 3, version: ["l1","l2"] }
  ],
  teams: [
    { team: 'IT Support', isActive: true, sortOrder: 1 },
    { team: 'HR', isActive: true, sortOrder: 2 },
    { team: 'Operations', isActive: true, sortOrder: 3 }
  ],
  assetStatus: [
    { status: 'Available', color: '#16a34a', isActive: true, sortOrder: 1 },
    { status: 'In Use', color: '#2563eb', isActive: true, sortOrder: 2 },
    { status: 'Under Maintenance', color: '#facc15', isActive: true, sortOrder: 3 },
    { status: 'Retired', color: '#dc2626', isActive: true, sortOrder: 4 }
  ],
  ticketCategory: [
    { category: 'Hardware', isActive: true, sortOrder: 1 },
    { category: 'Software', isActive: true, sortOrder: 2 },
    { category: 'Network', isActive: true, sortOrder: 3 }
  ],
  ticketStatus: [
    { status: 'Open', color: '#dc2626', isActive: true, sortOrder: 1 },
    { status: 'In Progress', color: '#facc15', isActive: true, sortOrder: 2 },
    { status: 'Resolved', color: '#16a34a', isActive: true, sortOrder: 3 },
    { status: 'Closed', color: '#6b7280', isActive: true, sortOrder: 4 }
  ]
};
