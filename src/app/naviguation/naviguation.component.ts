import { Component, OnInit, inject } from '@angular/core';
import { IonRouterLink, IonButton, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, bookOutline, personCircleOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-naviguation',
  templateUrl: './naviguation.component.html',
  styleUrls: ['./naviguation.component.scss'],
  imports: [IonRouterLink, IonToolbar, IonTitle, IonHeader, IonButton, IonIcon, IonButtons, AsyncPipe]
})
export class NaviguationComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  isAuthenticated$!: Observable<User | null>;

  constructor() {
    addIcons({ bookOutline, personCircleOutline, homeOutline, logOutOutline });
  }

  ngOnInit() {
    this.isAuthenticated$ = this.authService.getConnectedAuth();
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/auth']);
  }
  home() {
    this.router.navigate(['']);
  }
}