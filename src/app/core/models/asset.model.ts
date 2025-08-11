interface HistoryEntry {
  description: string;
  date: string; 
}

interface SoftwareEntry {
  name: string;
  purchaseDate: string;  
  expiryDate?: string;
  licenseKey?: string;
  version?: string;
  notes?: string;
}


export interface AssetModel {
  id?: string;
  name: string;
  model?: string;
  tag: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  os?: string;
  ram?: string;
  drive?: string;
  serialNumber?: string;
  purchaseDate: string;
  peripherals?: string;
  history?: HistoryEntry[];
  comapnyId: string;
  installedSoftware?: SoftwareEntry[];
}


export class AssetFields {

    static  DEFAULT_EXCEL_FIELDS: { key: keyof AssetModel, label: string, selected: boolean }[] = [
    { key: 'name', label: 'Name', selected: true },
    { key: 'model', label: 'Model', selected: true },
    { key: 'tag', label: 'Tag', selected: true },
    { key: 'status', label: 'Status', selected: true },
    { key: 'assignedTo', label: 'Assigned To ID', selected: false },
    { key: 'assignedToName', label: 'Assigned To Name', selected: true },
    { key: 'os', label: 'Operating System', selected: false },
    { key: 'ram', label: 'RAM', selected: false },
    { key: 'drive', label: 'Drive', selected: false },
    { key: 'serialNumber', label: 'Serial Number', selected: false },
    { key: 'purchaseDate', label: 'Purchase Date', selected: true },
    { key: 'peripherals', label: 'Peripherals', selected: false },
    { key: 'history', label: 'History', selected: false },
    { key: 'installedSoftware', label: 'Installed Software', selected: false },
    { key: 'comapnyId', label: 'Company ID', selected: false }
  ];

}