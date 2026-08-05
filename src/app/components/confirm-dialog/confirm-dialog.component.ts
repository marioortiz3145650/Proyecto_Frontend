import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  entityName: string;
  title?: string;
  warning?: string;
  deleteLabel?: string;
  cancelLabel?: string;
  actionType?: 'danger' | 'primary';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="fen-confirm">
      <h2 class="fen-confirm__title">{{ data.title || ('¿Eliminar este ' + data.entityName + '?') }}</h2>
      <p class="fen-confirm__warning">
        {{ data.warning || 'Esta acción puede afectar a otros procesos o registros vinculados.' }}
      </p>
      <div class="fen-confirm__actions">
        <button type="button" class="fen-btn" [ngClass]="data.actionType === 'primary' ? 'fen-btn--primary' : 'fen-btn--danger'" (click)="confirm()">
          {{ data.deleteLabel || 'Eliminar' }}
        </button>
        <button type="button" class="fen-btn fen-btn--text" (click)="cancel()">
          {{ data.cancelLabel || 'Cancelar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .fen-confirm {
        background: #ffffff;
        border-radius: 8px;
        padding: 24px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
          0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12);
        box-sizing: border-box;
      }

      .fen-confirm__title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      .fen-confirm__warning {
        margin: 0 0 24px;
        font-size: 14px;
        line-height: 1.5;
        color: #5f6368;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      .fen-confirm__actions {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
      }

      .fen-btn {
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 4px;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .fen-btn--danger {
        background-color: #d92d20;
        color: #ffffff;
      }

      .fen-btn--danger:hover {
        background-color: #b42318;
      }

      .fen-btn--primary {
        background-color: #0f52ba;
        color: #ffffff;
      }

      .fen-btn--primary:hover {
        background-color: #0a3d8a;
      }

      .fen-btn--text {
        background-color: transparent;
        color: #1a1a1a;
      }

      .fen-btn--text:hover {
        background-color: rgba(0, 0, 0, 0.06);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
