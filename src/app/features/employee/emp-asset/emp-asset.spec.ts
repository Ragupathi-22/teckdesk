import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpAsset } from './emp-asset';

describe('EmpAsset', () => {
  let component: EmpAsset;
  let fixture: ComponentFixture<EmpAsset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpAsset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpAsset);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
