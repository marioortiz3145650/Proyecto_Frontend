import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Muertes } from './muertes';

describe('Muertes', () => {
  let component: Muertes;
  let fixture: ComponentFixture<Muertes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Muertes],
    }).compileComponents();

    fixture = TestBed.createComponent(Muertes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
