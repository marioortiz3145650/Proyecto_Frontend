import { TestBed } from '@angular/core/testing';

import { Alimento } from './alimento';

describe('Alimento', () => {
  let service: Alimento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Alimento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
