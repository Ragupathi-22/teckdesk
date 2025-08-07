// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../../firebase.config';
import { BehaviorSubject, filter, firstValueFrom, take } from 'rxjs';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { environment } from '../../../environment';
import { Company } from '../models/company.models';

export type Role = 'admin' | 'employee';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _firebaseUser$ = new BehaviorSubject<User | null>(auth.currentUser);
  firebaseUser$ = this._firebaseUser$.asObservable();

  private _isAuthenticated$ = new BehaviorSubject<boolean>(!!auth.currentUser);
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  private _role$ = new BehaviorSubject<Role | null>(null);
  role$ = this._role$.asObservable();

  private _companyId$ = new BehaviorSubject<string | null>(null);
  companyId$ = this._companyId$.asObservable();

  private readonly COMPANY_KEY = environment.COMPANY_KEY;

  private _authInitCompleted$ = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    onAuthStateChanged(auth, async (user) => {
      this._firebaseUser$.next(user);
      const isLoggedIn = !!user;
      this._isAuthenticated$.next(isLoggedIn);

      if (isLoggedIn) {
        try {
          await this.setUserMeta(user.uid);
        } catch (err) {
          console.error('Error fetching user metadata:', err);
          await this.logout();
          await this.router.navigate(['/login']);
        }
      } else {
        this.clearAuthData();
      }

      this._authInitCompleted$.next(true);
    });
  }

  async waitForAuthInit(): Promise<void> {
    await firstValueFrom(this._authInitCompleted$.pipe(filter(done => done), take(1)));
  }

  async login(email: string, password: string): Promise<{ role: Role }> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    return await this.setUserMeta(uid);
  }

  private async setUserMeta(uid: string): Promise<{ role: Role }> {
    let docRef = doc(db, 'admin', uid);
    let snap = await getDoc(docRef);

    if (snap.exists()) {
      const role: Role = 'admin';
      this._role$.next(role);

      // Check localStorage first
      let storedCompanyId = localStorage.getItem(this.COMPANY_KEY);

      if (!storedCompanyId) {
        // Load companies and sort
        const snapshot = await getDocs(collection(db, 'companies'));
        const companies: Company[] = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Company, 'id'>),
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (companies.length === 0) throw new Error('No companies found');
        storedCompanyId = companies[0].id;
        localStorage.setItem(this.COMPANY_KEY, storedCompanyId);
      }

      this._companyId$.next(storedCompanyId);
      return { role };
    }

    docRef = doc(db, 'employees', uid);
    snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('User document not found');
    }

    const userData = snap.data();
    const role = userData['role'] as Role;
    const companyId = userData['companyId'];
    this._role$.next(role);
    this._companyId$.next(companyId);

    return { role };
  }

  async setAdminCompany(companyId: string) {
    this._companyId$.next(companyId);
    localStorage.setItem(this.COMPANY_KEY, companyId);
  }

  getRole(): Role | null {
    return this._role$.value;
  }

  getCompanyId(): string | null {
    return this._companyId$.value;
  }

  getFirebaseUser(): User | null {
    return this._firebaseUser$.value;
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.clearAuthData();
    await this.router.navigate(['/login']);
  }

  private clearAuthData(): void {
    this._role$.next(null);
    this._companyId$.next(null);
    this._isAuthenticated$.next(false);
    this._firebaseUser$.next(null);
    localStorage.removeItem(this.COMPANY_KEY);
  }
}
