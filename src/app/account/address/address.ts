import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { AddressService } from './address-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { validateNewAddressSchema } from '../../../schemas/create-account-schema';
import { AlertService } from '../../alert-component/alert-service';

@Component({
  selector: 'app-address',
  imports: [ReactiveFormsModule],
  templateUrl: './address.html',
  styleUrl: './address.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Address implements OnInit{
  private readonly addressService = inject(AddressService);
  private readonly alertService = inject(AlertService);
  protected readonly addressState = this.addressService.state;
  protected processing = signal(new Set<string>());
  
  private readonly fb = inject(FormBuilder);
  protected addressForm!: FormGroup;

  onClose = output();

  addToSignal(id: string){
    this.processing.update((set) => new Set(set).add(id));
  }

  deleteFromSignal(id: string){
    this.processing.update((set) => {
      const newSet = new Set(set);
      newSet.delete(id);
      return newSet;
    });
  }

  initForms(){
    this.addressForm = this.fb.group({
      address: ['', [Validators.required, Validators.maxLength(100)]],
      apartment: ['', Validators.maxLength(10)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      zip: ['', [Validators.required, Validators.maxLength(10)]],
      country: ['', [Validators.required, Validators.maxLength(100)]]
    });
  };

  ngOnInit(){
    this.initForms();
    this.addressService.getAddressList();
  };

  async onDelete(addressId: string){
    this.addToSignal(addressId);
    const result = await this.addressService.deleteAddress(addressId);
    if(result){
      this.errorManager('eliminar la direccion.', result);
    };
    this.deleteFromSignal(addressId);
    this.alertService.setAlert('Eliminada.', 'success');
  }

  async onConfirm(){
    if(this.addressForm.invalid) return;
    
    const result = validateNewAddressSchema(this.addressForm.value);

    if(!result.success){
      this.alertService.setAlert('Error al procesar la informacion, contactá a soporte técnico.', 'error');
    }else {
      const response = await this.addressService.addAddress(result.output);
      if(response){
        this.initForms();
      };
    };
  };

  onRetry(){
    if(this.addressState().data){
      this.addressService.cleanError();
    }else {
      this.addressService.getAddressList();
    };
  };

  onBack(){
    this.onClose.emit();
  };

  errorManager(action: string, error: string){
    let message: string;
    switch(error){
      case 'TIMEOUT':
        message = 'Error al obtener el resultado. Actualice la pagina e intente nuevamente.';
        break;
      case 'UNAVAILABLE':
        message = 'Actualmente estamos realizando mantenimiento, aguarde unos minutos y vuelva a intentarlo.';
        break;
      case 'INTERNAL_ERROR':
        message = 'Ups! Parece que algo ha fallado, vuelva a intentar. Si el error persiste contacte con soporte.';
        break;
      case 'NOT_FOUND':
        message = 'Ah ocurrido un error grave, recargue la pagina y reintente. Si el error persiste contacte con soporte.';
        break;
      case 'BAD_REQUEST':
        message = 'No se puede realizar esta accion.';
        break;
      case 'PARSE_ERROR':
        message = 'Error al procesar la informacion, contactá a soporte técnico.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de coneccion. Checke su conneccion a internet y reintente.';
        break;
      default:
        message = 'Error al ' + action;
        break;
    };
    this.alertService.setAlert(message, 'error');
  }
}
