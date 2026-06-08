import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../services/account/account-service';
import { validateNewBusiness, validateNewUser } from '../../../schemas/create-account-schema';

@Component({
  selector: 'app-account-create',
  imports: [ReactiveFormsModule],
  templateUrl: './create.html',
  styleUrl: './create.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountCreate {
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected accountForm!: FormGroup;

  protected show = signal<'none' | 'user' | 'business'>('none');
  protected state = signal({
    loading: false,
    error: null as string | null
  });

  private initForms(){
    if(this.show() === 'business'){
      this.accountForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
        bio: ['', Validators.minLength(10)],
        phone: ['', [Validators.required, Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        username: ['', [Validators.required, Validators.maxLength(50)]],
        cbu: ['', [Validators.required, Validators.minLength(22), Validators.maxLength(22)]]
      });
    }else{
      this.accountForm = this.fb.group({
        firstname: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
        lastname: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
        birth: [''],
        phone: ['', [Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        username: ['', [Validators.required, Validators.maxLength(50)]],
        cbu: ['', [Validators.required, Validators.minLength(22), Validators.maxLength(22)]]
      });
    };
  };

  onSelectAccount(template: 'none' | 'user' | 'business') {
    this.show.set(template);
    if(template !== 'none'){
      this.initForms();
    }
  };

  onCleanError(){
    this.state.update(() => ({
      loading: false,
      error: null
    }));
  };

  async onConfirm(){    
    if(this.accountForm.invalid) return;
    
    let result
    if(this.show() === 'business'){
      result = validateNewBusiness(this.accountForm.value);
    }else{
      result = validateNewUser(this.accountForm.value);
    };

    if(this.state().loading) return;
    if(result.success){
      this.state.update(() => ({
        loading: true,
        error: null
      }));
      const account = await this.accountService.createAccount(result.output);
      if(!account){
        //alerta con mensaje de cuenta creada correctamente, en caso de que retorne void
        //(implica que se creo pero fallo al encontrar la cuenta, por lo que lei podria llegar a pasar luego de ejecutar la transaccion de creacion) 
        this.router.navigate(['/']);
        // no corrijo el state porque al redirigir, se destruye el componente y por lo tanto no hace falta.
      }else{
        this.state.update(() => ({
          loading: false,
          error: account
        }));
      }
    }else{
      // mensaje de error en lo ingresado.
    };
  }
}
