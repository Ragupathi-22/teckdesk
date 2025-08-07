// src/app/pages/assets/assets.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { ToastService } from '../../../shared/service/toast.service';
import { DataService } from '../../../core/services/data.service';
import { LoadingService } from '../../../shared/service/loading.service';
import { AssetStatus, Company } from '../../../core/models/company.models';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap, catchError } from 'rxjs/operators';
import { of, combineLatest, Subject } from 'rxjs';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { UserModel } from '../../../core/models/user.model';
import { AssetDetail } from '../../../shared/components/asset-detail/asset-detail';
import { ConfirmDialogService } from '../../../shared/service/confirm-dialog.service';


@Component({
  selector: 'app-admin-assets',
  templateUrl: './admin-assets.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, FormsModule, AssetDetail]
})
export class AdminAssets implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private toastr = inject(ToastService);
  private dataService = inject(DataService);
  private loadingService = inject(LoadingService);
  private confirmService=inject(ConfirmDialogService);
  searching = signal(false);
  LucideIcon = LucideIconCollection;

  selectedCompany: Company | undefined;
  filteredStatus: AssetStatus[] = [];
  employeesByCompany = signal<UserModel[]>([]);
  assetForm!: FormGroup;
  showForm = signal(false);
  isEditing = signal(false);
  editingAssetId: string | null = null;

  searchControl = new FormControl('');
  filterStatusControl = new FormControl('All');
  reload$ = new Subject<void>();
  loadingTable = signal(false);
  loadingForm = signal(false);
  showAssetDetail = signal<any | null>(null);
  filteredAssets = signal<any[]>([]);

  employeeDropdownOpen = false;
employeeSearch = new FormControl('');
filteredEmployeeResults = signal<UserModel[]>([]);
loadingEmployeeSearch = signal(false);

  selectedEmployeeName = '';

  pageSize = 10;
  currentPage = signal(1);
  today = new Date();

  ngOnInit(): void {
    this.selectedCompany = this.dataService.getCompany();
    this.filteredStatus = this.dataService.getAssetStatusByCompany() || [];

    if (this.selectedCompany?.id) {
      this.loadingService.show();
      this.dataService.getEmployeesByCompany().then((employees) => {
        this.employeesByCompany.set(employees);
        this.loadingService.hide();
      });
    }

    this.initForm();
    this.setupFilterStream();

    // Add document click listener to close dropdown when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));

this.employeeSearch.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  tap(term => {
    const trimmed = term?.trim() || '';

    if (trimmed === '') {
      // show default 50 employees if input is cleared
      this.searching.set(false);
      const defaultResults = this.employeesByCompany().slice(0, 50);
      this.filteredEmployeeResults.set([
        {
          id: '',
          name: 'Not Assigned',
          email: '',
          role: 'employee',
          companyId: '',
          team: ''
        },
        ...defaultResults
      ]);
    } else {
      // show loader
      this.searching.set(true);
    }
  }),
  switchMap(term => {
    const trimmed = term?.trim() || '';
    if (!trimmed) return of([]);
    return this.dataService.searchEmployeesByName(trimmed);
  }),
  catchError(() => {
    this.toastr.error('Failed to search employees');
    return of([]);
  })
).subscribe(results => {
  this.filteredEmployeeResults.set([
    {
      id: '',
      name: 'Not Assigned',
      email: '',
      role: 'employee',
      companyId: '',
      team: ''
    },
    ...results
  ]);
  this.searching.set(false);
});


  }

  ngOnDestroy(): void {
    // Clean up event listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  initForm() {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      model: [''],
      tag: ['', Validators.required],
      tagLower :[''],
      status: ['', Validators.required],
      assignedTo: [''],
      assignedToName: [''],
      os: [''],
      ram: [''],
      drive: [''],
      serialNumber: [''],
      purchaseDate: ['', [Validators.required, this.dateNotFutureValidator]],
      peripherals: [''],
      history: ['']
    });

    this.assetForm.get('assignedTo')?.valueChanges.subscribe((userId) => {
      const user = this.employeesByCompany().find(u => u.id === userId);
      if (user) {
        this.assetForm.patchValue({
          assignedToName: user.name
        });
        this.selectedEmployeeName = user.name;
      }
    });

    this.assetForm.get('status')?.valueChanges.subscribe((status) => {
      if (status === 'In Stock') {
        this.assetForm.patchValue({ assignedTo: '', assignedToName: '' });
      }
    });

  }
  getEmployeeById(id: string): UserModel | undefined {
    return this.employeesByCompany().find(emp => emp.id === id);
  }
  getStatusColor(status: string): string {
    const match = this.selectedCompany?.assetStatus?.find(s => s.status === status);
    return match?.color || '#9CA3AF'; // fallback to gray-400 if not found
  }



  dateNotFutureValidator(control: FormControl) {
    const inputDate = new Date(control.value);
    const today = new Date();
    if (inputDate > today) {
      return { futureDate: true };
    }
    return null;
  }

  toggleEmployeeDropdown() {
  this.employeeDropdownOpen = !this.employeeDropdownOpen;

  if (this.employeeDropdownOpen) {
    this.employeeSearch.setValue('');
    const defaultResults = this.employeesByCompany().slice(0, 50); // limit
    this.filteredEmployeeResults.set([ {
    id: '',
    name: 'Not Assigned',
    email: '',
    role: 'employee',
    companyId: '',
    team: ''
  }, ...defaultResults]);
  }
}


  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.employee-dropdown-container');

    if (!dropdownContainer) {
      this.employeeDropdownOpen = false;
    }
  }

  selectEmployee(emp: UserModel) {
    if (emp.id === '') {
      // "Not Assigned" selected
      this.assetForm.patchValue({
        assignedTo: '',
        assignedToName: '',
      });
      this.selectedEmployeeName = '';
    } else {
      this.assetForm.patchValue({
        assignedTo: emp.id,
        assignedToName: emp.name,
      });
      this.selectedEmployeeName = emp.name;
    }
    this.employeeDropdownOpen = false;
  }

  setupFilterStream() {
    combineLatest([
      this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterStatusControl.valueChanges.pipe(startWith('All')),
      this.reload$.pipe(startWith(void 0))
    ])
      .pipe(
        tap(() => this.loadingTable.set(true)),
        switchMap(async ([search, status]) => {
          const results: any[] = [];
          if (!this.selectedCompany?.id) return results;
          const ref = collection(db, 'assets');
          const baseQuery = query(ref, where('comapnyId', '==', this.selectedCompany.id));
          const snapshot = await getDocs(baseQuery);
          snapshot.forEach((docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() };
            results.push(data);
          });

          let filtered = results;
          if (status !== 'All') filtered = filtered.filter(a => a.status === status);
          if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter((a) =>
              a.name?.toLowerCase().includes(term) ||
              a.model?.toLowerCase().includes(term) ||
              a.tag?.toLowerCase().includes(term) ||
              a.assignedToName?.toLowerCase().includes(term)
            );
          }

          return filtered;
        }),
        catchError((err) => {
          this.toastr.error('Failed to load assets');
          return of([]);
        })
      )
      .subscribe((assets) => {
        this.filteredAssets.set(assets);
        this.currentPage.set(1);
        this.loadingTable.set(false);
      });
  }

  get paginatedAssets() {
    return computed(() => {
      const start = 0;
      const end = this.currentPage() * this.pageSize;
      return this.filteredAssets().slice(start, end);
    });
  }

  nextPage() {
    const totalLoaded = this.currentPage() * this.pageSize;
    if (totalLoaded < this.filteredAssets().length) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  openForm(asset?: any) {
    if (asset) {
      this.assetForm.patchValue(asset);
      this.editingAssetId = asset.id;
      this.isEditing.set(true);
      this.selectedEmployeeName = asset.assignedToName;
    } else {
      this.assetForm.reset();
      this.editingAssetId = null;
      this.selectedEmployeeName = '';
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.assetForm.reset();
    this.isEditing.set(false);
    this.selectedEmployeeName = '';
  }

async onSubmit() {
  if (this.assetForm.invalid) {
    this.toastr.error('Please fill all required fields');
    this.assetForm.markAllAsTouched();
    return;
  }

  const status = this.assetForm.get('status')?.value;
  const assignedTo = this.assetForm.get('assignedTo')?.value;

  if (status === 'Assigned' && !assignedTo) {
    this.toastr.error('Please select an employee to assign the asset');
    return;
  }

  const tag = this.assetForm.get('tag')?.value.trim();
  const tagLower = tag.toLowerCase();
  const companyId = this.selectedCompany?.id;

  if (!tag || !companyId) {
    this.toastr.error('Missing tag or company ID');
    return;
  }

  this.loadingForm.set(true);

  try {
    // 🔍 Check for existing tag with same lowercase
    const assetRef = collection(db, 'assets');
    const q = query(assetRef, where('tagLower', '==', tagLower), where('comapnyId', '==', companyId));
    const querySnapshot = await getDocs(q);

    const duplicate = querySnapshot.docs.find(docSnap => {
      return docSnap.id !== this.editingAssetId;
    });

    if (duplicate) {
      this.toastr.error('Asset tag already exists. Please use a unique tag.');
      return;
    }

    const payload: any = {
      ...this.assetForm.value,
      tagLower,               
      comapnyId: companyId
    };

    const savePromise = this.editingAssetId
      ? updateDoc(doc(db, 'assets', this.editingAssetId), payload)
      : addDoc(collection(db, 'assets'), payload);

    await savePromise;

    this.toastr.success(this.editingAssetId ? 'Asset updated' : 'Asset added');
    this.reload$.next();
    this.closeForm();
  } catch (err) {
    this.toastr.error(`Failed to ${this.editingAssetId ? 'update' : 'add'} asset`);
    console.error(err);
  } finally {
    this.loadingForm.set(false);
  }
}



  showDetails(asset: any) {
    this.showAssetDetail.set(asset);
  }

  closeDetails() {
    this.showAssetDetail.set(null);
  }

  async deleteAsset(assetId: string,tag :string) {

        const confirmed = await this.confirmService.show(
    'Delete Asset',
    `Are you sure you want to delete this Asset? Tag: ${tag}` ,
    'Delete',
    'Cancel'
  );

  if (!confirmed) return;

    this.loadingForm.set(true);
    this.loadingService.show();

    deleteDoc(doc(db, 'assets', assetId))
      .then(() => {
        this.toastr.success('Asset deleted');
        this.reload$.next();
      })
      .catch(() => this.toastr.error('Failed to delete asset'))
      .finally(() => {
        this.loadingForm.set(false);
        this.loadingService.hide();
      });
  }
}
