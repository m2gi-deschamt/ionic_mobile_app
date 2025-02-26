import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import {NaviguationComponent} from './naviguation/naviguation.component' 

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <app-naviguation></app-naviguation>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  imports: [IonApp, IonRouterOutlet, NaviguationComponent],
})
export class AppComponent {}
