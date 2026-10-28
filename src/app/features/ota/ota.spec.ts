import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ota } from './ota';

describe('Ota', () => {
  let component: Ota;
  let fixture: ComponentFixture<Ota>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ota],
    }).compileComponents();

    fixture = TestBed.createComponent(Ota);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
