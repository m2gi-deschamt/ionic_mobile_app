import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {  ModalController } from '@ionic/angular/standalone';
import { Topic, TopicSharing } from '../models/topic';
import { CommonModule } from '@angular/common';
import { IonicModule} from '@ionic/angular'

@Component({
  selector: 'app-share-topic-modal',
  templateUrl: './share-topic-modal.component.html',
  styleUrls: ['./share-topic-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, FormsModule]
})
export class ShareTopicModalComponent implements OnInit {
  @Input() topic!: Topic;
  shareForm!: FormGroup;
  roles = [
    { value: 'reader', label: 'Reader' },
    { value: 'editor', label: 'Editor' }
  ];

  private modalController = inject(ModalController);
  private formBuilder = inject(FormBuilder);

  ngOnInit() {
    this.shareForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      role: ['reader', Validators.required]
    });
    if (!this.topic.sharedWith) {
      this.topic.sharedWith = [];
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  onSubmit() {
    if (this.shareForm.valid) {
      this.modalController.dismiss({
        username: this.shareForm.value.username,
        role: this.shareForm.value.role
      });
    }
  }
  
  removeSharing(sharing: TopicSharing) {
    this.modalController.dismiss({
      action: 'remove',
      userId: sharing.userId
    });
  }
}