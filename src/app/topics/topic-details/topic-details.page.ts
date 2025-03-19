import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic/topic.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical, shareOutline, shareSocial } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Topic } from 'src/app/models/topic';
import { ShareTopicModalComponent } from 'src/app/share-topic-modal/share-topic-modal.component';

addIcons({ addOutline, chevronForward, ellipsisVertical, shareOutline, shareSocial });

@Component({
  selector: 'app-topic-details',
  templateUrl: './topic-details.page.html',
  styleUrls: ['./topic-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class TopicDetailsPage {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly router = inject(Router);


  topicId = this.route.snapshot.params['id'];

  topic = toSignal(this.topicService.getById(this.topicId));

  posts = toSignal(this.topicService.getPostsByTopicId(this.topicId));

  async openModal(post?: Post): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: { topicId: this.topicId, post },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentPostManagementPopover(event: Event, post: Post) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
    });

    await popover.present();

    const {
      data: { action },
    } = await popover.onDidDismiss();

    if (action === 'remove') this.topicService.removePost(this.topicId, post);
    else if (action === 'edit') this.openModal(post);
  }

  async openShareModal() {
    // Make sure we have a topic before proceeding
    const currentTopic = this.topic();
    if (!currentTopic) return;
    
    const modal = await this.modalCtrl.create({
      component: ShareTopicModalComponent,
      componentProps: {
        topic: currentTopic
      }
    });
  
    await modal.present();
  
    const result = await modal.onDidDismiss();
    if (result.data) {
      if (result.data.action === 'remove') {
        this.removeUserFromSharing(currentTopic, result.data.userId);
      } else {
        this.addUserToSharing(currentTopic, result.data.username, result.data.role);
      }
    }
  }
  
  private async addUserToSharing(topic: Topic, username: string, role: 'reader' | 'editor') {
    try {
      console.log(`Adding ${username} as ${role} to topic ${topic.id}`);
      await this.topicService.addUserToTopicSharing(topic.id, username, role);
    } catch (error) {
      console.error('Error adding user to sharing:', error);
    }
  }

  private async removeUserFromSharing(topic: Topic, userId: string) {
    try {
      console.log(`Removing user ${userId} from topic ${topic.id}`);
       await this.topicService.removeUserFromTopicSharing(topic.id, userId);
    } catch (error) {
      console.error('Error removing user from sharing:', error);
    }
  }

  canEdit(): boolean {
    const currentTopic = this.topic();
    if (!currentTopic) return false;
    return this.topicService.hasEditPermission(currentTopic);
  }
  
  // Récupérer le rôle de l'utilisateur
  getUserRole(): 'owner' | 'editor' | 'reader' | undefined {
    const currentTopic = this.topic();
    if (!currentTopic) return undefined;
    return this.topicService.getUserRole(currentTopic);
  }
  
  // Vérifier si l'utilisateur est propriétaire
  isOwner(): boolean {
    const currentTopic = this.topic();
    if (!currentTopic) return false;
    return this.topicService.isOwner(currentTopic);
  }
  navigateToTopics() {
    this.router.navigate(['/topics']);
  }
}