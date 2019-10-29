import { Component, OnInit } from '@angular/core';
import { ClientService, Wallet } from './client.service';
import { Observable } from 'rxjs';
import { NodeService } from '../node/node.service';

@Component({
  selector: 'app-client',
  templateUrl: 'client.page.html',
  styleUrls: ['client.page.scss']
})
export class ClientPage implements OnInit {

  wallet: Wallet;

  recipientAddress: string;

  recipientAddresses: Observable<string[]>;

  amountToSend: number;

  constructor(private clientService: ClientService, private nodeService: NodeService) {}

  ngOnInit() {
    // generate client's wallet
    this.wallet = this.clientService.generateWallet();

    // initialize Observable pointing to all available recipient-adresses
    this.recipientAddresses = this.clientService.getWallets();
  }

  sendMoney() {
    this.clientService.generateTrx(this.wallet, this.recipientAddress, this.amountToSend);
  }

}
