import { TestBed } from '@angular/core/testing';

import { Estado } from './estado';

describe('Estado', () => {
  let service: Estado;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Estado);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
