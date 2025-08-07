// src/app/core/services/asset.service.ts
import { Injectable } from '@angular/core';
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc, Firestore, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { AssetModel } from '../../../../core/models/asset.model';
import { db } from '../../../../firebase.config';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AssetService {
  private collectionName = 'assets';
    private assetsSubject = new BehaviorSubject<AssetModel[]>([]);
  assets$ = this.assetsSubject.asObservable();
  private unsubscribe: Unsubscribe | null = null;

 
  async getAssetsByCompany(companyId: string): Promise<AssetModel[]> {
    const ref = collection(db, this.collectionName);
    const q = query(ref, where('comapnyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AssetModel));
  }

  async getAssetsByEmployee(employeeId: string): Promise<AssetModel[]> {
    const ref = collection(db, this.collectionName);
    const q = query(ref, where('assignedTo', '==', employeeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as AssetModel));
  }

  async getAssetById(id: string): Promise<AssetModel | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as AssetModel) : null;
  }

 subscribeToAssets(companyId: string): void {
    if (this.unsubscribe) {
      this.unsubscribe(); // unsubscribe previous
    }

    const assetRef = collection(db, 'assets');
    const q = query(assetRef, where('comapnyId', '==', companyId));

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const assets = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AssetModel[];
      

        this.assetsSubject.next(assets);
      },
      (error) => {
        console.error('Error in asset subscription:', error);
        this.assetsSubject.next([]);
      }
    );
  }

  unsubscribeFromAssets(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // async createAsset(payload: AssetModel): Promise<string> {
  //   const docRef = await addDoc(collection(db, this.collectionName), payload);
  //   return docRef.id;
  // }

  // async updateAsset(id: string, payload: Partial<AssetModel>): Promise<void> {
  //   const docRef = doc(db, this.collectionName, id);
  //   return updateDoc(docRef, payload);
  // }

  // async deleteAsset(id: string): Promise<void> {
  //   const docRef = doc(db, this.collectionName, id);
  //   return deleteDoc(docRef);
  // }
}
