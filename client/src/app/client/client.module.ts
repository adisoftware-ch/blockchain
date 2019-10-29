import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientPage } from './client.page';
import { ClientService } from './client.service';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ClientPage }])
  ],
  declarations: [ClientPage],
  providers: [ClientService]
})
export class ClientPageModule {}
