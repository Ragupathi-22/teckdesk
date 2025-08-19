import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { Company } from '../../../core/auth/admin_register';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './asset-detail.html'
})
export class AssetDetail implements OnInit{
  @Input() asset: any;
  @Input() onClose: () => void = () => { };
  @Input() role: 'employee' | 'admin' = 'employee';
  LucideIcon = LucideIconCollection;
 selectedCompany: any | undefined;
  private dataService =inject(DataService);

  ngOnInit(): void {
      this.selectedCompany = this.dataService.getCompany();
  }

    getStatusLabel(statusId: string): string {
  return this.selectedCompany?.assetStatus.find((s :any) => s.id === statusId)?.status || '';
}
}
