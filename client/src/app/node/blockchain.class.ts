import { verifySignature, stringToBytes } from '@waves/ts-lib-crypto';

import * as sha256 from 'fast-sha256';

import { Transaction, WalletState } from '../client/client.service';

export class Chain {
  node: string;
  chain: Block[];
}

export class Block {
  blockNumber: number;
  timestamp: number;
  transactions: Transaction[];
  states: WalletState[];
  nonce: number;
  previousHash: string;
}

export class Blockchain {

  transactions: Transaction[];

  states: WalletState[];

  chain: Block[];

  nodeID: string;

  nextStates: WalletState[];

  constructor() {
    // start new Blockchain
    this.chain = new Array<Block>();
    this.transactions = new Array<Transaction>();
    this.states = new Array<WalletState>();
    this.nodeID = 'BCHAIN' + new Date().getTime();
    // create genesis block
    this.createBlock(0, '00');
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
   * Check that the provided signature corresponds to the state
   * by public key
   */
  verifyStateSignature(state: WalletState): boolean {
    return verifySignature(
      state.wallet.publicKey, stringToBytes(JSON.stringify(state.wallet)), state.signature);
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
   * Add a wallet state to the state array, if the signature verified
   */
  submitState(state: WalletState): boolean {
    if (this.verifyStateSignature(state)) {
      this.states.push(state);
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
      transactions: Object.assign([], this.transactions), // provide a clone, not reference !
      states: Object.assign([], this.nextStates),
      nonce,
      previousHash
    };

    // append the new block to the Blockchain
    this.chain.push(block);

    // clean up list of open transactions and open blocks
    this.clearOpenTrx(block.transactions, block.states);

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
        this.clearOpenTrx(block.transactions, block.states);
      }
    }
  }

  /**
   * Removes transactions and states from the list of opens.
   * Used to clean up after adding a block mined by another node.
   */
  clearOpenTrx(transactions: Transaction[], states: WalletState[]) {
    if (transactions) {
      transactions.forEach(trx => {
        const index = this.transactions.findIndex(t => t.transaction.id === trx.transaction.id);
        if (index >= 0) {
          this.transactions.splice(index, 1);
        }
      });
    }

    if (states) {
      states.forEach(stat => {
        // states of age 1 have been newly added.
        // Note: after preparation procedures, the list 'this.states' contains the hole state of the BlockChain
        if (stat.age === 1) {
          const index = this.states.findIndex(s => s.wallet.walletaddress === stat.wallet.walletaddress);
          if (index >= 0) {
            this.states.splice(index, 1);
          }
        }
      });
    }
  }

  /**
   * Create a SHA-256 hash of a block
   */
  hash(block: Block): string {
    return this.toHexString(sha256.hash(stringToBytes(this.toHashString(block, null, null))));
  }

  /**
   * Proof of work algorithm
   */
  proofOfWork(): number {
    const lastBlock: Block = this.chain[this.chain.length - 1];
    const lastHash: string = this.hash(lastBlock);

    this.nextStates = this.transformStates(lastBlock.states);

    let nonce = 0;
    while (!this.verifyProof(this.transactions, this.nextStates, lastHash, nonce)) {
      if (nonce % 10 === 0) {
        console.log('mining! current nonce: ' + nonce);
      }
      nonce++;
    }

    return nonce;
  }

  /**
   * Transforms current state to the next state, depending on:
   * - Requests for new Wallets (=> new State Items)
   * - Transactions changing existing State Items (=> increase / decrease balance of existing Wallets)
   */
  private transformStates(lastStates: WalletState[]): WalletState[] {
    const nextStates = new Array<WalletState>();

    // prepare everyting in a new list to be included when creating the new block
    if (lastStates) {
      lastStates.forEach(state => {
        // deep copy the state object as it comes from the Block already in Chain
        // if we would change the original reference, the Chain would become invalid!
        const next = Object.assign({}, state);
        next.wallet = Object.assign({}, state.wallet);

        // increment age and add to temporary list
        next.age += 1;
        nextStates.push(next);
      });
    }

    // increment age of new Wallets and add them to our temporary list as well. They'll become active, as age changes from 0 to 1
    this.states.forEach(state => {
      state.age += 1;
      nextStates.push(state);
    });

    // increase / decrease balance of WalletState items depending on the open Transactions
    this.transactions.forEach(trx => {
      let index = nextStates.findIndex(state => state.wallet.walletaddress === trx.transaction.recipientAddress);
      if (index >= 0) {
        nextStates[index].wallet.balance += trx.transaction.amount;
      }
      index = nextStates.findIndex(state => state.wallet.walletaddress === trx.transaction.senderAdress);
      if (index >= 0) {
        nextStates[index].wallet.balance -= trx.transaction.amount;
      }
    });

    return nextStates;
  }

  /**
   * Check, if a hash value satisfies the mining conditions
   */
  verifyProof(transactions: Transaction[], states: WalletState[], lastHash: string, nonce: number): boolean {
    const guess: string = this.toHashString(null, transactions, null) + this.toHashString(null, null, states) + lastHash + nonce;
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
          console.log(lastBlock);
          return false;
        }

        // Second, check proof of work for current block
        if (!this.verifyProof(block.transactions, block.states, block.previousHash, block.nonce)) {
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
   * Clears all open transactions and states.
   * Returns true, if our chain was replaced.
   */
  resolveConflicts(chain: Chain): boolean {
    console.log('resolving conflicts:', chain);
    if (chain.node !== this.nodeID && chain.chain.length > this.chain.length && this.verifyChain(chain.chain)) {
      this.chain.splice(0, this.chain.length);
      chain.chain.forEach(block => {
        this.chain.push(block);
      });
      this.transactions.splice(0, this.transactions.length);
      this.states.splice(0, this.states.length);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Helper method that transforms a block or a list of transactions to its string representation
   * taking care of the order of objects parameters.
   */
  private toHashString(block: Block, transactions: Transaction[], states: WalletState[]): string {
    let result = '';
    const divider = '_';

    if (states) {
      const sorted = states.sort((a, b) => {
        if (a.wallet.walletaddress > b.wallet.walletaddress) {
          return 1;
        }
        if (a.wallet.walletaddress < b.wallet.walletaddress) {
          return -1;
        }
        return 0;
      });

      for (let i = 0; i < sorted.length; i++) {
        const wallet = sorted[i];
        result += wallet.signature + divider + wallet.wallet.balance
          + divider + wallet.wallet.publicKey + divider + wallet.wallet.walletaddress;
      }
    }

    if (block) {
      result += block.blockNumber + divider + block.nonce + divider + block.previousHash
        + divider + block.timestamp + divider + this.toHashString(null, block.transactions, null)
        + this.toHashString(null, null, block.states);
    }

    if (transactions) {
      const sorted = transactions.sort((a, b) => {
        if (a.transaction.id > b.transaction.id) {
          return 1;
        }
        if (a.transaction.id < b.transaction.id) {
          return -1;
        }
        return 0;
      });

      for (let i = 0; i < sorted.length; i++) {
        const trx = sorted[i];
        result += (i > 0 ? divider : '') + trx.signature + divider + trx.transaction.amount
          + divider + trx.transaction.id + divider + trx.transaction.recipientAddress
          + trx.transaction.senderAdress + divider + trx.transaction.senderPublicKey;
      }
    }

    return result;
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
