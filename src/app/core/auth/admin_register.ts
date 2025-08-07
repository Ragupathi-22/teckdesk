// Register Model 
export type Role = 'admin' | 'employee';
export type Company = 'MTPL' | 'NTPL';

export interface RegisterMeta {
    name: string;
    email: string;
    role: Role;
}

// Register Service 
import { Injectable, signal } from '@angular/core';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.config';

@Injectable({ providedIn: 'root' })
export class AdminRegisterService {

    private _currentUser = signal<User | null>(auth.currentUser);
    currentUser = this._currentUser.asReadonly();

    constructor() {
        onAuthStateChanged(auth, (u) => this._currentUser.set(u));
    }

    /** Register + create user profile doc */
    async register(email: string, password: string, meta: RegisterMeta) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Optional: set displayName
        await updateProfile(cred.user, { displayName: meta.name });

        // Recommended: store everyone in a single `users` collection
        await setDoc(doc(db, 'admin', cred.user.uid), {
            uid: cred.user.uid,
            name: meta.name,
            email: meta.email,
            role: meta.role,           
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return cred.user;
    }

    /** Simple boolean flag */
    isAuthenticated() {
        return !!this._currentUser();
    }
}
