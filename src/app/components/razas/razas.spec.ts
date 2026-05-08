import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Razas } from './razas';

describe('Razas', () => {
  let component: Razas;
  let fixture: ComponentFixture<Razas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Razas],
    }).compileComponents();

    fixture = TestBed.createComponent(Razas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
