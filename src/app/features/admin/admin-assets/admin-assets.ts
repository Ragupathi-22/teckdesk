// src/app/pages/assets/assets.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { ToastService } from '../../../shared/service/toast.service';
import { DataService } from '../../../core/services/data.service';
import { LoadingService } from '../../../shared/service/loading.service';
import { AssetStatus, Company, OperatingSystem } from '../../../core/models/company.models';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap, catchError } from 'rxjs/operators';
import { of, combineLatest, Subject } from 'rxjs';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { UserModel } from '../../../core/models/user.model';
import { AssetDetail } from '../../../shared/components/asset-detail/asset-detail';
import { ConfirmDialogService } from '../../../shared/service/confirm-dialog.service';
import * as XLSX from 'xlsx';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { AssetFields } from '../../../core/models/asset.model';


@Component({
  selector: 'app-admin-assets',
  templateUrl: './admin-assets.html',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, ReactiveFormsModule, LucideAngularModule, FormsModule, AssetDetail]

})
export class AdminAssets implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private toastr = inject(ToastService);
  private dataService = inject(DataService);
  private loadingService = inject(LoadingService);
  private confirmService = inject(ConfirmDialogService);
  searching = signal(false);
  LucideIcon = LucideIconCollection;

  selectedCompany: Company | undefined;
  filteredStatus: AssetStatus[] = [];
  operatingSystems: OperatingSystem[] = [];
  ramOptions: string[] = [];
  driveOptions: string[] = [];
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
  activeTab = 'basic'; // default tab on load
  selectedEmployeeName = '';
  // Arrays to hold history and software items
  historyArray: { note: string; date: string }[] = [];

  softwareArray: {
    name: string;
    version?: string;
    purchaseDate: string;
    expireDate?: string;
    licenseKey?: string;
    notes?: string;
  }[] = [];

  historyForm!: FormGroup;
  softwareForm!: FormGroup;
  pageSize = 10;
  currentPage = signal(1);
  today = new Date();

  private lastVisibleDoc: any = null; // to hold last loaded document snapshot
  private allAssetsLoaded = false; // flag to indicate if all assets are loaded

  ngOnInit(): void {
    this.selectedCompany = this.dataService.getCompany();
    this.filteredStatus = this.selectedCompany?.assetStatus || [];
    this.operatingSystems = this.selectedCompany?.operatingSystems || [];
    this.ramOptions = this.selectedCompany?.ramOptions || [];
    this.driveOptions = this.selectedCompany?.driveOptions || [];
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
              team: '',
              dateOfJoining: ''
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
          team: '',
          dateOfJoining: ''
        },
        ...results
      ]);
      this.searching.set(false);
    });

  }

  getTeamById(teamid?: string) {
    if (!teamid) return '';
    return this.dataService.getTeamByTeamId(teamid);
  }
  ngOnDestroy(): void {
    // Clean up event listener
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  versions = signal<string[]>([]);

  onOSChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const osName = select.value;

    if (!osName) {
      this.versions.set([]);
      return;
    }

    const os = this.operatingSystems.find(o => o.operatingSystem === osName);
    this.versions.set(os ? os.version : []);
  }


  initForm() {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      model: [''],
      tag: ['', Validators.required],
      tagLower: [''],
      status: ['', Validators.required],
      assignedTo: [''],
      assignedToName: [''],
      os: [''],
      osVersion: [''],
      ram: [''],
      drive: [''],
      serialNumber: [''],
      purchaseDate: ['', [Validators.required, this.dateNotFutureValidator]],
      peripherals: [''],
      history: this.fb.array([]),
      installedSoftware: this.fb.array([]),
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


    // Initialize forms
    this.historyForm = this.fb.group({
      note: ['', Validators.required],
      date: ['',]
    });

    this.softwareForm = this.fb.group({
      name: ['', Validators.required],
      version: [''],
      purchaseDate: ['', Validators.required],
      expireDate: [''],
      licenseKey: [''],
      notes: [''],
    });


  }

  // Helper functions
  getEmployeeById(id: string): UserModel | undefined {
    return this.employeesByCompany().find(emp => emp.id === id);
  }
  getStatusColor(status: string): string {
    const match = this.selectedCompany?.assetStatus?.find(s => s.id === status);
    return match?.color || '#9CA3AF'; // fallback to gray-400 if not found
  }
  getStatusLabel(statusId: string): string {
    return this.selectedCompany?.assetStatus.find(s => s.id === statusId)?.status || '';
  }

  addHistory() {
    if (this.historyForm.invalid) {
      this.toastr.error('Please fill required fields');
      this.historyForm.markAllAsTouched();
      return;
    }

    this.historyArray.push({
      note: this.historyForm.value.note,
      date: this.historyForm.value.date
    });
    this.historyForm.reset();
  }

  removeHistory(index: number) {
    this.historyArray.splice(index, 1);
  }

  addSoftware() {
    if (this.softwareForm.invalid) {
      this.toastr.error('Please fill required fields..');
      this.softwareForm.markAllAsTouched();
      return;
    }


    this.softwareArray.push({
      name: this.softwareForm.value.name,
      version: this.softwareForm.value.version,
      purchaseDate: this.softwareForm.value.purchaseDate,
      expireDate: this.softwareForm.value.expireDate,
      licenseKey: this.softwareForm.value.licenseKey,
      notes: this.softwareForm.value.notes

    });
    this.softwareForm.reset();
  }

  removeSoftware(index: number) {
    this.softwareArray.splice(index, 1);
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
      this.filteredEmployeeResults.set([{
        id: '',
        name: 'Not Assigned',
        email: '',
        role: 'employee',
        companyId: '',
        team: '',
        dateOfJoining: ''
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
          const baseQuery = query(ref, where('companyId', '==', this.selectedCompany.id));
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
        this.handleAssetsFetched(assets);
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

      // Load existing history and software into arrays
      this.historyArray = asset.history || [];
      this.softwareArray = asset.installedSoftware || [];

      // Reset and patch the history and software forms if needed
      this.historyForm.reset();
      this.softwareForm.reset();
    } else {
      this.assetForm.reset();
      this.editingAssetId = null;
      this.selectedEmployeeName = '';


      // Clear arrays when adding new
      this.historyArray = [];
      this.softwareArray = [];
    }
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.assetForm.reset();
    this.isEditing.set(false);
    this.selectedEmployeeName = '';
    // Clear history and software arrays
    this.historyArray = [];
    this.softwareArray = [];

    // Reset the forms
    this.historyForm.reset();
    this.softwareForm.reset();
    this.activeTab = 'basic';
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
      const q = query(assetRef, where('tagLower', '==', tagLower), where('companyId', '==', companyId));
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
        companyId: companyId,
        history: this.historyArray,
        installedSoftware: this.softwareArray
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

  async deleteAsset(assetId: string, tag: string) {

    const confirmed = await this.confirmService.show(
      'Delete Asset',
      `Are you sure you want to delete this Asset? Tag: ${tag}`,
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


  // For Excel
  showExcelPopup = false;
  excelFields: { key: string; selected: boolean }[] = [];
  assets: any[] = [];

  private buildDynamicExcelFields(assets: any[]) {
    const availableKeys = new Set<string>();
    assets.forEach(asset => {
      Object.keys(asset).forEach(key => availableKeys.add(key));
    });


    // First add in AssetModel order
    this.excelFields = [...AssetFields.DEFAULT_EXCEL_FIELDS]
      .filter(field => availableKeys.has(field.key as string))
      .map(field => ({
        key: field.key as string,
        selected: field.selected
      }));
      
    // Then append any extra Firestore fields not in DEFAULT_EXCEL_FIELDS
    Array.from(availableKeys).forEach(key => {
      if (!this.excelFields.find(f => f.key === key)) {
        this.excelFields.push({ key, selected: true });
      }
    });

        // ✅ Always include 'team' field if not already present
    if (!this.excelFields.find(f => f.key === 'team')) {
      this.excelFields.push({ key: 'team', selected: true });
    }

  }


  private handleAssetsFetched(assetList: any[]) {
    this.assets = assetList;
    this.buildDynamicExcelFields(assetList);
  }

  // Toggle modal
  openExcelPopup() {

    // ✅ 1. If no records → show "No data" message
    if (!this.assets || this.assets.length === 0) {
      this.toastr.error('No data available to export');
      return;
    }

    this.showExcelPopup = true;
  }

  closeExcelPopup() {
    this.showExcelPopup = false;
  }

  toggleFieldSelection(index: number) {
    this.excelFields[index].selected = !this.excelFields[index].selected;
  }

  drop(event: CdkDragDrop<{ key: string; selected: boolean }[]>) {
    moveItemInArray(this.excelFields, event.previousIndex, event.currentIndex);
  }


  // Main Export function
  async generateExcel() {

    this.loadingService.show();

    try {
      const selectedFields = this.excelFields
        .filter(f => f.selected)
        .map(f => f.key);

      const dataForExcel = this.assets.map(asset => {
        const filtered: any = {};
        selectedFields.forEach(key => {
          let value = (asset as any)[key];

          if (key === 'team') {
            const emp = this.getEmployeeById(asset.assignedTo);
            if (emp?.team) {
              value = this.getTeamById(emp.team); // maps team ID to team name
            } else {
              value = '';
            }
          }

          // Flatten arrays for export
          if (key === 'history' && Array.isArray(value)) {
            value = value.map((h: any) => `${h.note} (${h.date})`).join('; ');
          }
          if (key === 'installedSoftware' && Array.isArray(value)) {
            value = value.map((s: any) => `${s.name} ${s.version || ''}`).join('; ');
          }


          // Use label if available, fallback to key
          const label = [...AssetFields.DEFAULT_EXCEL_FIELDS].find(f => f.key === key)?.label
            || key.charAt(0).toUpperCase() + key.slice(1);

          filtered[label] = value ?? '';
        });
        return filtered;
      });

      // Create worksheet with header space
      const worksheet = XLSX.utils.aoa_to_sheet([
        [`Asset Detail: ${this.selectedCompany?.name || ''}`], // Row 1
        [`Status: ${this.filterStatusControl.value || 'All'}`],
        [`Generated on: ${new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}`]

      ]);

      // Heading (Row 1)
      // const headingTitle = [['Asset Detail']];
      // XLSX.utils.sheet_add_aoa(worksheet, headingTitle, { origin: 'A1' });

      // Filter row (Row 2)
      const filterRow = [[`Status: ${this.filterStatusControl.value || 'All'}`]];
      XLSX.utils.sheet_add_aoa(worksheet, filterRow, { origin: 'A2' });

      // Add data starting at A3
      XLSX.utils.sheet_add_json(worksheet, dataForExcel, { origin: 'A4' });

      // Merge heading row 1 across all columns
      const totalCols = selectedFields.length;
      worksheet['!merges'] = worksheet['!merges'] || [];
      worksheet['!merges'].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: totalCols - 1 }
      });

      // Column widths
      worksheet['!cols'] = selectedFields.map(() => ({ wch: 15 }));

      // Style heading row
      Object.keys(worksheet).forEach(cell => {
        if (cell[0] === '!') return;
        const { r } = XLSX.utils.decode_cell(cell);

        if (r === 0) {
          worksheet[cell].s = {
            font: { bold: true, sz: 18 },
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }
        if (r === 2) {
          worksheet[cell].s = {
            font: { bold: true },
            alignment: { horizontal: 'center' }
          };
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-');

      XLSX.writeFile(workbook, `assets_${dateStr}.xlsx`);
      this.closeExcelPopup();

    } catch (err) {
      console.error(err);
      this.toastr.error('Failed to generate Excel');
    } finally {
      this.loadingService.hide();
    }
  }


  // Signal to control modal visibility and hold the asset to print
  printModalOpen = signal(false);
  printAsset = signal<any | null>(null);

  async openPrintModal(asset: any) {
    this.printAsset.set(asset);
    this.printModalOpen.set(true);

  }

  closePrintModal() {
    this.printModalOpen.set(false);
    this.printAsset.set(null);
  }

  printSticker() {
    if (!this.printAsset()) return;

    // Open a new window for printing
    const printWindow = window.open('', 'PrintWindow', 'width=400,height=300');
    if (!printWindow) {
      this.toastr.error('Failed to open print preview');
      return;
    }

    const asset = this.printAsset();

    const htmlContent = `
            <html>
              <head>
                <title>Print Asset Sticker</title>
                <style>
          body {
            margin: 0;
            padding: 0;
          }
          .sticker {
            width: 100mm;
            height: 50mm;
            padding: 5mm;
            box-sizing: border-box;
            border: 1px solid #000;
            font-family: Arial, sans-serif;
            font-size: 12pt;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .sticker h3 {
            margin: 0 0 4mm 0;
            font-size: 14pt;
          }
          .sticker p {
            margin: 2mm 0;
          }
          @page {
            size: 100mm 50mm;
            margin: 0;
          }
        </style>

      </head>
      <body>
        <div class="sticker">
          <h3>${asset.name} - ${asset.model || '-'}</h3>
          <p><strong>Company:</strong>${this.selectedCompany!.name} </p>
          <p><strong>Tag:</strong> ${asset.tag}</p>
          <p><strong>Serial Number:</strong> ${asset.serialNumber || '-'}</p>
          <p><strong>Assigned To:</strong> ${asset.assignedToName || '-'}</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

}
