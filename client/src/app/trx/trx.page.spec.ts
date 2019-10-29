import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TrxPage } from './trx.page';

describe('TrxPage', () => {
  let component: TrxPage;
  let fixture: ComponentFixture<TrxPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrxPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TrxPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
