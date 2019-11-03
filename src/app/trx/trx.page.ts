import { Component, OnInit } from '@angular/core';
import { NodeService } from '../node/node.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-trx',
  templateUrl: 'trx.page.html',
  styleUrls: ['trx.page.scss']
})
export class TrxPage implements OnInit {

  trxlog: Observable<any[]>;

  nodeID: string;

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.trxlog = this.nodeService.getTrxLog();
    this.nodeID = this.nodeService.getNodeID();
  }

}
