import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Galpones } from './galpones';

describe('Galpones', () => {
  let component: Galpones;
  let fixture: ComponentFixture<Galpones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Galpones],
    }).compileComponents();

    fixture = TestBed.createComponent(Galpones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
