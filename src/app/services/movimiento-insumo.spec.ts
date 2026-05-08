import { TestBed } from '@angular/core/testing';

import { MovimientoInsumo } from './movimiento-insumo';

describe('MovimientoInsumo', () => {
  let service: MovimientoInsumo;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovimientoInsumo);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
