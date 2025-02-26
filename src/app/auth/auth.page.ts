import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
})
export class AuthPage implements OnInit {
  authForm!: FormGroup;
  isLogin = true;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
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

  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      return;
    }
    const { email, password } = this.authForm.value;
    if (this.isLogin) {
      try {
        await this.authService.signIn(email, password);
        this.router.navigateByUrl('/topics');
      } catch (error) {
        console.error('Erreur de connexion', error);
      }
    } else {
      if (this.authForm.value.password !== this.authForm.value.confirmPassword) {
        console.error('Les mots de passe ne correspondent pas');
        return;
      }
      try {
        await this.authService.addUser(email, password);
        this.router.navigateByUrl('/topics');
      } catch (error) {
        console.error('Erreur lors de l inscription', error);
      }
    }
  }
}