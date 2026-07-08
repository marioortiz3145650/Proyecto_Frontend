import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-wrapper">
      <div class="pagination-controls">
        <button
          type="button"
          class="btn page-btn"
          [disabled]="currentPage <= 1"
          (click)="go(currentPage - 1)"
          aria-label="Página anterior"
        >
          <i class="pi pi-angle-left"></i>
        </button>

        <button
          type="button"
          *ngFor="let p of visiblePages"
          class="btn page-btn"
          [class.active]="p === currentPage"
          (click)="go(p)"
        >
          {{ p }}
        </button>

        <button
          type="button"
          class="btn page-btn"
          [disabled]="currentPage >= totalPages"
          (click)="go(currentPage + 1)"
          aria-label="Página siguiente"
        >
          <i class="pi pi-angle-right"></i>
        </button>
      </div>

      <select
        *ngIf="showLimit"
        class="limit-select"
        [value]="limit"
        (change)="onLimitChange($event)"
        aria-label="Items por página"
      >
        <option *ngFor="let opt of limitOptions" [ngValue]="opt">{{ opt }}</option>
      </select>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pagination-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
    }
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .page-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid #d9dee3;
      background: #fff;
      color: #495057;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      transition: all .15s ease;
      padding: 0;
    }
    .page-btn:hover:not(:disabled) {
      border-color: #198754;
      color: #198754;
    }
    .page-btn.active {
      background: #198754;
      border-color: #198754;
      color: #fff;
      font-weight: 600;
    }
    .page-btn:disabled {
      opacity: .4;
      cursor: not-allowed;
    }
    .limit-select {
      position: absolute;
      right: 0;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #d9dee3;
      background: #fff;
      color: #495057;
      font-size: 14px;
      cursor: pointer;
    }
    .limit-select:focus {
      outline: none;
      border-color: #198754;
    }
  `]
})
export class PaginationComponent {
  @Input() totalPages = 1;
  @Input() currentPage = 1;
  @Input() limit = 5;
  @Input() showLimit = false;
  @Input() limitOptions: number[] = [5, 10, 25];

  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const totalPages = Math.max(1, this.totalPages);
    const currentPage = this.currentPage;
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }

  onLimitChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(value);
  }
}