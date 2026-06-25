import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { validateUpdateBusinessSchema, validateUpdateUserSchema } from '../../schemas/create-account-schema';
import { AccountService } from './services/account/account-service';
import { Address } from "./address/address";
import { Store } from './store/store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account',
  imports: [Address, Store, 
    ReactiveFormsModule, CommonModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Account implements OnInit{
  protected readonly accountService = inject(AccountService);
  protected readonly accountState = this.accountService.state;
  private readonly fb = inject(FormBuilder);

  protected updateForm!: FormGroup;
  protected passwordForm!: FormGroup;
  protected cbuForm!: FormGroup;

  private reloadForms = true;
  protected show = signal<'profile' | 'edit' | 'cbu' | 'password' | 'address' | 'stores'>('profile');

  constructor(){
    effect(() => {
      const state = this.accountState();
      if (state.error){
        return;
      };

      if (state.data && !state.loading && this.reloadForms) {
        this.initForms();
        this.show.set('profile');
      }else if(!this.reloadForms){
        this.reloadForms = true;
      }
    });
  }

  private initForms(){
    const state = this.accountState().data!;
    if(state.businessProfile){
      this.updateForm = this.fb.group({
        email: [state.email, [Validators.email, Validators.maxLength(100)]],
        username: [state.username, [Validators.maxLength(50)]],
        businessAccount: this.fb.group({
          title: [state.businessProfile.title, [Validators.minLength(4), Validators.maxLength(50)]],
          bio: [state.businessProfile.bio ?? '', Validators.minLength(10)],
          phone: [state.businessProfile.phone, [Validators.maxLength(50)]],
        })
      });
    }else{
      this.updateForm = this.fb.group({
        email: [state.email, [Validators.email, Validators.maxLength(100)]],
        username: [state.username, [Validators.maxLength(50)]],
        userAccount: this.fb.group({
          firstname: [state.userProfile!.firstname, [Validators.minLength(4), Validators.maxLength(50)]],
          lastname: [state.userProfile!.lastname, [Validators.minLength(4), Validators.maxLength(50)]],
          birth: [state.userProfile!.birth ?? ''],
          phone: [state.userProfile!.phone ?? '', [Validators.maxLength(50)]]
        }) 
      });
    };
    this.resetSensitiveForms();
  }
  private resetSensitiveForms() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
      newPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
    });
    this.cbuForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
      newCBU: ['', [Validators.required, Validators.minLength(22), Validators.maxLength(22)]]
    });
  }
  
  ngOnInit(): void {
    this.accountService.getAccountInfo();
  };

  onChangeTemplate(template: 'profile' | 'edit' | 'cbu' | 'password' | 'address' | 'stores') {
    this.show.set(template);
  };

  onConfirm(){
    if(this.show() === 'edit'){
      this.onEdit();
    }else if(this.show() === 'password') {
      this.onPasswordChange();
    }else {
      this.onCbuChange();
    };
  };

  onCbuChange(){
    if(this.cbuForm.invalid) return;

    const { password, newCBU } = this.cbuForm.value;
    this.accountService.changeCbu(password, newCBU);
    this.resetSensitiveForms();
  };

  onPasswordChange(){
    if(this.passwordForm.invalid) return;

    const { oldPassword, newPassword } = this.passwordForm.value;
    this.accountService.changePassword(oldPassword, newPassword);
    this.resetSensitiveForms();
  };

  onEdit(){
    if(this.updateForm.invalid) return;

    let result;
    if(this.accountState().data!.businessProfile){
      result = validateUpdateBusinessSchema(this.updateForm.value);
    }else{
      result = validateUpdateUserSchema(this.updateForm.value);
    } 
    if(result.success){
      this.accountService.updateAccount(result.output);
    }else{
      // mostrar alerta con errores de valibot.(nunca deberia pasar);
    }
  };

  onCancel() {
    this.show.set('profile');
    //se reinicia el forms para que no quede info almacenada.
    this.initForms();
  }

  onCleanError() {
    this.accountService.cleanError();
    this.reloadForms = false;
  }

  onReload() {
    this.accountService.getAccountInfo();
  }
}
