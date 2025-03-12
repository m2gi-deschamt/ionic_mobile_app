import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonItem, 
         IonLabel, IonCardContent, IonButton, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sendEmailVerification } from '@angular/fire/auth'
import { UserService } from '../services/user/user.service';

const INVALID_CRDENTIALS = "INVALID_LOGIN_CREDENTIALS";

@Component({
  standalone: true,
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonCardContent, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonItem, 
    IonLabel, 
    IonButton, 
    IonInput, 
    ReactiveFormsModule, 
    CommonModule
  ],
})
export class AuthPage implements OnInit {
  authForm!: FormGroup;
  isLogin = true;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.errorMessage = '';
    
    if (this.isLogin) {
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
      });
    } else {
      this.authForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        confirmPassword: ['', Validators.required]
      });
    }
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.initForm();
  }


  async onSubmit() {
    if (this.authForm.invalid) {
      return;
    }
    const { email, password, confirmPassword, username } = this.authForm.value;
  
    if (!this.isLogin && password !== confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas";
      return;
    }
    if (password.length < 6) {
      this.errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      return;
    }
    else {
      try {
        if (this.isLogin) {
          await this.authService.signIn(email, password);
        } else {
          const credential = await this.authService.addUser(email, password);
      
          await this.userService.createUpdateUser({
            uid: credential.user.uid,
            username: username
          });

          await sendEmailVerification(credential.user);
        }
        this.router.navigateByUrl('/topics');
      } catch (error: any) {
        this.errorMessage = error.message || (this.isLogin ? "Erreur de connexion" : "Erreur lors de l'inscription");
      }
    }
  }
}
