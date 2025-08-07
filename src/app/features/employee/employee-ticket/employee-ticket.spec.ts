import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeTicket } from './employee-ticket';

describe('EmployeeTicket', () => {
  let component: EmployeeTicket;
  let fixture: ComponentFixture<EmployeeTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeTicket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeTicket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
