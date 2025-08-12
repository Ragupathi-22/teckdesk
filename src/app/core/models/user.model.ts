// Employee model 
export interface UserModel {
  id: string;                
  name: string;
  email: string;
  role: 'employee';
  companyId: string;
  team?: string;
  dateOfJoining :string;
}


export interface AdminModel {
  uid: string;
  name: string;
  email: string;
  role: 'admin';
  mailFromEmployee: boolean;
  isActive: boolean;
}





