import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export class Message {
  event: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  constructor(private db: AngularFirestore) { }

  messaging(): Observable<Message> {
    const value = this.db.collection('messages').doc<Message>('1').valueChanges();
    console.log(value);
    return value;
  }

  send(event: string, message: string) {
    this.db.collection('messages').doc('1').update({
      event,
      message
    });
  }

}
