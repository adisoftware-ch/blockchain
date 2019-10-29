import { Component, OnInit } from '@angular/core';
import { NodeService, Block } from './node.service';
import { Observable } from 'rxjs';
import { Transaction } from '../client/client.service';

@Component({
  selector: 'app-node',
  templateUrl: 'node.page.html',
  styleUrls: ['node.page.scss']
})
export class NodePage implements OnInit {

  fullChain: Observable<Block[]>;
  openTransactions: Observable<Transaction[]>;
  nodeID: string;

  constructor(private nodeService: NodeService) { }

  ngOnInit() {
    // wait 500ms for consensus between nodes
    setTimeout(() => {
      this.nodeService.consensus();
    }, 500);

    this.fullChain = this.nodeService.getFullChain();
    this.openTransactions = this.nodeService.getTransactions();
    this.nodeID = this.nodeService.getNodeID();
  }

  mine() {
    this.nodeService.mine();
  }

  consensus() {
    this.nodeService.consensus();
  }

}
