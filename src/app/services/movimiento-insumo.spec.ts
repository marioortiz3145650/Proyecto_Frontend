import { TestBed } from '@angular/core/testing';

import { MovimientoInsumoService } from './movimiento-insumo';

describe('MovimientoInsumoService', () => {
  let service: MovimientoInsumoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovimientoInsumoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
