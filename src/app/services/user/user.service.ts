import { inject, Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Firestore, collection, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Observable, from, of, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  usersCollection = collection(this.firestore, 'users');
  
  async createUpdateUser(user: Partial<User>): Promise<void> {
    if (!user.uid) {
      throw new Error('User ID is required');
    }
    
    const userDoc = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userDoc, user, { merge: true });
  }
  
  getUserById(userId: string): Observable<User | null> {
    if (!userId) return of(null);
    
    const userDoc = doc(this.firestore, `users/${userId}`);
    return from(getDoc(userDoc)).pipe(
      map(doc => {
        if (doc.exists()) {
          return { uid: doc.id, ...doc.data() } as User;
        }
        return null;
      })
    );
  }
  
  getCurrentUser(): Observable<User | null> {
    return this.authService.getConnectedAuth().pipe(
      switchMap(user => {
        if (!user) return of(null);
        return this.getUserById(user.uid);
      })
    );
  }
}