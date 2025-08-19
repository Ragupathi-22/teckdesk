import { Company } from "./company.models";

// Simple helper to generate IDs for default data
function genId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  // fallback: generate RFC4122 v4 style UUID (not crypto-secure, but fine for IDs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export const DEFAULT_COMPANY_DATA: Omit<Company, 'id'> = {
  code: 'DEFAULT_CODE',
  name: 'Default Company',
  isActive: true,
  sortOrder: 1,
  empPass: 'NTPL@2025', 
  sentMailToEmpTicketUpdate: true,
  sentMailToEmpRegister: true,
  ramOptions: ['8GB', '16GB', '32GB'],
  driveOptions: ['256GB', '512GB', '1TB'],  

  operatingSystems: [
    { id: genId(), operatingSystem: 'Windows', isActive: true, sortOrder: 1, version: ["10", "11"] },
    { id: genId(), operatingSystem: 'mac', isActive: true, sortOrder: 2, version: ["air", "pro"] },
    { id: genId(), operatingSystem: 'Linux', isActive: true, sortOrder: 3, version: ["l1", "l2"] }
  ],

  teams: [
    { id: genId(), team: 'Development', isActive: true, sortOrder: 1 },
    { id: genId(), team: 'Testing', isActive: true, sortOrder: 2 },
    { id: genId(), team: 'Sales', isActive: true, sortOrder: 3 }
  ],

  assetStatus: [
    { id: genId(), status: 'Assigned', color: '#16a34a', isActive: true, sortOrder: 1 ,systemKey: 'ASSIGNED'},
    { id: genId(), status: 'In Stock', color: '#2563eb', isActive: true, sortOrder: 2, systemKey: 'IN_STOCK' },
    { id: genId(), status: 'Under Repair', color: '#facc15', isActive: true, sortOrder: 3, systemKey: 'UNDER_REPAIR' },
    { id: genId(), status: 'Retired', color: '#dc2626', isActive: true, sortOrder: 4 }
  ],

  ticketCategory: [
    { id: genId(), category: 'Hardware', isActive: true, sortOrder: 1 },
    { id: genId(), category: 'Software', isActive: true, sortOrder: 2 },
    { id: genId(), category: 'Network', isActive: true, sortOrder: 3 }
  ],

  ticketStatus: [
    { id: genId(), status: 'Open', color: '#dc2626', isActive: true, sortOrder: 1,systemKey: 'OPEN' },
    { id: genId(), status: 'In Progress', color: '#facc15', isActive: true, sortOrder: 2 },
    { id: genId(), status: 'Resolved', color: '#16a34a', isActive: true, sortOrder: 3 },
    { id: genId(), status: 'Closed', color: '#6b7280', isActive: true, sortOrder: 4 }
  ]
};
