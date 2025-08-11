import { Injectable, signal } from '@angular/core';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { AssetStatus, Company, Team, TicketCategory, TicketStatus } from '../../core/models/company.models';
import { db } from '../../firebase.config';
import { LoadingService } from './loading.service';
import { DEFAULT_COMPANY_DATA } from '../../core/models/company-defaults';


@Injectable({ providedIn: 'root' })
export class LookupService {
  // Signals
  private _companies = signal<Company[]>([]);
  companies = this._companies.asReadonly();

  private _loaded = signal(false);
  loaded = this._loaded.asReadonly();

  constructor(private loading: LoadingService) {}

  /**
   * Call once (e.g., from AppComponent or APP_INITIALIZER)
   */
  async init(): Promise<void> {
    if (this._loaded()) return;
    await this.fetchCompanies();
    this._loaded.set(true);
  }

  /**
   * Query Firestore & normalize teams array
   */
  private async fetchCompanies() {
    this.loading.show();
    try {
      const q = query(
        collection(db, 'companies'),
        where('isActive', '==', true),
      );

      const snap = await getDocs(q);
      const companies: Company[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const teams: Team[] = Array.isArray(data.teams)
          ? data.teams
              .filter((t: Team) => t.isActive)
              .sort((a: Team, b: Team) => a.sortOrder - b.sortOrder)
          : [];
        const assetStatus: AssetStatus[] = Array.isArray(data.assetStatus)
          ? data.assetStatus
              .filter((t: AssetStatus) => t.isActive)
              .sort((a: AssetStatus, b: AssetStatus) => a.sortOrder - b.sortOrder)
          : [];

          const ticketCategory: TicketCategory[] = Array.isArray(data.ticketCategory)
          ? data.ticketCategory
              .filter((t: TicketCategory) => t.isActive)
              .sort((a: TicketCategory, b: TicketCategory) => a.sortOrder - b.sortOrder)
          : [];

          const ticketStatus: TicketStatus[] = Array.isArray(data.ticketStatus)
          ? data.ticketStatus
              .filter((t: TicketStatus) => t.isActive)
              .sort((a: TicketStatus, b: TicketStatus) => a.sortOrder - b.sortOrder)
          : [];

        return {
          id: d.id,
          code: data.code,
          name: data.name,
          isActive: data.isActive,
          sortOrder :data.sortOrder,
          empPass :data.empPass,
          teams,
          assetStatus,
          ticketStatus,
          ticketCategory,

        };
      });

      this._companies.set(companies);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      this.loading.hide();
    }
  }

  async createCompany(companyData: Partial<Company> = {}): Promise<string | null> {
    this.loading.show();
    try {
      // Merge provided data with default
      const dataToSave: Omit<Company, 'id'> = {
        ...DEFAULT_COMPANY_DATA,
        ...companyData,
      };

      const docRef = await addDoc(collection(db, 'companies'), dataToSave);
      
      // Update local state immediately
      this._companies.update((prev) => [
        ...prev,
        { id: docRef.id, ...dataToSave },
      ]);

      console.log(`Company created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (err) {
      console.error('Error creating company:', err);
      return null;
    } finally {
      this.loading.hide();
    }
  }

  getCompanyById(id: string): Company | undefined {
    return this._companies().find((c) => c.id === id);
  }

  getTeamsByCompany(id: string): Team[] {
    const c = this.getCompanyById(id);
    return c?.teams ?? [];
  }

  getAssetStatusByCompany(id: string): AssetStatus[] {
    const c = this.getCompanyById(id);
    return c?.assetStatus ?? [];
  }

  getTicketStatusByCompany(id: string): TicketStatus[] {
    const c = this.getCompanyById(id);
    return c?.ticketStatus ?? [];
  }
    getTicketCategoryByCompany(id: string): TicketCategory[] {
    const c = this.getCompanyById(id);
    return c?.ticketCategory ?? [];
  }
}
