import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonHeader, IonToolbar, IonContent, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';

import { TopicService } from 'src/app/services/topic/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { Topic } from 'src/app/models/topic';
import { CommonModule } from '@angular/common';
import { Observable, filter, map } from 'rxjs';

@Component({
  selector: 'app-create-topic',
  imports: [IonHeader, IonToolbar, IonButtons, IonContent, IonButton, 
  ReactiveFormsModule, CommonModule, IonInput],
  templateUrl: './create-topic.component.html',
  styleUrls: ['./create-topic.component.scss'],
})
export class CreateTopicModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly NAME_MIN_LENGTH = 3;

  topic: Topic | undefined;

  ngOnInit(): void {
    if (this.topic) this.topicNameControl?.setValue(this.topic?.name);
  }

  topicForm = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
  });

  errorText$: Observable<string> = this.topicForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['minlength']
      ) {
        return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get topicNameControl(): AbstractControl<string | null, string | null> | null {
    return this.topicForm.get('name');
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  onSubmit(): void {
    if (this.topic?.id) {
      this.topicService.editTopic({
        ...this.topic,
        name: this.topicForm.value.name!,
      });
    } else {
      this.topicService.addTopic({
        name: this.topicForm.value.name!,
      });
    }

    this.modalCtrl.dismiss();
  }
}
