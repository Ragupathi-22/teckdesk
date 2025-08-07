import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { User } from 'firebase/auth';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { LucideAngularModule } from 'lucide-angular';
import { DataService } from '../../../core/services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule,CommonModule],
  templateUrl: './header.html',
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  LucideIcon = LucideIconCollection;
  dataService =inject(DataService);
  user =this.dataService.getFirebaseUser();

  showProfile = false;

  @ViewChild('profileContainer') profileRef!: ElementRef;

  toggleProfile() {
    this.showProfile = !this.showProfile;
  }

  handleClickOutside(event: MouseEvent) {
    if (
      this.showProfile &&
      this.profileRef &&
      !this.profileRef.nativeElement.contains(event.target)
    ) {
      this.showProfile = false;
    }
  }
}
