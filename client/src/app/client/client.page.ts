import { Component, OnInit } from '@angular/core';
import { ClientService, Wallet } from './client.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { NodeService } from '../node/node.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-client',
  templateUrl: 'client.page.html',
  styleUrls: ['client.page.scss']
})
export class ClientPage implements OnInit {

  wallet: Wallet;

  balance = 100;
  balanceSubject = new BehaviorSubject<number>(this.balance);

  recipientAddress: string;

  recipientAddresses: Observable<string[]>;

  amountToSend: number;

  constructor(private clientService: ClientService, private nodeService: NodeService, private alertController: AlertController) {}

  ngOnInit() {
    // generate client's wallet
    this.wallet = this.clientService.generateWallet();

    // initialize Observable pointing to all available recipient-adresses
    this.recipientAddresses = this.clientService.getWallets();

    this.nodeService.getFullChain().subscribe(obs => obs.forEach(block => {
      console.log('huhu');
      if (block.transactions) {
        block.transactions.forEach(trx => {
          if (trx.transaction.recipientAddress === this.wallet.walletaddress) {
            this.balance += trx.transaction.amount;
          }
          if (trx.transaction.senderAdress === this.wallet.walletaddress) {
            this.balance -= trx.transaction.amount;
          }
        });
        this.balanceSubject.next(this.balance);
      }
    }));
  }

  sendMoney() {
    if (this.recipientAddress && this.recipientAddress.trim().length > 0 && this.amountToSend && this.amountToSend > 0) {
      this.clientService.generateTrx(this.wallet, this.recipientAddress, this.amountToSend).then(trx => {
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
