import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private msg: MessageService) {}

  success(detail: string, summary = 'Éxito', life = 3000) {
    this.msg.add({ severity: 'success', summary, detail, life });
  }

  error(detail: string, summary = 'Error', life = 5000) {
    this.msg.add({ severity: 'error', summary, detail, life });
  }

  warning(detail: string, summary = 'Advertencia', life = 4000) {
    this.msg.add({ severity: 'warn', summary, detail, life });
  }

  info(detail: string, summary = 'Información', life = 3000) {
    this.msg.add({ severity: 'info', summary, detail, life });
  }
}
