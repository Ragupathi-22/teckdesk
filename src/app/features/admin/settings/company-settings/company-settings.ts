import { Component, OnInit, signal } from '@angular/core';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DEFAULT_COMPANY_DATA } from '../../../../core/models/company-defaults';
import { Company } from '../../../../core/models/company.models';
import { db } from '../../../../firebase.config';
import { LoadingService } from '../../../../shared/service/loading.service';
import { ConfirmDialogService } from '../../../../shared/service/confirm-dialog.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/service/toast.service';
import { LucideIconCollection } from '../../../../shared/icons/lucide-icons';
import { LucideAngularModule } from 'lucide-angular';
import { LookupService } from '../../../../core/services/company.service';

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


  addItem<T>(arrKey: keyof Company, emptyItem: T) {
    const company = this.editedCompany();
    if (!company) return;
    (company[arrKey] as T[]).push(JSON.parse(JSON.stringify(emptyItem)));
    this.editedCompany.set({ ...company });
  }

  removeItem(arrKey: keyof Company, index: number) {
    const company = this.editedCompany();
    if (!company) return;
    (company[arrKey] as any[]).splice(index, 1);
    this.editedCompany.set({ ...company });
  }

  // company-settings.ts

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

    // ✅ Refresh the company list so dropdown is updated immediately
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
    } catch (error) {
      console.error('Error deleting company:', error);
      this.toaster.error('Failed to delete company');
    }
    finally {
      this.loading.hide();
      this.cancelChanges();
    }

  }



}
