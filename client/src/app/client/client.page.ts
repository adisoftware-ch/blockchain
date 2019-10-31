import { Component, OnInit } from '@angular/core';
import { ClientService, Wallet } from './client.service';
import { Observable } from 'rxjs';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-client',
  templateUrl: 'client.page.html',
  styleUrls: ['client.page.scss']
})
export class ClientPage implements OnInit {

  wallet: Observable<Wallet>;

  recipientAddress: string;

  recipientAddresses: Observable<string[]>;

  amountToSend: number;

  constructor(private clientService: ClientService, private alertController: AlertController) {}

  ngOnInit() {
    // access client's wallet
    this.wallet = this.clientService.getWallet();

    // initialize Observable pointing to all available recipient-adresses
    this.recipientAddresses = this.clientService.getWallets();
  }

  sendMoney() {
    if (this.recipientAddress && this.recipientAddress.trim().length > 0 && this.amountToSend && this.amountToSend > 0) {
      this.clientService.generateTrx(this.recipientAddress, this.amountToSend).then(trx => {
        this.alertController.create({
          header: trx,
          message: 'Transaction is ready for processing by any Blockchain Node',
          buttons: ['OK']
        }).then(async alert => {
          await alert.present();
        });

        this.recipientAddress = '';
        this.amountToSend = undefined;
      });
    }
  }

}
