import { TestBed } from '@angular/core/testing';

import { MuerteService } from './muerte';

describe('MuerteService', () => {
  let service: MuerteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MuerteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
