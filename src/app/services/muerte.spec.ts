import { TestBed } from '@angular/core/testing';

import { Muerte } from './muerte';

describe('Muerte', () => {
  let service: Muerte;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Muerte);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
