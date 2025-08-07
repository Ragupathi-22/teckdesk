import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../core/services/data.service';
import { Company, Team } from '../../../core/models/company.models';
import { LucideIconCollection } from '../../../shared/icons/lucide-icons';
import { ToastService } from '../../../shared/service/toast.service';
import { Subject, combineLatest, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  map,
  catchError,
  tap
} from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { db } from '../../../firebase.config'; // ✅ your firestore instance
import { environment } from '../../../../environment';
import { LoadingService } from '../../../shared/service/loading.service';
import { UserModel } from '../../../core/models/user.model';
import { MailService } from '../../../shared/service/mail.service';
import { ConfirmDialogService } from '../../../shared/service/confirm-dialog.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './users.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule]
})
export class Users implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastService);
  private dataService = inject(DataService);
  private loadingService = inject(LoadingService);
  private mailService = inject(MailService);
  private confirmService = inject(ConfirmDialogService);
  LucideIcon = LucideIconCollection;

  searchControl = new FormControl('');
  filterTeamControl = new FormControl('All');

  showForm = signal(false);
  editingUserId: string | null = null;

  selectedCompany: Company | undefined;
  filteredTeams: Team[] = [];

  filteredUsers = signal<UserModel[]>([]);
  loadingTable = signal(false);
  loadingForm = signal(false);


  reload$ = new Subject<void>();

  userForm!: FormGroup;

  pageSize = 10;
  currentPage = signal(1);

  async ngOnInit(): Promise<void> {

    this.selectedCompany = this.dataService.getCompany();
    this.filteredTeams = this.dataService.getTeams() || [];

    // if (this.authService.getRole() === 'admin') {
    //   await this.ensureEmployeesCollection();
    // }

    this.initForm();
    this.setupFilterStream();
  }

  initForm() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      team: ['', Validators.required],
    });
  }

  setupFilterStream() {
    combineLatest([
      this.searchControl.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterTeamControl.valueChanges.pipe(startWith('All')),
      this.reload$.pipe(startWith(void 0))
    ])
      .pipe(
        tap(() => {
          this.loadingTable.set(true);
        }),
        switchMap(async ([search, team]) => {
          const results: any[] = [];

          if (!this.selectedCompany?.id) return results;

          const ref = collection(db, 'employees');
          const baseQuery = query(ref, where('companyId', '==', this.selectedCompany.id));
          const snapshot = await getDocs(baseQuery);

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            results.push(data);
          });

          // Apply filters
          let filtered = results;
          if (team !== 'All') filtered = filtered.filter((u) => u.team === team);
          if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter((u) =>
              u.name.toLowerCase().includes(term) ||
              u.email.toLowerCase().includes(term)
            );
          }

          return filtered;
        }),
        catchError((err) => {
          console.error('Error loading users:', err);
          this.toastr.error('Failed to load users');
          return of([]);
        })
      )
      .subscribe((users) => {
        this.filteredUsers.set(users);
        this.currentPage.set(1);
        this.loadingTable.set(false);
      });
  }


  get paginatedUsers() {
    return computed(() => {
      const start = 0;
      const end = this.currentPage() * this.pageSize;
      return this.filteredUsers().slice(start, end);
    });
  }

  nextPage() {
    const totalLoaded = this.currentPage() * this.pageSize;
    if (totalLoaded < this.filteredUsers().length) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  openForm() {
    this.userForm.reset({ role: 'employee' });
    this.userForm.get('email')?.enable();
    this.editingUserId = null;
    this.showForm.set(true);
    // ✅ Set default team if teams are available
    if (this.filteredTeams.length) {
      this.userForm.patchValue({ team: this.filteredTeams[0].team });
    }
  }


  closeForm() {
    this.showForm.set(false);
  }


  onSubmit() {
    if (this.userForm.invalid) {
      this.toastr.error('Please fill out all required fields correctly.');
      return;
    }

    this.loadingForm.set(true);

    const formValue = this.userForm.value;
    const email = formValue.email;
    const password = `${this.selectedCompany?.empPass}`;
    const payload = {
      ...formValue,
      companyId: this.selectedCompany?.id,
      role: 'employee'
    };


    if (this.editingUserId) {
      // ✏️ Edit flow - only update Firestore
      updateDoc(doc(db, 'employees', this.editingUserId), payload)
        .then(() => {
          this.toastr.success('User updated successfully.');
          this.closeForm();
          this.reload$.next();
        })
        .catch(() => this.toastr.error('Failed to update user.'))
        .finally(() => this.loadingForm.set(false));

      return; // ✅ Important: return so rest of code doesn't run
    }

    // ✅ Add flow: first register via PHP
    fetch(`${environment.Base_API}register-user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.uid) {
          this.toastr.success(`User registered. Default password: ${password}`);
          return addUserToFirestore(res.uid);
        } else if (res.code === 'EMAIL_EXISTS') {
          this.toastr.error('Email already exists. Choose a different one.');
          return;
        } else {
          this.toastr.error('Registration failed. Try again.');
          return;
        }
      })

      .catch((err) => {
        console.error('Registration error:', err);
        this.toastr.error('Error contacting registration API.');
        return; // ✅ Explicit return to avoid TS7030
      })
      .finally(() => {
        this.loadingForm.set(false);
      });

    //Add user to firebase
    const addUserToFirestore = async (uid: string) => {
      const userPayload = {
        ...payload,
        id: uid,
      };

      try {
        const userDocRef = doc(db, 'employees', uid); // 🔑 Use Firebase Auth UID
        await setDoc(userDocRef, userPayload);
        this.toastr.success('User added successfully.');

        // Sent mail to employee regarding register
        this.mailService.mailToEmployeeForAccountCreation(
          email,  //email =email
          email, // username = email
          password,
          environment.LiveSiteURLForEmployee
        )?.subscribe({
          next: (res) => {
            if (res.success) {
              this.toastr.success('Mail Sent to Employee');
            }
            if (!res.success) {
              console.warn('Mail sending failed:', res.error);
            }
          },
          error: (err) => {
            console.error('Mail error:', err);
          }
        });


        this.closeForm();
        this.reload$.next();
      } catch {
        this.toastr.error('Failed to add user to Firestore.');
      }
    };



  }




  editUser(user: any) {
    this.editingUserId = user.id;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      team: user.team,
      role: 'employee'
    });

    // Disable email field during edit
    this.userForm.get('email')?.disable();

    this.showForm.set(true);
  }


  async deleteUser(userId: string,username :string) {

    const confirmed = await this.confirmService.show(
      'Delete User',
      `Are you sure you want to delete this User? ${username}`,
      'Delete',
      'Cancel'
    );

    if (!confirmed) return;
    this.loadingForm.set(true);
    this.loadingService.show();

    const user = this.filteredUsers().find(u => u.id === userId);
    const email = user?.email;

    const deleteFromFirestore = () => {
      return deleteDoc(doc(db, 'employees', userId));
    };

    const deleteFromAuth = () => {
      if (!email) return Promise.resolve(); // skip if no email

      return fetch(`${environment.Base_API}delete-user.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
        .then(res => res.json())
        .then((res) => {
          if (!res.success) {
            this.toastr.error(res.error || 'Failed to delete from Auth');
          }
        })
        .catch(() => {
          this.toastr.error('Failed to contact delete-user API');
        });
    };

    // ✅ Unassign assets where this user was assigned
    const unassignAssetsOfDeletedUser = async (userId: string) => {
      const q = query(collection(db, 'assets'), where('assignedTo', '==', userId));
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map(docSnap =>
        updateDoc(doc(db, 'assets', docSnap.id), {
          assignedTo: '',
          assignedToName: '',
          status: "In Stock"
        })
      );

      return Promise.all(updates);
    };

    // 👇 Run all steps in parallel
    Promise.all([
      deleteFromFirestore(),
      deleteFromAuth(),
      unassignAssetsOfDeletedUser(userId)
    ])
      .then(() => {
        this.toastr.success('User deleted');
        this.reload$.next();
      })
      .catch(() => this.toastr.error('Failed to delete user'))
      .finally(() => {
        this.loadingForm.set(false);
        this.loadingService.hide();
      });
  }




  private async ensureEmployeesCollection(): Promise<void> {
    const ref = collection(db, 'employees');
    const snapshot = await getDocs(ref);
    if (snapshot.empty) {
      const defaultUser = {
        name: 'Test Employee',
        email: 'test@company.com',
        team: 'General',
        role: 'employee',
        companyId: this.selectedCompany?.id || 'DEFAULT_CODE',
      };
      await addDoc(ref, defaultUser);
      this.toastr.success('Default employee created');
    }
  }
}
