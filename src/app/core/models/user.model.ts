// Employee model 
export interface UserModel {
  id: string;                
  name: string;
  email: string;
  role: 'employee';
  companyId: string;
  team?: string;
}



