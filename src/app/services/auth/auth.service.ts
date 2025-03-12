import { Injectable, inject } from '@angular/core';
import {Auth, user, User, sendPasswordResetEmail, 
  createUserWithEmailAndPassword, UserCredential, 
  signInWithEmailAndPassword, signOut, sendSignInLinkToEmail} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  getConnectedAuth(): Observable<User | null> {
    return user(this.auth);
  }
  isEmailVerified(): boolean {
    const user = this.auth.currentUser;
    return user !== null && user.emailVerified === true;
  }
  addUser(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut(): Promise<void> {
    return signOut(this.auth)
  }

  isConnected(): User | null {
    return this.auth.currentUser;
  }

  resetPassword(email : string) {
    return sendPasswordResetEmail(this.auth, email);
  }
  
  constructor() { }
}

