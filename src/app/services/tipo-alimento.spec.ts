import { TestBed } from '@angular/core/testing';

import { TipoAlimentoService } from './tipo-alimento';

describe('TipoAlimentoService', () => {
  let service: TipoAlimentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoAlimentoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
