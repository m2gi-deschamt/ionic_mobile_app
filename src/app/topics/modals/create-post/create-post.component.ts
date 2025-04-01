import { Component, inject, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonHeader, IonToolbar, IonContent, IonButton, IonTitle, IonButtons, IonInput, IonImg } from '@ionic/angular/standalone';
import { TopicService } from 'src/app/services/topic/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { Post } from 'src/app/models/post';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, filter, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-create-post',
  imports: [IonHeader, IonToolbar, IonContent, IonButton, 
    ReactiveFormsModule, IonButtons, IonInput, IonImg, CommonModule, IonTitle],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
})
export class CreatePostModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly DESCRIPTION_MAX_LENGTH = 255;
  readonly NAME_MIN_LENGTH = 3;

  @Input() topicId!: string;
  @Input() post?: Post;
  @Input() viewOnly: boolean = false;

  capturedPhoto: string | null | undefined;

  ngOnInit(): void {
    if (this.post) {
      this.postNameControl?.setValue(this.post.name);
      this.postDescriptionControl?.setValue(this.post.description ?? '');
      this.capturedPhoto = this.post.photoUrl;
    }
  }

  postForm = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
    description: ['', [Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]],
  });

  nameErrorText$: Observable<string> = this.postForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.postNameControl?.errors &&
        this.postNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.postNameControl?.errors &&
        this.postNameControl?.errors['minlength']
      ) {
        return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      return '';
    })
  );

  nameErrorText = toSignal(this.nameErrorText$);
  descriptionErrorText = `Description should have less than ${this.DESCRIPTION_MAX_LENGTH} characters`;

  get postNameControl(): AbstractControl<string | null, string | null> | null {
    return this.postForm.get('name');
  }

  get postDescriptionControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.postForm.get('description');
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 75, // Reduced quality
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024, // Set maximum width
        height: 1024 // Set maximum height (maintains aspect ratio)
      });
      
      // Further compress if needed
      this.capturedPhoto = await this.compressImage(image.dataUrl);
    } catch (error) {
      console.error('Error taking photo', error);
    }
  }

  async compressImage(dataUrl: string | undefined): Promise<string | undefined> {
    if (!dataUrl) return undefined;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Adjust compression level with quality parameter (0.6 = 60% quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedDataUrl);
      };
      
      img.src = dataUrl;
    });
  }

  onSubmit(): void {
    if (this.post?.id) {
      this.topicService.editPost(this.topicId, {
        ...this.post,
        name: this.postForm.value.name!,
        description: this.postForm.value.description!,
        photoUrl: this.capturedPhoto
      });
    } else {
      this.topicService.addPost(this.topicId, {
        name: this.postForm.value.name!,
        description: this.postForm.value.description!,
        photoUrl: this.capturedPhoto
      });
    }
  
    this.modalCtrl.dismiss();
  }
  
}
