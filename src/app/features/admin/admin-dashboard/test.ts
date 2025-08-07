// import { Component, inject, OnInit } from '@angular/core';
// import { AuthService } from '../../../core/auth/auth.service';
// import { getDocs, collection } from 'firebase/firestore';
// import { db } from '../../../firebase.config';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-admin-dashboard',
//   imports: [FormsModule,CommonModule],
//   templateUrl: './admin-dashboard.html',
//   styleUrl: './admin-dashboard.css'
// })
// export class AdminDashboard implements OnInit {

//  auth = inject(AuthService);
//   companies: { id: string; name: string }[] = [];
//   selectedCompanyId: string | null = null;

//   async ngOnInit() {
//     const snapshot = await getDocs(collection(db, 'companies'));
//     this.companies = snapshot.docs
//       .map(doc => ({
//         id: doc.id,
//         name: doc.data()['name'],
//         sortOrder: doc.data()['sortOrder'] ?? 0
//       }))
//       .sort((a, b) => a.sortOrder - b.sortOrder);
    
//     this.selectedCompanyId = this.auth.getCompanyId();
//   }

//   async onSwitchCompany(id: string) {
//     await this.auth.setAdminCompany(id);
//     this.selectedCompanyId = id;
//     location.reload(); // reload app to reflect context change (can be improved later)
//   }
// }



//  <div class="p-6">
//       <label class="block mb-2 font-medium text-gray-700">Switch Company</label>
//       <select
//         [ngModel]="selectedCompanyId"
//         (ngModelChange)="onSwitchCompany($event)"
//         class="border border-gray-300 rounded px-4 py-2 w-64"
//       >
//         <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
//       </select>
//     </div>