import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientosInsumo } from './movimientos-insumo';

describe('MovimientosInsumo', () => {
  let component: MovimientosInsumo;
  let fixture: ComponentFixture<MovimientosInsumo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimientosInsumo],
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientosInsumo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
