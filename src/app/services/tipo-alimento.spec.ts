import { TestBed } from '@angular/core/testing';

import { TipoAlimento } from './tipo-alimento';

describe('TipoAlimento', () => {
  let service: TipoAlimento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoAlimento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
