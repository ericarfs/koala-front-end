import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceControl } from './device-control';

describe('DeviceControl', () => {
  let component: DeviceControl;
  let fixture: ComponentFixture<DeviceControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceControl],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceControl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
