import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketTable } from './ticket-table';

describe('TicketTable', () => {
  let component: TicketTable;
  let fixture: ComponentFixture<TicketTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
