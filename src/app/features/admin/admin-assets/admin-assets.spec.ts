import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAssets } from './admin-assets';

describe('AdminAssets', () => {
  let component: AdminAssets;
  let fixture: ComponentFixture<AdminAssets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAssets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAssets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
