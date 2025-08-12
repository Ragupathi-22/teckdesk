import { Component, OnInit, signal, computed } from '@angular/core';
import { CompanySettings } from './company-settings/company-settings';
import { CommonModule } from '@angular/common';
import { collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { LoadingService } from '../../../shared/service/loading.service';
import { ToastService } from '../../../shared/service/toast.service';
import { ConfirmDialogService } from '../../../shared/service/confirm-dialog.service';
import { environment } from '../../../../environment';
import { FormsModule } from '@angular/forms';
import { AdminModel } from '../../../core/models/user.model';
import { LucideAngularModule } from "lucide-angular";
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';

@Component({
  selector: 'app-settings',
  imports: [CompanySettings, CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {

  activeTab = signal<'company' | 'adminSetting'>('company');
  admins = signal<AdminModel[]>([]);
  editingAdmin = signal<AdminModel | null>(null);
  LucideIcon =LucideIconCollection
  // Pagination
  pageSize = 5;
  currentPage = signal(1);
  pagedAdmins = computed(() => {
    const start = 0;
    const end = this.currentPage() * this.pageSize;
    return this.admins().slice(start, end);
  });

  constructor(
    private loadingService: LoadingService,
    private toastr: ToastService,
    private confirmService: ConfirmDialogService
  ) {}

  async ngOnInit() {
    await this.loadAdmins();
  }

  async loadAdmins() {
    this.loadingService.show();
    try {
      const snapshot = await getDocs(collection(db, 'admin'));
      const list: AdminModel[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as AdminModel;
        return {
          ...data,
          uid: data.uid || docSnap.id,
        };
      });
      this.admins.set(list);
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to load admins');
    } finally {
      this.loadingService.hide();
    }
  }

  startEdit(admin: AdminModel) {
    this.editingAdmin.set({ ...admin });
  }

  cancelEdit() {
    this.editingAdmin.set(null);
  }

  async saveAdminChanges() {
    const admin = this.editingAdmin();
    if (!admin) return;

    this.loadingService.show();
    try {
      await updateDoc(doc(db, 'admin', admin.uid), {
        name: admin.name,
        isActive: admin.isActive,
        mailFromEmployee: admin.mailFromEmployee,
        updatedAt: serverTimestamp()
      });
      this.toastr.success('Admin updated successfully');
      this.editingAdmin.set(null);
      await this.loadAdmins();
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to update admin');
    } finally {
      this.loadingService.hide();
    }
  }

  async deleteAdmin(adminId: string, adminName: string, email?: string) {
    const confirmed = await this.confirmService.show(
      'Delete Admin',
      `Are you sure you want to delete this Admin? ${adminName}`,
      'Delete',
      'Cancel'
    );
    if (!confirmed) return;

    const confirmed2 = await this.confirmService.show(
      'Final Warning',
      `This action cannot be undone. Do you really want to delete "${adminName}"?`,
      'Delete',
      'Cancel'
    );
    if (!confirmed2) return;

    this.loadingService.show();
    try {
      await deleteDoc(doc(db, 'admin', adminId));

      if (email) {
        try {
          const res = await fetch(`${environment.Base_API}delete-user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }).then(r => r.json());

          if (!res.success) {
            this.toastr.error(res.error || 'Failed to delete from Auth');
          }
        } catch {
          this.toastr.error('Failed to contact delete-user API');
        }
      }

      this.toastr.success('Admin deleted successfully');
      await this.loadAdmins();
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to delete admin');
    } finally {
      this.loadingService.hide();
    }
  }

  loadMore() {
    if (this.pagedAdmins().length < this.admins().length) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  trackByUid(index: number, admin: AdminModel) {
    return admin.uid;
  }
}
