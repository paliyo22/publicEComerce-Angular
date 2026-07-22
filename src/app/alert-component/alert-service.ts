import { Injectable, signal } from '@angular/core';
import { AlertMessage } from '../../interface/alert-message';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertSignal = signal<AlertMessage | null>(null);

  public state = this.alertSignal.asReadonly();

  reset(){
    this.alertSignal.set(null);
  }

  setAlert(texto: string, tipo: AlertMessage['tipo'] = 'info') {
    this.alertSignal.set({ texto, tipo });

    setTimeout(() => this.reset(), 3000);
  }
}
