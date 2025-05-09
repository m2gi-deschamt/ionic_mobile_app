import { Component, computed, inject, signal } from '@angular/core';
import {IonBadge, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonButton, 
  IonBreadcrumb, IonList, IonIcon, IonImg, IonFab, IonFabButton, IonBreadcrumbs } from '@ionic/angular/standalone';
import { TopicService } from '../services/topic/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './popover/item-management/item-management.component';
import { Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-home',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Topics</ion-breadcrumb>
        </ion-breadcrumbs>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Topics</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        @for(topic of topics(); track topic.id) {
        <ion-item>
      @if(canEdit(topic)) {
        <ion-button
          slot="start"
          fill="clear"
          id="click-trigger"
          (click)="presentTopicManagementPopover($event, topic)"
          aria-label="open topic management popover"
          data-cy="open-topic-management-popover"
        >
          <ion-icon slot="icon-only" color="medium" name="ellipsis-vertical"></ion-icon>
        </ion-button>
      }@else {
          <!-- Espace réservé invisible pour maintenir l'alignement -->
          <div slot="start" style="width: 30px;"></div>
        }

      <ion-label [routerLink]="['/topics/' + topic.id]">
        {{ topic.name }}
        <p>
          <ion-badge color="{{ getUserRole(topic) === 'owner' ? 'primary' : (getUserRole(topic) === 'editor' ? 'tertiary' : 'medium') }}">
            {{ getUserRole(topic) === 'owner' ? 'Owner' : (getUserRole(topic) === 'editor' ? 'Editor' : 'Reader') }}
          </ion-badge>
        </p>
      </ion-label>
      <ion-icon
        slot="end"
        [routerLink]="['/topics/' + topic.id]"
        color="medium"
        name="chevron-forward"
      ></ion-icon>
    </ion-item>
        } @empty {
        <ion-img class="image" src="assets/img/no_data.svg" alt=""></ion-img>
        }
      </ion-list>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button
          data-cy="open-create-topic-modal-button"
          aria-label="open add topic modal"
          (click)="openModal()"
        >
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      .image::part(image) {
        width: 50%;
        margin: auto;
      }
    `,
  ],
  imports: [IonBadge, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, 
    IonLabel ,IonButton, CommonModule, RouterLink,IonBreadcrumbs,
    IonBreadcrumb, IonList, IonIcon, IonImg, IonFab, IonFabButton],
})
export class TopicsPage {
  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);

  topics = toSignal(this.topicService.getAll());

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentTopicManagementPopover(event: Event, topic: Topic) {
    const currentUserRole = this.getUserRole(topic);

    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: {
        topic: topic,
        userRole: currentUserRole
      }
    });
  
    await popover.present();
  
    const { data } = await popover.onDidDismiss();
    
    if (!data) return;
    
    switch (data.action) {
      case 'remove':
        this.topicService.removeTopic(topic);
        break;
      case 'edit':
      case 'view':
        this.openModal(topic);
        break;
    }
  }
  getUserRole(topic: Topic): 'owner' | 'editor' | 'reader' | undefined {
    return this.topicService.getUserRole(topic);
  }
  canEdit(topic: Topic): boolean {
    const role = this.getUserRole(topic);
    return role === 'owner' || role === 'editor';
  }
}
