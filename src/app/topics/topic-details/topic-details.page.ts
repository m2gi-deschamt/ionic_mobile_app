import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { toSignal } from '@angular/core/rxjs-interop';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-topic-details',
  templateUrl: './topic-details.page.html',
  styleUrls: ['./topic-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
})
export class TopicDetailsPage {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);

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

    //console.log(action);

    if (action === 'remove') this.topicService.removePost(this.topicId, post);
    else if (action === 'edit') this.openModal(post);
  }
}
