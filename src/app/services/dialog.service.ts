import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  confirmDelete(
    mensaje = '¿Está seguro de que desea eliminar este registro?',
    titulo = 'Confirmar eliminación',
    entityName = 'registro'
  ): Observable<boolean> {
    const data: ConfirmDialogData = {
      entityName,
      title: titulo,
      warning: mensaje,
      deleteLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'fen-confirm-dialog-panel',
      backdropClass: 'fen-confirm-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
    });
    return ref.afterClosed();
  }

  confirmAction(
    mensaje = '¿Está seguro de que desea realizar esta acción?',
    titulo = 'Confirmar acción',
    acceptLabel = 'Aceptar'
  ): Observable<boolean> {
    const data: ConfirmDialogData = {
      entityName: '',
      title: titulo,
      warning: mensaje,
      deleteLabel: acceptLabel,
      cancelLabel: 'Cancelar',
      actionType: 'primary',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'fen-confirm-dialog-panel',
      backdropClass: 'fen-confirm-dialog-backdrop',
      autoFocus: false,
      restoreFocus: false,
    });
    return ref.afterClosed();
  }
}
