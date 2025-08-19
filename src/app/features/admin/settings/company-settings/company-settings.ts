import { Component, inject, OnInit, signal } from '@angular/core';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DEFAULT_COMPANY_DATA } from '../../../../core/models/company-defaults';
import { AssetStatus, Company, TicketStatus } from '../../../../core/models/company.models';
import { db } from '../../../../firebase.config';
import { LoadingService } from '../../../../shared/service/loading.service';
import { ConfirmDialogService } from '../../../../shared/service/confirm-dialog.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/service/toast.service';
import { LucideIconCollection } from '../../../../shared/icons/lucide-icons';
import { LucideAngularModule } from 'lucide-angular';
import { LookupService } from '../../../../core/services/company.service';
import { DataService } from '../../../../core/services/data.service';

@Component({
  selector: 'app-company-settings',
  templateUrl: './company-settings.html',
  styleUrls: ['./company-settings.css'],
  imports: [FormsModule, ReactiveFormsModule, CommonModule, FormsModule, LucideAngularModule]
})
export class CompanySettings implements OnInit {

  companies = signal<Company[]>([]);
  selectedCompanyId = signal<string | null>(null);
  editedCompany = signal<Company | null>(null);
  newCompany = signal<boolean>(false);
  LucideIcon = LucideIconCollection;
  private dataService = inject(DataService);


  constructor(
    private lookup: LookupService,
    private loading: LoadingService,
    private toaster: ToastService,
    private confirmService: ConfirmDialogService,
  ) { }

  async ngOnInit() {
    this.loading.show();
    try {
      await this.lookup.init();
      this.lookup.getAllCompanies().then((companies) => {
        this.companies.set(companies);
      });
    } catch (error) {
      console.error('Failed to load companies', error);
      this.toaster.error('Failed to load companies.');
    } finally {
      this.loading.hide();
    }
  }

  selectCompany(event: Event) {
    this.newCompany.set(false);
    const value = event.target as HTMLSelectElement;
    const id = value.value;
    const company = this.companies().find(c => c.id === id);
    if (company) {
      this.editedCompany.set({ ...company });
      this.selectedCompanyId.set(id);
    } else {
      this.editedCompany.set(null);
      this.selectedCompanyId.set(null);
    }
  }

  createNewCompany() {
    this.newCompany.set(true);
    const newCompany: Company = {
      id: '',
      ...JSON.parse(JSON.stringify(DEFAULT_COMPANY_DATA))
    };
    this.editedCompany.set(newCompany);
    this.selectedCompanyId.set(null);
  }

  /** Generate unique ID */
private genId(): string {
  // Check if crypto.randomUUID exists
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  // Fallback: RFC4122 version 4 UUID (not cryptographically secure, but fine for most use cases)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


  /** Add item to array with unique id */
  addItem<K extends keyof Company>(
    arrKey: K,
    emptyItem: Company[K] extends (infer U)[] ? U : never
  ) {
    const company = this.editedCompany();
    if (!company) return;

    const newItem = JSON.parse(JSON.stringify(emptyItem));
    if (!newItem.id) {
      newItem.id = this.genId();
    }
    (company[arrKey] as any[]).push(newItem);
    this.editedCompany.set({ ...company });
  }


  removeItem(arrKey: keyof Company, index: number) {
    const company = this.editedCompany();
    if (!company) return;
    (company[arrKey] as any[]).splice(index, 1);
    this.editedCompany.set({ ...company });
  }

  // String array (ramOptions, driveOptions)
  addStringItem(arrKey: 'ramOptions' | 'driveOptions', value: string = '') {
    const company = this.editedCompany();
    if (!company) return;
    (company[arrKey] as string[]).push(value);
    this.editedCompany.set({ ...company });
  }

  removeStringItem(arrKey: 'ramOptions' | 'driveOptions', index: number) {
    const company = this.editedCompany();
    if (!company) return;
    (company[arrKey] as string[]).splice(index, 1);
    this.editedCompany.set({ ...company });
  }

  addOperatingSystem() {
    const company = this.editedCompany();
    if (!company) return;
    company.operatingSystems.push({
      id: this.genId(),
      operatingSystem: '',
      isActive: true,
      sortOrder: company.operatingSystems.length + 1,
      version: []
    });
    this.editedCompany.set({ ...company });
  }

  removeOperatingSystem(index: number) {
    const company = this.editedCompany();
    if (!company) return;
    company.operatingSystems.splice(index, 1);
    this.editedCompany.set({ ...company });
  }

  addOSVersion(osIndex: number, version: string = '') {
    const company = this.editedCompany();
    if (!company) return;
    company.operatingSystems[osIndex].version.push(version);
    this.editedCompany.set({ ...company });
  }

  removeOSVersion(osIndex: number, versionIndex: number) {
    const company = this.editedCompany();
    if (!company) return;
    company.operatingSystems[osIndex].version.splice(versionIndex, 1);
    this.editedCompany.set({ ...company });
  }

  trackByIndex(index: number): number {
    return index;
  }

  async saveChanges() {
    const company = this.editedCompany();
    if (!company) return;

    const confirmed = await this.confirmService.show(
      'Save Changes',
      `Are you sure you want to save changes?`,
      'Yes',
      'Cancel'
    );
    if (!confirmed) return;

    this.loading.show();
    try {
      if (company.id) {
        // Update existing
        await updateDoc(doc(db, 'companies', company.id), { ...company });
        this.toaster.success('Company updated successfully.');
      } else {
        // Create new
        const newId = await this.lookup.createCompany(company);
        company.id = newId || '';
        this.toaster.success('New company created successfully.');
      }

      this.cancelChanges();
      window.location.reload();

    } catch (error) {
      console.error('Error saving company:', error);
      this.toaster.error('Failed to save company. Please try again.');
    } finally {
      this.loading.hide();
    }
  }

  async cancelChanges() {
    this.newCompany.set(false);
    this.editedCompany.set(null);
    this.selectedCompanyId.set(null);

    // ✅ Refresh
    await this.lookup.init();
    this.lookup.getAllCompanies().then((companies) => {
      this.companies.set(companies);
    });
  }

  async deleteCompany(id: string) {
    const confirmed = await this.confirmService.show(
      'Delete Company',
      `Are you sure you want to Delete Company? ${this.editedCompany()?.name}`,
      'Yes',
      'Cancel'
    );
    if (!confirmed) return;
    const confirmed2 = await this.confirmService.show(
      'Final Warning',
      `This action cannot be undone. Are you sure you want to delete "${this.editedCompany()?.name}"?`,
      'Delete',
      'Cancel'
    );

    if (!confirmed2) return;
    this.loading.show();
    try {
      await deleteDoc(doc(db, 'companies', id));
      this.toaster.success('Company deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting company:', error);
      this.toaster.error('Failed to delete company');
    }
    finally {
      this.loading.hide();
      this.cancelChanges();
    }
  }


notAllowToDeleteTicketStatus(status: TicketStatus): boolean {
  return status?.systemKey === 'OPEN';
}

notAllowToDeleteAssetStatus(status: AssetStatus): boolean {
  const protectedKeys = ['ASSIGNED', 'IN_STOCK', 'UNDER_REPAIR'];
  return status.systemKey !== undefined && protectedKeys.includes(status.systemKey);
}


}
