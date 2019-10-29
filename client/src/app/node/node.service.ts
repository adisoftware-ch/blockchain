import { Injectable } from '@angular/core';
import { verifySignature, stringToBytes, bytesToString } from '@waves/ts-lib-crypto'

import * as io from 'socket.io-client';

import * as sha256 from 'fast-sha256';

import { Observable, of } from 'rxjs';
import { Transaction } from '../client/client.service';
import { makeBindingParser } from '@angular/compiler';

export class Chain {
  node: string;
  chain: Block[];
}

export class Block {
  blockNumber: number;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  previousHash: string;
}

export class Blockchain {

  transactions: Transaction[];

  chain: Block[];

  nodes: Set<any>;

  nodeID: string;

  constructor() {
    // start new Blockchain
    this.chain = new Array<Block>();
    this.transactions = new Array<Transaction>();
    this.nodeID = 'BCHAIN' + new Date().getTime();
    // create genesis block
    this.createBlock(0, '00');
  }

  /**
   * Add a new node to the list of nodes
   */
  registerNode() {

  }

  /**
   * Check that the provided signature corresponds to the transaction
   * by public key
   */
  verifyTransactionSignature(transaction: Transaction): boolean {
    return verifySignature(
      transaction.transaction.senderPublicKey, stringToBytes(JSON.stringify(transaction.transaction)), transaction.signature);
  }

  /**
   * Add a transaction to the transactions array, if the signature verified
   */
  submitTransaction(transaction: Transaction): boolean {
    if (this.verifyTransactionSignature(transaction)) {
      this.transactions.push(transaction);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Add a block of transactions to the blockchain
   */
  createBlock(nonce: number, previousHash: string): Block {


    const block: Block = {
      blockNumber: this.chain.length + 1,
      timestamp: new Date().getTime(),
      transactions: this.transactions.splice(0, this.transactions.length),
      nonce,
      previousHash
    };

    this.chain.push(block);

    return block;
  }

  /**
   * Validate and add a block mined by another node to our chain.
   */
  addBlock(block: Block, miner: string) {
    console.log(`received new block from ${miner}`);
    if (miner !== this.nodeID) {
      this.chain.push(block);
      if (!this.verifyChain(this.chain)) {
        console.log(`block received from ${miner} is invalid - removing!`);
        this.chain.pop();
      } else {
        this.transactions.splice(0, this.transactions.length);
      }
    }
  }

  /**
   * Create a SHA-256 hash of a block
   */
  hash(block: Block): string {
    return this.toHexString(sha256.hash(stringToBytes(JSON.stringify(block))));
  }

  /**
   * Proof of work algorithm
   */
  proofOfWork(): number {
    const lastBlock: Block = this.chain[this.chain.length - 1];
    const lastHash: string = this.hash(lastBlock);

    let nonce = 0;
    while (!this.verifyProof(this.transactions, lastHash, nonce)) {
      if (nonce % 10 === 0) {
        console.log('mining! current nonce: ' + nonce);
      }
      nonce++;
    }

    return nonce;
  }

  /**
   * Check, if a hash value satisfies the mining conditions
   */
  verifyProof(transactions: Transaction[], lastHash: string, nonce: number): boolean {
    const guess: string = JSON.stringify(transactions) + lastHash + nonce;
    const guessHash: string = this.toHexString(sha256.hash(stringToBytes(guess)));

    console.log(guessHash);

    if (guessHash && guessHash.length >= 3) {
      return guessHash.substring(0, 3) === '000';
    } else {
      return false;
    }
  }

  /**
   * Check, if a blockchain is valid
   */
  verifyChain(chain: Block[]) {
    if (chain.length > 2) {
      let lastBlock = chain[1];
      for (let i = 2; i < chain.length; i++) {
        const block = chain[i];
        const hash = this.hash(lastBlock);

        // First, check if last block's hash corresponds to our current blocks parameter
        if (block.previousHash !== hash) {
          console.log(`verifyChain: block ${i}: hash do not match - invalid! block.previousHash: ${block.previousHash} <> ${hash}`);
          return false;
        }

        // Second, check proof of work for current block
        const transactions = block.transactions;
        if (!this.verifyProof(transactions, block.previousHash, block.nonce)) {
          console.log(`verifyChain: block ${i}: no proof of work - invalid!`);
          return false;
        }

        lastBlock = block;
      }
    }

    // if we arrive here, our chain is valid !
    return true;
  }

  /**
   * Resolve conflicts between blockchain's nodes by replacing
   * our chain with the longest valid in the network.
   * Clears all open transactions and returns true, if our chain was replaced.
   */
  resolveConflicts(chain: Chain): boolean {
    console.log('resolving conflicts:', chain)
    if (chain.node !== this.nodeID && chain.chain.length > this.chain.length && this.verifyChain(chain.chain)) {
      this.chain.splice(0, this.chain.length);
      chain.chain.forEach(block => {
        this.chain.push(block);
      });
      this.transactions.splice(0, this.transactions.length);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Helper method that transforms an Uint8Array to a Hex-String.
   * Used to stringify hash values.
   */
  private toHexString(byteArray: Uint8Array): string {
    return Array.prototype.map.call(byteArray, (byte: any) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }

}

@Injectable({
  providedIn: 'root'
})
export class NodeService {

  private socket: SocketIOClient.Socket;

  private blockchain: Blockchain;

  private trxObservable: Observable<Transaction[]>;
  private chainObservable: Observable<Block[]>;

  private trxlog: Array<string>;
  private trxlogObservable: Observable<string[]>;

  constructor() {
    this.blockchain = new Blockchain();

    this.trxObservable = of(this.blockchain.transactions);
    this.chainObservable = of(this.blockchain.chain);

    this.trxlog = new Array<string>();
    this.trxlogObservable = of(this.trxlog);

    this.socket = io.connect('ws://localhost:3000');
    this.listen();
  }

  start() {
    console.log(`NodeService initialized: ${this.blockchain.nodeID}`);
  }

  private listen() {

    /**
     * New transaction request; add to blockchains transaction array
     */
    this.socket.on('trx', (strx: string) => {
      console.log(`NodeService: receiving transaction: ${strx}`);
      this.trxlog.push(strx);

      const trx: Transaction = JSON.parse(strx);
      if (this.blockchain.submitTransaction(trx)) {
        this.socket.emit('response', JSON.stringify({
          message: 'Transaction will be added to Block No. ' + (this.blockchain.chain.length + 1)
        }));
      } else {
        this.socket.emit('response', JSON.stringify({
          message: 'Invalid transaction!'
        }));
      }
    });

    this.socket.on('request-chain', () => {
      this.socket.emit('chain', JSON.stringify({
        node: this.blockchain.nodeID,
        chain: this.blockchain.chain
      }));
    });

    /**
     * Received current chain from other node; check for consensus
     */
    this.socket.on('chain', (schain: string) => {
      console.log(`NodeService: receiving chain: ${schain}`);
      this.trxlog.push(schain);
      const chain = JSON.parse(schain);

      if (this.blockchain.resolveConflicts(chain)) {
        this.socket.emit('response', JSON.stringify({
          message: 'Our chain was replaced',
          node: this.blockchain.nodeID
        }));
      } else {
        this.socket.emit('response', JSON.stringify({
          message: 'Our chain is authoritative',
          node: this.blockchain.nodeID
        }));
      }
    });

    /**
     * Response from node; log and ignore
     */
    this.socket.on('response', (sresp: string) => {
      console.log(`NodeService: receiving response message: ${sresp}`);
      // this.trxlog.push(sresp);
    });

    /**
     * Commit message from another miner; put block to chain
     */
    this.socket.on('commit', (scommit: string) => {
      console.log(`NodeService: receiving commit message: ${scommit}`);
      this.trxlog.push(scommit);

      const commitMsg = JSON.parse(scommit);
      this.blockchain.addBlock(commitMsg.block, commitMsg.node);
    });

  }

  /**
   * Return the Observable pointing to the list of transactions ready to be added to the next block
   */
  getTransactions(): Observable<Transaction[]> {
    return this.trxObservable;
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
  mine() {
    const lastBlock = this.blockchain.chain[this.blockchain.chain.length - 1];
    const nonce = this.blockchain.proofOfWork();

    const previousHash = this.blockchain.hash(lastBlock);
    const block = this.blockchain.createBlock(nonce, previousHash);

    this.socket.emit('commit', JSON.stringify({
      message: 'New Block forged',
      node: this.blockchain.nodeID,
      block
    }));
  }

  consensus() {
    this.socket.emit('request-chains');
  }

  /**
   * Access the Observable with the transaction log
   */
  getTrxLog(): Observable<string[]> {
    return this.trxlogObservable;
  }

}
