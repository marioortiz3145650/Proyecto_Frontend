import { TestBed } from '@angular/core/testing';

import { Tratamiento } from './tratamiento';

describe('Tratamiento', () => {
  let service: Tratamiento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tratamiento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
