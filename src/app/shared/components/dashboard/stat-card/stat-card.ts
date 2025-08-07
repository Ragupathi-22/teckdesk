import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LucideIconCollection } from '../../../icons/lucide-icons';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  imports:[CommonModule,LucideAngularModule]
})
export class StatCard {
  LucideIcon =LucideIconCollection;
  @Input() title: string='';
  @Input() value: number=0;
  @Input() icon: string='Activity' 
  @Input() colorClass: string ='bg-gray-400'; 
}
