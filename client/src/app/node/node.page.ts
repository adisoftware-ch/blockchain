import { Component, OnInit } from '@angular/core';
import { NodeService, Block } from './node.service';
import { Observable } from 'rxjs';
import { Transaction } from '../client/client.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-node',
  templateUrl: 'node.page.html',
  styleUrls: ['node.page.scss']
})
export class NodePage implements OnInit {

  fullChain: Observable<Block[]>;
  openTransactions: Observable<Transaction[]>;
  nodeID: string;

  constructor(private nodeService: NodeService, private alertController: AlertController, private loadingController: LoadingController) {}

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
    this.loadingController.create({
      message: 'mining - please wait ...'
    }).then(loading => {
      loading.present().then(() => {
        this.nodeService.mine().then(block => {
          this.alertController.create({
            header: 'New block #' + block.blockNumber,
            message: 'New block mined with nonce = ' + block.nonce,
            buttons: ['OK']
          }).then(async alert => {
            loading.dismiss();
            await alert.present();
          });
        }, reject => {
          this.alertController.create({
            header: 'Mining not possible',
            message: reject,
            buttons: ['OK']
          }).then(async alert => {
            loading.dismiss();
            await alert.present();
          });
        });
      });
    });
  }

  consensus() {
    this.nodeService.consensus();
  }

}
