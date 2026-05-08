import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoAlimento } from './tipo-alimento';

describe('TipoAlimento', () => {
  let component: TipoAlimento;
  let fixture: ComponentFixture<TipoAlimento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoAlimento],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoAlimento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
