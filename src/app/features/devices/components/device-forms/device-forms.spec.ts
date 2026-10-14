import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceForms } from './device-forms';

describe('DeviceForms', () => {
  let component: DeviceForms;
  let fixture: ComponentFixture<DeviceForms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceForms],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceForms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
