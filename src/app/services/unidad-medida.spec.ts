import { TestBed } from '@angular/core/testing';

import { UnidadMedida } from './unidad-medida';

describe('UnidadMedida', () => {
  let service: UnidadMedida;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnidadMedida);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
