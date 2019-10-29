import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../home/home.module').then(m => m.HomePageModule)
          }
        ]
      },
      {
        path: 'client',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../client/client.module').then(m => m.ClientPageModule)
          }
        ]
      },
      {
        path: 'node',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../node/node.module').then(m => m.NodePageModule)
          }
        ]
      },
      {
        path: 'trx',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../trx/trx.module').then(m => m.TrxPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
