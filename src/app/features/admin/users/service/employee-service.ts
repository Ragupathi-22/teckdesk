// src/app/core/services/employee.service.ts
import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase.config';
import { UserModel } from '../../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {

  async getEmployeesByCompany(companyId: string): Promise<UserModel[]> {
    const ref = collection(db, 'employees');
    const q = query(ref, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserModel));
  }

  async getEmployeesByCompanyTeamRole(companyId: string, team: string, role: string): Promise<UserModel[]> {
    const ref = collection(db, 'employees');
    const q = query(
      ref,
      where('companyId', '==', companyId),
      where('team', '==', team),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserModel));
  }

  async getEmployeeByEmail(email: string): Promise<UserModel | null> {
    const ref = collection(db, 'employees');
    const q = query(ref, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserModel;
    }
    return null;
  }

  async getEmployeeById(uid: string): Promise<UserModel | null> {
    const docRef = doc(db, 'employees', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as UserModel;
    }
    return null;
  }
  async searchEmployeesByName(companyId: string, term: string): Promise<UserModel[]> {
    companyId = companyId;
    if (!companyId || !term.trim()) return [];

    const ref = collection(db, 'employees');
    const q = query(
      ref,
      where('companyId', '==', companyId),
    );

    const snapshot = await getDocs(q);
    const results: UserModel[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserModel;
      if (data.name.toLowerCase().includes(term.toLowerCase())) {
        results.push({ ...data, id: docSnap.id });
      }
    });

    return results;
  }

}
