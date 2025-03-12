import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonItem, IonLabel, IonCardContent ,IonButton } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {sendEmailVerification} from '@angular/fire/auth'

const INVALID_CRDENTIALS = "INVALID_LOGIN_CREDENTIALS";

@Component({
  standalone: true,
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [IonHeader, IonToolbar, IonCardContent, IonTitle, IonContent, IonCard, IonItem, IonLabel, IonButton, ReactiveFormsModule, CommonModule],
})

export class AuthPage implements OnInit {
  authForm!: FormGroup;
  isLogin = true;
  errorMessage = '';
  

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.errorMessage = '';
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      ...(this.isLogin ? {} : { confirmPassword: ['', Validators.required] })
    });
  }

  toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.ngOnInit();
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      return;
    }
    const { email, password, confirmPassword } = this.authForm.value;
  
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
          const user = await this.authService.addUser(email, password);
          await sendEmailVerification(user.user);
        }
        this.router.navigateByUrl('/topics');
      } catch (error: any) {
        this.errorMessage = error.message || (this.isLogin ? "Erreur de connexion" : "Erreur lors de l'inscription");
      }
    }
  }
}