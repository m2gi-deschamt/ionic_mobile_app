import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencil, trash, eyeOutline } from 'ionicons/icons';

addIcons({ trash, pencil, eyeOutline });

@Component({
  selector: 'app-item-management',
  imports: [CommonModule, IonList, IonItem, IonLabel, IonIcon, ReactiveFormsModule],
  templateUrl: './item-management.component.html',
})
export class ItemManagementPopover {
  @Input() userRole?: 'owner' | 'editor' | 'reader';

  constructor(private popoverCtrl: PopoverController) {}

  canEdit(): boolean {
    // L'utilisateur peut éditer s'il est propriétaire ou éditeur
    return this.userRole === 'owner' || this.userRole === 'editor';
  }

  canRemove(): boolean {
    // Seul le propriétaire peut supprimer
    return this.userRole === 'owner';
  }

  isReader(): boolean {
    // Vérifie si l'utilisateur est un simple lecteur
    return this.userRole === 'reader';
  }

  viewDetails() {
    this.popoverCtrl.dismiss({
      action: 'view'
    });
  }

  edit() {
    this.popoverCtrl.dismiss({
      action: 'edit'
    });
  }

  remove() {
    this.popoverCtrl.dismiss({
      action: 'remove'
    });
  }

  cancel() {
    this.popoverCtrl.dismiss();
  }
}
