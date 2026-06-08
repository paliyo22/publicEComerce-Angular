import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../account/services/auth/auth-service';
import { RouterLink } from "@angular/router";


@Component({
  selector: 'app-account-administration',
  imports: [RouterLink],
  templateUrl: './account-administration.html',
  styleUrl: './account-administration.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountAdministration {
  private readonly authService = inject(AuthService);
  protected authState = this.authService.state;
}
