import { Injectable } from '@angular/core';
import { signBytes, stringToBytes, randomSeed, privateKey, publicKey } from '@waves/ts-lib-crypto';

// npm i socket.io-client
// npm i @types/socket.io-client
// npm install fast-sha256

import { Observable, of } from 'rxjs';
import { SocketUtil } from '../util/socket.util';
import { environment } from 'src/environments/environment';

export class Wallet {
  publicKey: string;
  walletaddress: string;
  balance: number;
  age: number;
}

export class WalletState {
  age: number;
  wallet: Wallet;
  signature: string;
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

  private privateKey: string;

  wallet: Wallet;
  walletObservable: Observable<Wallet>;

  wallets: string[];
  walletsObservable: Observable<string[]>;

  constructor() {
    this.wallets = new Array<string>();
    this.walletsObservable = of(this.wallets);

    this.socket = SocketUtil.connect(environment);
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
    this.socket.on('commit', (scommit: string) => {
      console.log(`receiving new committed block: ${scommit}`);

      const commitMsg = JSON.parse(scommit);

      this.wallets.splice(0, this.wallets.length);
      commitMsg.block.states.forEach((state: WalletState) => {
        const wallet = state.wallet.walletaddress;
        if (wallet !== this.wallet.walletaddress) {
          this.wallets.push(wallet);
        } else {
          this.wallet.age = state.age;
          this.wallet.balance = state.wallet.balance;
        }
      });
    });
  }

  getWallets(): Observable<string[]> {
    return this.walletsObservable;
  }

  getWallet(): Observable<Wallet> {
    return this.walletObservable;
  }

  private generateWallet() {
    if (!this.wallet) {
      const seed = randomSeed();

      this.wallet = new Wallet();

      // !! NEVER PUSH PRIVATE KEY TO THE CHAIN !!
      this.privateKey = privateKey(seed);

      this.wallet.publicKey = publicKey(seed);
      this.wallet.walletaddress = 'WA' + new Date().getTime();
      this.wallet.balance = 100;
      this.wallet.age = 0;

      this.walletObservable = of(this.wallet);

      const walletState: WalletState = {
        wallet: this.wallet,
        signature: signBytes({privateKey: this.privateKey}, stringToBytes(JSON.stringify(this.wallet))),
        age: 0
      };

      this.socket.emit('wallet', JSON.stringify(walletState));
    }
  }

  async generateTrx(recipientAddress: string, amount: number): Promise<string> {
    const trxContent = {
      id: 'TRX' + new Date().getTime(),
      senderAdress: this.wallet.walletaddress,
      senderPublicKey: this.wallet.publicKey,
      recipientAddress,
      amount
    };

    const trx: Transaction = {
      transaction: trxContent,
      signature: signBytes({privateKey: this.privateKey}, stringToBytes(JSON.stringify(trxContent)))
    };

    const msg = JSON.stringify(trx);

    console.log(`ClientService.generateTrx(..): sending trx:  ${msg}`);
    this.socket.emit('trx', msg);

    return new Promise((resolve) => {
      resolve(trx.transaction.id);
    });
  }

}
