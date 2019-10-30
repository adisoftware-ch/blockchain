import { Injectable } from '@angular/core';
import { signBytes, stringToBytes, randomSeed, privateKey, publicKey } from '@waves/ts-lib-crypto';

// npm i socket.io-client
// npm i @types/socket.io-client
// npm install fast-sha256

import * as io from 'socket.io-client';
import { Observable, of } from 'rxjs';

export class Wallet {
  privateKey: string;
  publicKey: string;
  walletaddress: string;
}

export class Transaction {
  transaction: {
    id: string;
    senderAdress: string;
    senderPublicKey: string;
    recipientAddress: string;
    amount: number;
  };
  signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private socket: SocketIOClient.Socket;

  wallet: Wallet;

  wallets: string[];
  walletsObservable: Observable<string[]>;

  constructor() {
    this.wallets = new Array<string>();
    this.walletsObservable = of(this.wallets);

    this.socket = io.connect('ws://localhost:3000');
    this.listen();
  }

  /**
   * Initialize the client. Called on startup of the app.
   */
  start() {
    this.generateWallet();
    console.log(`ClientService initialized: ${this.wallet.walletaddress}`);
  }

  private listen() {
    this.socket.on('wallets', (swallets: string) => {
      console.log(`receiving new wallet adresses: ${swallets}`);

      const tmpWallets: Array<string> = JSON.parse(swallets);
      this.wallets.splice(0, this.wallets.length);
      tmpWallets.forEach(wallet => {
        if (wallet !== this.wallet.walletaddress) {
          this.wallets.push(wallet);
        }
      });
    });
  }

  getWallets(): Observable<string[]> {
    return this.walletsObservable;
  }

  generateWallet(): Wallet {
    if (!this.wallet) {
      const seed = randomSeed();

      this.wallet = new Wallet();

      this.wallet.privateKey = privateKey(seed);
      this.wallet.publicKey = publicKey(seed);
      this.wallet.walletaddress = 'WA' + new Date().getTime();

      this.socket.emit('wallet', this.wallet.walletaddress);
    }

    return this.wallet;
  }

  async generateTrx(senderWallet: Wallet, recipientAddress: string, amount: number): Promise<string> {
    const trxContent = {
      id: 'TRX' + new Date().getTime(),
      senderAdress: senderWallet.walletaddress,
      senderPublicKey: senderWallet.publicKey,
      recipientAddress,
      amount
    };

    const trx: Transaction = {
      transaction: trxContent,
      signature: signBytes({privateKey: senderWallet.privateKey}, stringToBytes(JSON.stringify(trxContent)))
    };

    const msg = JSON.stringify(trx);

    console.log(`ClientService.generateTrx(..): sending trx:  ${msg}`);
    this.socket.emit('trx', msg);

    return new Promise((resolve) => {
      resolve(trx.transaction.id);
    });
  }

}
