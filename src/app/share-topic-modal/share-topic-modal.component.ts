import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { Topic, TopicSharing } from '../models/topic';
import { CommonModule } from '@angular/common';
import { IonInput, IonSelectOption, IonSelect, IonSpinner, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonButton, 
  IonNote, IonList, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { TopicService } from '../services/topic/topic.service';

@Component({
  selector: 'app-share-topic-modal',
  templateUrl: './share-topic-modal.component.html',
  styleUrls: ['./share-topic-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, 
    IonLabel ,IonButton, IonInput,
    IonNote, IonList, IonIcon, IonButtons, IonSpinner, IonSelectOption, IonSelect]
})
export class ShareTopicModalComponent implements OnInit {
  @Input() topic!: Topic;
  shareForm!: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  roles = [
    { value: 'reader', label: 'Reader' },
    { value: 'editor', label: 'Editor' }
  ];

  private modalController = inject(ModalController);
  private formBuilder = inject(FormBuilder);
  private topicService = inject(TopicService);

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

  async onSubmit() {
    if (this.shareForm.valid) {
      this.errorMessage = null;
      this.isSubmitting = true;
      
      try {
        await this.topicService.addUserToTopicSharing(
          this.topic.id,
          this.shareForm.value.username,
          this.shareForm.value.role
        );
        
        this.modalController.dismiss({
          username: this.shareForm.value.username,
          role: this.shareForm.value.role
        });
      } catch (error) {
        if (error instanceof Error) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = "Une erreur s'est produite";
        }
      } finally {
        this.isSubmitting = false;
      }
    }
  }
  
  removeSharing(sharing: TopicSharing) {
    this.modalController.dismiss({
      action: 'remove',
      userId: sharing.userId
    });
  }
}