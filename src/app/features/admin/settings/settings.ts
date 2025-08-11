import { Component, signal } from '@angular/core';
import { CompanySettings } from './company-settings/company-settings';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  imports: [CompanySettings,CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {

  
 activeTab = signal<'company' | 'adminSetting'>('company');


}
