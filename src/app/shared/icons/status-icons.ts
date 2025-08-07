import { LucideIconCollection } from "./lucide-icons";

// src/app/shared/constants/status-icons.ts
export const STATUS_ICON_MAP: Record<string, { icon: any; color: string }> = {
  Open: { icon: LucideIconCollection.AlertCircle, color: 'bg-red-500' },
  'In Progress': { icon: LucideIconCollection.Clock, color: 'bg-yellow-500' },
  Resolved: { icon: LucideIconCollection.CheckCircle, color: 'bg-green-500' },
  Closed: { icon: LucideIconCollection.XCircle, color: 'bg-gray-500' },
  Assigned: { icon: LucideIconCollection.UserCheck, color: 'bg-green-600' },
  'Total': { icon: LucideIconCollection.Monitor, color: 'bg-green-600' },

  'Under Repair': { icon:LucideIconCollection.Wrench, color: 'bg-red-400' },
  'In Stock': { icon: LucideIconCollection.Box, color: 'bg-blue-500' },
};
