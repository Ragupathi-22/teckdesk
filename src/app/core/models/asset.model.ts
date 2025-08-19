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
  osVersion?: string;
  ram?: string;
  drive?: string;
  serialNumber?: string;
  purchaseDate: string;
  peripherals?: string;
  history?: HistoryEntry[];
  companyId: string;
  installedSoftware?: SoftwareEntry[];
  team?: string;
  tagLower?: string; // For case-insensitive search
}


export class AssetFields {

  static DEFAULT_EXCEL_FIELDS: { key: keyof AssetModel, label: string, selected: boolean }[] = [
    { key: 'name', label: 'Name', selected: true },
    { key: 'model', label: 'Model', selected: true },
    { key: 'tag', label: 'Tag', selected: true },
    { key: 'status', label: 'Status', selected: true },
    { key: 'assignedToName', label: 'Assigned To Name', selected: true },
    { key: 'team', label: 'Team', selected: true },
    { key: 'os', label: 'Operating System', selected: true },
    { key: 'osVersion', label: 'OS Version', selected: true },
    { key: 'ram', label: 'RAM', selected: true },
    { key: 'drive', label: 'Drive', selected: true },
    { key: 'serialNumber', label: 'Serial Number', selected: true },
    { key: 'purchaseDate', label: 'Purchase Date', selected: true },
    { key: 'installedSoftware', label: 'Installed Software', selected: false },
    { key: 'peripherals', label: 'Peripherals', selected: false },
    { key: 'history', label: 'History', selected: false },
    { key: 'companyId', label: 'Company ID', selected: false },
    { key: 'assignedTo', label: 'Assigned To ID', selected: false },
    { key: 'tagLower', label: 'Tag Lower', selected: false },
    { key: 'id', label: 'Id', selected: false }
  ];

}