import { TestBed } from '@angular/core/testing';

import { Raza } from './raza';

describe('Raza', () => {
  let service: Raza;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Raza);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
