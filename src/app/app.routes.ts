import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { catchError, map, of } from 'rxjs';

export const isAuthentificated = () => {
  const _authService = inject(AuthService);
  const _router = inject(Router);
  return _authService.getConnectedAuth().pipe(
    map(user => {
      if(!user) {
        _router.navigateByUrl('/auth');
        return false;
      }
      return true;
    }),
    catchError(() => {
      _router.navigateByUrl('/auth');
      return of(false);
    })
  );
};

export const routes: Routes = [
  {
    canActivate: [
      isAuthentificated
    ],
    path: 'topics',
    loadComponent: () =>
      import('./topics/topics.page').then((m) => m.TopicsPage),
  },
  {
    canActivate: [
      isAuthentificated
    ],
    path: 'topics/:id',
    loadComponent: () =>
      import('./topics/topic-details/topic-details.page').then(
        (m) => m.TopicDetailsPage
      ),
  },
  {
    path: '',
    redirectTo: 'topics',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then( m => m.AuthPage)
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout/logout.page').then( m => m.LogoutPage)
  },
];
