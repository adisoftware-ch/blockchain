import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NodePage } from './node.page';

describe('NodePage', () => {
  let component: NodePage;
  let fixture: ComponentFixture<NodePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NodePage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
