import { TestBed } from '@angular/core/testing';

import { Galpon } from './galpon';

describe('Galpon', () => {
  let service: Galpon;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Galpon);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
