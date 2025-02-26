import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-logout',
  template: '<ion-content></ion-content>',
  styleUrls: ['./logout.page.scss'],
  imports: [IonicModule],
})
export class LogoutPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService.signOut();
    this.router.navigateByUrl('/auth');
  }
}