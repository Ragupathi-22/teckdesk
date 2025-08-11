import { Component, OnInit, signal } from '@angular/core';
import { updateDoc, doc } from 'firebase/firestore';
import { DEFAULT_COMPANY_DATA } from '../../../../core/models/company-defaults';
import { Company } from '../../../../core/models/company.models';
import { db } from '../../../../firebase.config';
import { LookupService } from '../../../../shared/service/company.service';
import { LoadingService } from '../../../../shared/service/loading.service';
import { ConfirmDialogService } from '../../../../shared/service/confirm-dialog.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/service/toast.service';

@Component({
  selector: 'app-company-settings',
  templateUrl: './company-settings.html',
  styleUrls: ['./company-settings.css'],
  imports: [FormsModule, ReactiveFormsModule, CommonModule]
})
export class CompanySettings implements OnInit {
  companies = signal<Company[]>([]);
  selectedCompanyId = signal<string | null>(null);
  editedCompany = signal<Company | null>(null);

  constructor(
    private lookup: LookupService,
    private loading: LoadingService,
    private toaster: ToastService,
    private confirmService: ConfirmDialogService
  ) {}

  async ngOnInit() {
    this.loading.show();
    try {
      await this.lookup.init();
      this.companies.set(this.lookup.companies());
    } catch (error) {
      console.error('Failed to load companies', error);
      this.toaster.error('Failed to load companies.');
    } finally {
      this.loading.hide();
    }
  }

  selectCompany(event: Event) {
    const value = event.target as HTMLSelectElement;
    const id = value.value;
    const company = this.lookup.getCompanyById(id);
    if (company) {
      this.editedCompany.set({ ...company });
      this.selectedCompanyId.set(id);
    } else {
      // this.toaster.error('Selected company not found.');
      this.editedCompany.set(null);
      this.selectedCompanyId.set(null);
    }
  }

  createNewCompany() {
    const newCompany = { id: '', ...DEFAULT_COMPANY_DATA } as Company;
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
        const updateData = { ...company };
        await updateDoc(doc(db, 'companies', company.id), updateData);
        this.toaster.success('Company updated successfully.');
      } else {
        // Create new
        const newId = await this.lookup.createCompany(company);
        company.id = newId || '';
        this.toaster.success('New company created successfully.');
      }

      // Refresh company list and signals
      // await this.lookup.init();
      // this.companies.set(this.lookup.companies());
      // if (company.id) {
      //   this.selectedCompanyId.set(company.id);
      // }
      this.editedCompany.set(null);
      this.selectedCompanyId.set(null);
    } catch (error) {
      console.error('Error saving company:', error);
      this.toaster.error('Failed to save company. Please try again.');
    } finally {
      this.loading.hide();
    }
  }
cancelChanges() {
  this.editedCompany.set(null);
  this.selectedCompanyId.set(null);
}



}
