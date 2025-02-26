import { Component, OnInit } from '@angular/core';
import {IonRouterLink, IonButton, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, bookOutline, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-naviguation',
  templateUrl: './naviguation.component.html',
  styleUrls: ['./naviguation.component.scss'],
  imports :  [IonRouterLink,IonToolbar, IonTitle,IonHeader,IonButton,IonIcon,IonButtons]
})
export class NaviguationComponent  implements OnInit {

  constructor() {
    addIcons({bookOutline, personCircleOutline, homeOutline});
  }

  ngOnInit() {}

}
