import { TestBed } from '@angular/core/testing';

import { TratamientoService } from './tratamiento';

describe('TratamientoService', () => {
  let service: TratamientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TratamientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
