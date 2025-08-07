import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './asset-detail.html'
})
export class AssetDetail {
  @Input() asset: any;
@Input() onClose: () => void = () => {};

  LucideIcon = LucideIconCollection;
}
