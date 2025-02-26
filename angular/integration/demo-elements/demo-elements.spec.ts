import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoElementsComponent } from './demo-elements.component';

describe('DemoElementsComponent', () => {
  let component: DemoElementsComponent;
  let fixture: ComponentFixture<DemoElementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DemoElementsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoElementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
