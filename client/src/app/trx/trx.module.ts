import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrxPage } from './trx.page';
import { ReversePipe } from '../util/reverse.pipe';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: TrxPage }])
  ],
  declarations: [
    TrxPage,
    ReversePipe
  ]
})
export class TrxPageModule {}
