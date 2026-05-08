import { TestBed } from '@angular/core/testing';

import { Produccion } from './produccion';

describe('Produccion', () => {
  let service: Produccion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Produccion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
