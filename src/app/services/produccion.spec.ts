import { TestBed } from '@angular/core/testing';

import { ProduccionService } from './produccion';

describe('ProduccionService', () => {
  let service: ProduccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProduccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
