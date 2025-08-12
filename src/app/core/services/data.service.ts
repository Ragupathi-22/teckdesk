// src/app/core/services/data.service.ts
import { inject, Injectable, computed, signal } from '@angular/core';
import { AuthService, Role } from '../auth/auth.service';
import { User } from 'firebase/auth';
import { AssetStatus, Company, Team, TicketCategory, TicketStatus } from '../models/company.models';
import { EmployeeService } from '../../features/admin/users/service/employee-service';
import { UserModel } from '../models/user.model';
import { AssetModel } from '../models/asset.model';
import { AssetService } from '../../features/admin/admin-assets/service/asset-service';
import { LookupService } from './company.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private auth = inject(AuthService);
  private lookup = inject(LookupService);
  private employee = inject(EmployeeService);
  private assetService = inject(AssetService);

  // Accessors for AuthService
  getFirebaseUser(): User | null {
    return this.auth.getFirebaseUser();
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  getRole(): Role | null {
    return this.auth.getRole();
  }

  getCompanyId(): string | null {
    return this.auth.getCompanyId();
  }

  logOut() {
    return this.auth.logout();
  }

  // Individual Lookup values

  getAllCompanies() {
  return this.lookup.companies();
}

  getCompany(): Company | undefined {
    const id = this.getCompanyId();
    return id ? this.lookup.getCompanyById(id) : undefined;
  }

  getTeams(): Team[] {
    const id = this.getCompanyId();
    return id ? this.lookup.getTeamsByCompany(id) : [];
  }

  getAssetStatusByCompany(): AssetStatus[] {
    const id = this.getCompanyId();
    return id ? this.lookup.getAssetStatusByCompany(id) : [];
  }

  getTicketStatus(): TicketStatus[] {
    const id = this.getCompanyId();
    return id ? this.lookup.getTicketStatusByCompany(id) : [];
  }

  getTicketCategory(): TicketCategory[] {
    const id = this.getCompanyId();
    return id ? this.lookup.getTicketCategoryByCompany(id) : [];
  }

  getOperatingSystems(): string[] {
    const id = this.getCompanyId();
    const company = id ? this.lookup.getCompanyById(id) : undefined;
    return company ? company.operatingSystems.map(os => os.operatingSystem) : [];
  }
  getRamOptions(): string[] {
    const id = this.getCompanyId();
    const company = id ? this.lookup.getCompanyById(id) : undefined;
    return company ? company.ramOptions : [];
  } 
  getDriveOptions(): string[] {
    const id = this.getCompanyId();
    const company = id ? this.lookup.getCompanyById(id) : undefined;
    return company ? company.driveOptions : [];
  }


  // ✅ New employee-related methods

  async getCurrentEmployee(): Promise<UserModel | null> {
    const uid = this.getFirebaseUser()?.uid;
    return uid ? await this.getEmployeeById(uid) : null;
  }

  async getEmployeesByCompany(): Promise<UserModel[]> {
    const companyId = this.getCompanyId();
    if (!companyId) return [];
    return await this.employee.getEmployeesByCompany(companyId);
  }

  async getEmployeesByCompanyTeamRole(team: string, role: string): Promise<UserModel[]> {
    const companyId = this.getCompanyId();
    if (!companyId) return [];
    return await this.employee.getEmployeesByCompanyTeamRole(companyId, team, role);
  }


  async getEmployeeById(employeeId: string): Promise<UserModel | null> {
    return await this.employee.getEmployeeById(employeeId);
  }

  async searchEmployeesByName( term: string): Promise<UserModel[]> {
      const companyId = this.getCompanyId();
    if (!companyId) return [];
    return await this.employee.searchEmployeesByName(companyId,term);
  }


  // Asset Related Methods
  async getAssetsByCompany(): Promise<AssetModel[]> {
    const companyId = this.getCompanyId();
    if (!companyId) return [];
    return await this.assetService.getAssetsByCompany(companyId);
  }

  getAssetsByEmployee(employeeId: string): Promise<AssetModel[]> {
    return this.assetService.getAssetsByEmployee(employeeId);
  }

  getAssetById(id: string): Promise<AssetModel | null> {
    return this.assetService.getAssetById(id);
  }



}




  




