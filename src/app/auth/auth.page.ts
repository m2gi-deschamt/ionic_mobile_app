import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonItem, 
         IonLabel, IonCardContent, IonButton, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { sendEmailVerification } from '@angular/fire/auth'
import { UserService } from '../services/user/user.service';

const INVALID_CREDENTIALS = "INVALID_LOGIN_CREDENTIALS";

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
  isVerificationMessage = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      if (params.has('reset')) {
        this.resetAuthPage();
      } else {
        this.initForm();
      }
    });
  }

  resetAuthPage(): void {
    this.isLogin = true;
    this.errorMessage = '';
    this.isVerificationMessage = false;
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  initForm(): void {
    if (!this.isVerificationMessage) {
      this.errorMessage = '';
    }
    
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
    
    // Clear verification flag when manually toggling between modes
    this.isVerificationMessage = false;
    this.errorMessage = '';
    
    this.initForm();
  }

  setError(message: string, isVerification = false): void {
    this.errorMessage = message;
    this.isVerificationMessage = isVerification;
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      return;
    }
    const { email, password, confirmPassword, username } = this.authForm.value;
  
    if (!this.isLogin && password !== confirmPassword) {
      this.setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      this.setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    else {
      try {
        if (this.isLogin) {
          await this.authService.signIn(email, password);
          
          // Check if email is verified
          if (!this.authService.isEmailVerified()) {
            this.setError("Veuillez vérifier votre email avant de vous connecter", true);
            await this.authService.signOut();
            return;
          }
          
          // If email verified, navigate to topics
          this.router.navigateByUrl('/topics');
        } else {
          // Registration flow
          const credential = await this.authService.addUser(email, password);
      
          await this.userService.createUpdateUser({
            uid: credential.user.uid,
            username: username
          });
  
          await sendEmailVerification(credential.user);
          
          // Sign out after registration and show message
          await this.authService.signOut();
          
          // Switch to login mode
          this.isLogin = true;
          this.initForm();
          this.setError("Un email de vérification vous a été envoyé. Veuillez vérifier votre email avant de vous connecter", true);
        }
      } catch (error: any) {
        let errorMsg = "Une erreur s'est produite";
        
        if (error.code === 'auth/email-already-in-use') {
          errorMsg = "Cette adresse email est déjà utilisée";
        } else if (error.code === 'auth/invalid-email') {
          errorMsg = "Adresse email invalide";
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMsg = "Email ou mot de passe incorrect";
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = "Trop de tentatives de connexion. Veuillez réessayer plus tard";
        } else if (error.message && error.message.includes(INVALID_CREDENTIALS)) {
          errorMsg = "Email ou mot de passe incorrect";
        }
        
        this.setError(errorMsg);
      }
    }
  }
}