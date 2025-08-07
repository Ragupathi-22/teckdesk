import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaiseTicketForm } from './raise-ticket-form';

describe('RaiseTicketForm', () => {
  let component: RaiseTicketForm;
  let fixture: ComponentFixture<RaiseTicketForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaiseTicketForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaiseTicketForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
