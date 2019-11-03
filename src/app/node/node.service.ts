import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { Transaction, WalletState } from '../client/client.service';
import { Blockchain, Block } from './blockchain.class';
import { MessagingService, Message } from '../util/messaging.service';

@Injectable({
  providedIn: 'root'
})
export class NodeService {

  private messaging: Observable<Message>;

  private blockchain: Blockchain;

  private trxObservable: Observable<Transaction[]>;
  private stateObservable: Observable<WalletState[]>;
  private chainObservable: Observable<Block[]>;

  private trxlog: Array<any>;
  private trxlogObservable: Observable<any[]>;

  constructor(private messagingService: MessagingService) {
    this.blockchain = new Blockchain();

    this.trxObservable = of(this.blockchain.transactions);
    this.stateObservable = of(this.blockchain.states);
    this.chainObservable = of(this.blockchain.chain);

    this.trxlog = new Array<any>();
    this.trxlogObservable = of(this.trxlog);
  }

  /**
   * Initialize the node. Called on startup of the app.
   */
  start() {
    this.messaging = this.messagingService.messaging();
    console.log(`NodeService initialized: ${this.blockchain.nodeID}`);

    this.listen();
    // this.consensus();
  }

  private listen() {

    this.messaging.subscribe(message => {

      /**
       * New wallet request; add to blockchains state array
       */
      if (message.event === 'wallet') {
        console.log(`NodeService: receiving new wallet: ${message.message}`);

        const wallet: WalletState = JSON.parse(message.message);
        this.trxlog.push(wallet);

        if (this.blockchain.submitState(wallet)) {
          this.messagingService.send('response', JSON.stringify({
            message: 'Wallet-State will be added to Block No. ' + (this.blockchain.chain.length + 1)
          }));
        } else {
          this.messagingService.send('response', JSON.stringify({
            message: 'Invalid wallet state!'
          }));
        }
      }

      /**
       * New transaction request; add to blockchains transaction array
       */
      if (message.event === 'trx') {
        console.log(`NodeService: receiving transaction: ${message.message}`);

        const trx: Transaction = JSON.parse(message.message);
        this.trxlog.push(trx);

        if (this.blockchain.submitTransaction(trx)) {
          this.messagingService.send('response', JSON.stringify({
            message: 'Transaction will be added to Block No. ' + (this.blockchain.chain.length + 1)
          }));
        } else {
          this.messagingService.send('response', JSON.stringify({
            message: 'Invalid transaction!'
          }));
        }
      }

      /**
       * Received chain-request from other nodes consensus algorithm.
       * Send our ID and chain for comparision.
       */
      if (message.event === 'request-chain') {
        // if it wasn't our own request
        if (message.message !== this.blockchain.nodeID) {
          const msg = {
            node: this.blockchain.nodeID,
            chain: this.blockchain.chain
          };
          this.trxlog.push(msg);
          this.messagingService.send('chain', JSON.stringify(msg));
        }
      }

      /**
       * Received current chain from other node; check for consensus
       */
      if (message.event === 'chain') {
        console.log(`NodeService: receiving chain: ${message.message}`);

        const chain = JSON.parse(message.message);
        this.trxlog.push(chain);

        if (this.blockchain.resolveConflicts(chain)) {
          this.messagingService.send('response', JSON.stringify({
            message: 'Our chain was replaced',
            node: this.blockchain.nodeID
          }));
        } else {
          this.messagingService.send('response', JSON.stringify({
            message: 'Our chain is authoritative',
            node: this.blockchain.nodeID
          }));
        }
      }

      /**
       * Response from node; log and ignore
       */
      if (message.event === 'response') {
        console.log(`NodeService: receiving response message: ${message.message}`);
      }

      /**
       * Commit message from another miner; put block to chain
       */
      if (message.event === 'commit') {
        console.log(`NodeService: receiving commit message: ${message.message}`);

        const commitMsg = JSON.parse(message.message);
        this.trxlog.push(commitMsg);

        this.blockchain.addBlock(commitMsg.block, commitMsg.node);
      }

    });

  }

  /**
   * Return the Observable pointing to the list of transactions ready to be added to the next block
   */
  getTransactions(): Observable<Transaction[]> {
    return this.trxObservable;
  }

  /**
   * Return the Observable pointing to the list of states ready to be added to the next block
   */
  getStates(): Observable<WalletState[]> {
    return this.stateObservable;
  }

  /**
   * Return the Observable pointing to the current Blockchain
   */
  getFullChain(): Observable<Block[]> {
    return this.chainObservable;
  }

  /**
   * Returns the ID of this node
   */
  getNodeID() {
    return this.blockchain.nodeID;
  }

  /**
   * Mine the next block. Send commit message to all nodes, if successful.
   */
  async mine(): Promise<Block> {
    let block: Block;

    if (this.blockchain.transactions.length > 0 || this.blockchain.states.length > 0) {
      const lastBlock = this.blockchain.chain[this.blockchain.chain.length - 1];
      const nonce = this.blockchain.proofOfWork();

      const previousHash = this.blockchain.hash(lastBlock);
      block = this.blockchain.createBlock(nonce, previousHash);

      console.log(lastBlock);

      const msg = {
        message: 'New Block forged',
        node: this.blockchain.nodeID,
        block
      };
      this.trxlog.push(msg);
      this.messagingService.send('commit', JSON.stringify(msg));
    }

    return new Promise((resolve, reject) => {
      if (block) {
        resolve(block);
      } else {
        reject('No block could be mined. Are there transactions ready?');
      }
    });
  }

  consensus() {
    this.trxlog.push({requestchains: true});
    this.messagingService.send('request-chain', this.blockchain.nodeID);
  }

  /**
   * Access the Observable with the transaction log
   */
  getTrxLog(): Observable<any[]> {
    return this.trxlogObservable;
  }

}
