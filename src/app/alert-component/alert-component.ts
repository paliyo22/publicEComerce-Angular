import { Component, inject } from '@angular/core';
import { AlertService } from './alert-service';

@Component({
  selector: 'app-alert-component',
  imports: [],
  templateUrl: './alert-component.html',
  styleUrl: './alert-component.css',
})
export class AlertComponent {
  private alertService = inject(AlertService);
  protected alertState = this.alertService.state;

  close(){
    this.alertService.reset();
  }
}
