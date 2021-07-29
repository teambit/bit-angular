import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BitTestComponent } from './bit-test.component';
import { BitTestService } from './bit-test.service';

describe('BitTestComponent', () => {
  let component: BitTestComponent;
  let fixture: ComponentFixture<BitTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ BitTestService ],
      declarations: [ BitTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BitTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a service', () => {
    expect(component.service).toBeDefined();
    expect(component.service.content).toEqual('Content from service');
  })
});
