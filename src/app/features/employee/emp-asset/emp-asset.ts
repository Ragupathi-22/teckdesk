import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AssetModel } from '../../../core/models/asset.model';
import { UserModel } from '../../../core/models/user.model';
import { DataService } from '../../../core/services/data.service';
import { AssetDetail } from '../../../shared/components/asset-detail/asset-detail';
import { LoadingService } from '../../../shared/service/loading.service';
import { ToastService } from '../../../shared/service/toast.service';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';

@Component({
  selector: 'app-emp-asset',
  standalone: true,
  imports: [CommonModule, AssetDetail, LucideAngularModule,LucideAngularModule],
  templateUrl: './emp-asset.html',
  styleUrl: './emp-asset.css'
})
export class EmpAsset implements OnInit {

  private dataService = inject(DataService);
  private toastr = inject(ToastService);
  LucideIcon=LucideIconCollection;

  assets = signal<AssetModel[]>([]);
  loadingTable = signal(false);
  currentPage = signal(1);
  pageSize = 10;

  showAssetDetail = signal<AssetModel | null>(null);

  ngOnInit(): void {
    this.loadLoggedInEmployeeAssets();
  }

  async loadLoggedInEmployeeAssets() {
    this.loadingTable.set(true);
    try {
      const currentEmployee: UserModel | null = await this.dataService.getCurrentEmployee();
      if (!currentEmployee) {
        this.toastr.error('Unable to load your assets. Employee not found.');
        this.loadingTable.set(false);
        return;
      }

      const list = await this.dataService.getAssetsByEmployee(currentEmployee.id);
      this.assets.set(list);
    } catch (error) {
      console.error(error);
      this.toastr.error('Failed to load your assets.');
    } finally {
      this.loadingTable.set(false);
    }
  }

  get paginatedAssets() {
    return computed(() => {
      const start = 0;
      const end = this.currentPage() * this.pageSize;
      return this.assets().slice(start, end);
    });
  }

  nextPage() {
    const totalLoaded = this.currentPage() * this.pageSize;
    if (totalLoaded < this.assets().length) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  showDetails(asset: AssetModel) {
    this.showAssetDetail.set(asset);
  }

  closeDetails() {
    this.showAssetDetail.set(null);
  }
}
